import { Server as SocketServer } from 'socket.io';
import ping from 'ping';
import prisma from '../utils/prisma';

/** Categories that are considered critical infrastructure — pinged more frequently */
const CRITICAL_CATEGORIES = ['Core Switch', 'Firewall', 'Router', 'Switch', 'Access Point'];

/** Statuses that the monitor is allowed to auto-toggle */
const MONITORABLE_STATUSES = ['Online', 'Offline'];

export interface DevicePingEntry {
  deviceId: string;
  deviceName: string;
  categoryName: string;
  ipAddress: string;
  isReachable: boolean;
  lastChecked: string;
  lastSeenOnline: string | null;
  responseTimeMs: number | null;
  consecutiveFailures: number;
  status: string;
  isCritical: boolean;
  monitoringExcluded: boolean;
}

export interface MonitorConfig {
  pingIntervalMs: number;
  criticalIntervalMs: number;
  pingTimeoutS: number;
  pingRetries: number;
  enabled: boolean;
}

/**
 * Device Monitor Service
 *
 * Continuously pings all managed devices via ICMP and broadcasts
 * real-time status updates through Socket.IO.
 */
export class DeviceMonitorService {
  private io: SocketServer;
  private statusMap: Map<string, DevicePingEntry> = new Map();
  private normalTimer: ReturnType<typeof setInterval> | null = null;
  private criticalTimer: ReturnType<typeof setInterval> | null = null;
  private config: MonitorConfig;
  private running = false;

  constructor(io: SocketServer) {
    this.io = io;
    this.config = {
      pingIntervalMs: parseInt(process.env.PING_INTERVAL_MS || '30000', 10),
      criticalIntervalMs: parseInt(process.env.PING_CRITICAL_INTERVAL_MS || '10000', 10),
      pingTimeoutS: parseInt(process.env.PING_TIMEOUT_S || '2', 10),
      pingRetries: parseInt(process.env.PING_RETRIES || '2', 10),
      enabled: true,
    };
  }

  /** Get current config */
  getConfig(): MonitorConfig {
    return { ...this.config };
  }

  /** Update config at runtime (from Settings UI) */
  updateConfig(updates: Partial<MonitorConfig>) {
    const wasEnabled = this.config.enabled;
    Object.assign(this.config, updates);
    console.log('📡 Monitor config updated:', this.config);

    // If intervals changed or toggled, restart the timers
    if (this.running) {
      this.stopTimers();
      if (this.config.enabled) {
        this.startTimers();
      }
    }
    if (!wasEnabled && this.config.enabled) {
      this.start();
    }
  }

  /** Get the full status map */
  getStatusMap(): DevicePingEntry[] {
    return Array.from(this.statusMap.values());
  }

  /** Start the monitoring service */
  async start() {
    if (this.running) return;
    this.running = true;
    console.log('📡 Device Monitor Service starting...');

    // Load devices from DB
    await this.refreshDeviceList();

    // Run initial check immediately
    if (this.config.enabled) {
      await this.pingAllDevices('critical');
      await this.pingAllDevices('normal');
      this.startTimers();
    }

    // When a new client connects, send them the full status map
    this.io.on('connection', (socket) => {
      socket.emit('device:status-batch', this.getStatusMap());

      // Handle on-demand ping request
      socket.on('device:request-ping', async (deviceId: string) => {
        const entry = this.statusMap.get(deviceId);
        if (entry) {
          await this.pingDevice(entry, true);
        }
      });

      // Handle config update request from settings
      socket.on('monitor:update-config', (updates: Partial<MonitorConfig>) => {
        this.updateConfig(updates);
        this.io.emit('monitor:config-updated', this.getConfig());
      });

      // Send current config
      socket.emit('monitor:config', this.getConfig());
    });

    console.log(`📡 Monitor running | Normal: ${this.config.pingIntervalMs}ms | Critical: ${this.config.criticalIntervalMs}ms`);
  }

  /** Stop the monitoring service */
  stop() {
    this.running = false;
    this.stopTimers();
    console.log('📡 Device Monitor Service stopped');
  }

  /** Refresh the device list from the database */
  async refreshDeviceList() {
    try {
      const devices = await prisma.device.findMany({
        include: { category: true, ipAddresses: true },
      });

      // Build the status map, keeping existing state for known devices
      for (const device of devices) {
        const ip = device.ipAddresses?.[0]?.ipAddress || null;
        if (!ip) continue; // Skip devices without an IP

        const categoryName = device.category?.name || 'Unknown';
        const isCritical = CRITICAL_CATEGORIES.includes(categoryName);
        const existing = this.statusMap.get(device.id);

        this.statusMap.set(device.id, {
          deviceId: device.id,
          deviceName: device.deviceName,
          categoryName,
          ipAddress: ip,
          isReachable: existing?.isReachable ?? device.isReachable,
          lastChecked: existing?.lastChecked ?? (device.lastPingAt?.toISOString() || new Date().toISOString()),
          lastSeenOnline: existing?.lastSeenOnline ?? (device.lastSeenOnline?.toISOString() || null),
          responseTimeMs: existing?.responseTimeMs ?? device.pingResponseMs,
          consecutiveFailures: existing?.consecutiveFailures ?? 0,
          status: device.status,
          isCritical,
          monitoringExcluded: device.monitoringExcluded,
        });
      }

      // Remove devices that no longer exist
      const currentIds = new Set(devices.map((d) => d.id));
      for (const key of this.statusMap.keys()) {
        if (!currentIds.has(key)) {
          this.statusMap.delete(key);
        }
      }

      console.log(`📡 Loaded ${this.statusMap.size} devices for monitoring`);
    } catch (err) {
      console.error('📡 Error refreshing device list:', err);
    }
  }

  /** Notify the monitor that a device was added or updated */
  async onDeviceChanged(deviceId: string) {
    // Reload from DB to pick up new/changed devices
    await this.refreshDeviceList();
    const entry = this.statusMap.get(deviceId);
    if (entry) {
      await this.pingDevice(entry, true);
    }
  }

  /** Notify the monitor that a device was deleted */
  onDeviceDeleted(deviceId: string) {
    this.statusMap.delete(deviceId);
  }

  // ── Private ──────────────────────────────────────────────────

  private startTimers() {
    this.normalTimer = setInterval(() => {
      if (this.config.enabled) this.pingAllDevices('normal');
    }, this.config.pingIntervalMs);

    this.criticalTimer = setInterval(() => {
      if (this.config.enabled) this.pingAllDevices('critical');
    }, this.config.criticalIntervalMs);
  }

  private stopTimers() {
    if (this.normalTimer) { clearInterval(this.normalTimer); this.normalTimer = null; }
    if (this.criticalTimer) { clearInterval(this.criticalTimer); this.criticalTimer = null; }
  }

  private async pingAllDevices(tier: 'critical' | 'normal') {
    const entries = Array.from(this.statusMap.values()).filter((e) =>
      tier === 'critical' ? e.isCritical : !e.isCritical
    );

    // Ping concurrently in batches of 20 to avoid overwhelming the network
    const batchSize = 20;
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);
      await Promise.all(batch.map((entry) => this.pingDevice(entry, false)));
    }
  }

  private async pingDevice(entry: DevicePingEntry, isManual: boolean) {
    const now = new Date();
    let reachable = false;
    let responseTime: number | null = null;

    // Attempt pings with retries
    for (let attempt = 0; attempt <= this.config.pingRetries; attempt++) {
      try {
        const result = await ping.promise.probe(entry.ipAddress, {
          timeout: this.config.pingTimeoutS,
          extra: process.platform === 'win32' ? ['-n', '1'] : ['-c', '1'],
        });

        if (result.alive) {
          reachable = true;
          const t = result.time;
          responseTime = (typeof t === 'number') ? t : (typeof t === 'string' && t !== 'unknown') ? parseFloat(t) : null;
          break;
        }
      } catch {
        // Ping failed, try next attempt
      }
    }

    const previousReachable = entry.isReachable;
    const previousStatus = entry.status;

    // Update entry state
    entry.isReachable = reachable;
    entry.lastChecked = now.toISOString();
    entry.responseTimeMs = responseTime;

    if (reachable) {
      entry.lastSeenOnline = now.toISOString();
      entry.consecutiveFailures = 0;
    } else {
      entry.consecutiveFailures++;
    }

    // Determine if we should update the DB status
    const canAutoToggle = MONITORABLE_STATUSES.includes(entry.status) && !entry.monitoringExcluded;
    let statusChanged = false;

    if (canAutoToggle) {
      if (reachable && entry.status === 'Offline') {
        entry.status = 'Online';
        statusChanged = true;
      } else if (!reachable && entry.consecutiveFailures > this.config.pingRetries && entry.status === 'Online') {
        entry.status = 'Offline';
        statusChanged = true;
      }
    }

    // Persist to database
    try {
      const dbUpdate: Record<string, unknown> = {
        lastPingAt: now,
        isReachable: reachable,
        pingResponseMs: responseTime ? Math.round(responseTime) : null,
      };

      if (reachable) {
        dbUpdate.lastSeenOnline = now;
      }

      if (statusChanged) {
        dbUpdate.status = entry.status;
      }

      await prisma.device.update({
        where: { id: entry.deviceId },
        data: dbUpdate,
      });

      // On status change, create audit log and notification
      if (statusChanged) {
        await this.logStatusChange(entry, previousStatus, entry.status);
        await this.createStatusNotification(entry, previousStatus, entry.status);
      }
    } catch (err) {
      console.error(`📡 DB update failed for ${entry.deviceName}:`, err);
    }

    // Emit real-time updates
    if (statusChanged || previousReachable !== reachable || isManual) {
      const event = {
        id: `evt-${Date.now()}-${entry.deviceId.slice(-4)}`,
        deviceId: entry.deviceId,
        deviceName: entry.deviceName,
        previousStatus,
        newStatus: entry.status,
        isReachable: reachable,
        responseTimeMs: responseTime,
        consecutiveFailures: entry.consecutiveFailures,
        timestamp: now.toISOString(),
        category: entry.categoryName,
        isCritical: entry.isCritical,
      };

      this.io.emit('device:status-update', event);
    }
  }

  private async logStatusChange(entry: DevicePingEntry, previousStatus: string, newStatus: string) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: null, // System-generated
          action: 'UPDATE',
          entityType: 'Device',
          entityId: entry.deviceId,
          previousValue: { status: previousStatus, source: 'ping-monitor' } as any,
          newValue: { status: newStatus, source: 'ping-monitor', responseTimeMs: entry.responseTimeMs } as any,
          ipAddressSource: 'system',
        },
      });
    } catch (err) {
      console.error(`📡 Audit log failed for ${entry.deviceName}:`, err);
    }
  }

  private async createStatusNotification(entry: DevicePingEntry, previousStatus: string, newStatus: string) {
    try {
      const isDown = newStatus === 'Offline';
      const isCriticalDevice = entry.isCritical;

      let severity: string;
      let type: string;
      let title: string;
      let message: string;

      if (isDown && isCriticalDevice) {
        severity = 'critical';
        type = 'device_offline';
        title = `🚨 CRITICAL: ${entry.deviceName} UNREACHABLE`;
        message = `Critical ${entry.categoryName} "${entry.deviceName}" (${entry.ipAddress}) is no longer responding to ping. Immediate attention required.`;
      } else if (isDown) {
        severity = 'error';
        type = 'device_offline';
        title = `⚠️ ${entry.deviceName} Offline`;
        message = `${entry.categoryName} "${entry.deviceName}" (${entry.ipAddress}) is not responding to ping after ${entry.consecutiveFailures} consecutive failures.`;
      } else {
        severity = 'info';
        type = 'device_offline'; // Reuse type for recovery
        title = `✅ ${entry.deviceName} Back Online`;
        message = `${entry.categoryName} "${entry.deviceName}" (${entry.ipAddress}) is now responding. Response time: ${entry.responseTimeMs ?? '?'}ms.`;
      }

      const notification = await prisma.notification.create({
        data: {
          type,
          title,
          message,
          severity,
          userId: null, // Broadcast to all
          referenceId: entry.deviceId,
          referenceType: 'Device',
        },
      });

      // Also push via WebSocket for instant delivery
      this.io.emit('notification:new', {
        ...notification,
        createdAt: notification.createdAt.toISOString(),
        playSound: isDown && isCriticalDevice, // Sound for critical alerts
      });
    } catch (err) {
      console.error(`📡 Notification failed for ${entry.deviceName}:`, err);
    }
  }
}

/** Singleton instance – set after app.ts creates the Socket.IO server */
let monitorInstance: DeviceMonitorService | null = null;

export function getMonitorService(): DeviceMonitorService | null {
  return monitorInstance;
}

export function createMonitorService(io: SocketServer): DeviceMonitorService {
  monitorInstance = new DeviceMonitorService(io);
  return monitorInstance;
}
