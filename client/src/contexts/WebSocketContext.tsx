import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import type { DevicePingStatus, DeviceStatusEvent, MonitorConfig } from '@/types';

// In production (behind nginx), connect to same origin; in dev, connect to backend directly
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:3001');

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  deviceStatuses: Map<string, DevicePingStatus>;
  statusEvents: DeviceStatusEvent[];
  monitorConfig: MonitorConfig | null;
  requestPing: (deviceId: string) => void;
  updateMonitorConfig: (updates: Partial<MonitorConfig>) => void;
  getDeviceStatus: (deviceId: string) => DevicePingStatus | undefined;
  /** Whether sound alerts for critical notifications are enabled */
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

const MAX_EVENTS = 100;

/** Audio alert for critical device failures */
function playAlertSound() {
  try {
    const ctx = new AudioContext();
    // Urgent two-tone alarm
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'square';
      gain.gain.setValueAtTime(0.15, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };
    // Three beeps: high-low-high
    playTone(880, 0, 0.15);
    playTone(660, 0.2, 0.15);
    playTone(880, 0.4, 0.25);
  } catch {
    // Audio not available
  }
}

/** Pleasant ascending chime for critical/high device recovery */
function playRecoverySound() {
  try {
    const ctx = new AudioContext();
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.12, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };
    // Ascending three-note chime: C5 → E5 → G5
    playTone(523, 0, 0.2);
    playTone(659, 0.2, 0.2);
    playTone(784, 0.4, 0.35);
  } catch {
    // Audio not available
  }
}

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [deviceStatuses, setDeviceStatuses] = useState<Map<string, DevicePingStatus>>(new Map());
  const [statusEvents, setStatusEvents] = useState<DeviceStatusEvent[]>([]);
  const [monitorConfig, setMonitorConfig] = useState<MonitorConfig | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem('pscchc-sound-alerts') !== 'false';
    } catch {
      return true;
    }
  });
  const socketRef = useRef<Socket | null>(null);

  // Persist sound preference
  const handleSetSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabled(enabled);
    try { localStorage.setItem('pscchc-sound-alerts', String(enabled)); } catch { /* */ }
  }, []);

  useEffect(() => {
    if (!token) {
      // No token, disconnect
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Connect to WebSocket server
    const s = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
    });

    socketRef.current = s;
    setSocket(s);

    s.on('connect', () => {
      console.log('🔌 WebSocket connected');
      setIsConnected(true);
    });

    s.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    s.on('connect_error', (err) => {
      console.warn('🔌 WebSocket connection error:', err.message);
      setIsConnected(false);
    });

    // Full status batch (on connect / periodic)
    s.on('device:status-batch', (batch: DevicePingStatus[]) => {
      setDeviceStatuses((prev) => {
        const next = new Map(prev);
        for (const entry of batch) {
          next.set(entry.deviceId, entry);
        }
        return next;
      });
    });

    // Individual status update
    s.on('device:status-update', (event: DeviceStatusEvent & { responseTimeMs?: number; securityLevel?: string }) => {
      // Update the status map
      setDeviceStatuses((prev) => {
        const next = new Map(prev);
        const existing = next.get(event.deviceId);
        if (existing) {
          next.set(event.deviceId, {
            ...existing,
            isReachable: event.isReachable,
            lastChecked: event.timestamp,
            lastSeenOnline: event.isReachable ? event.timestamp : existing.lastSeenOnline,
            responseTimeMs: event.responseTimeMs ?? null,
            consecutiveFailures: event.consecutiveFailures,
            status: event.newStatus,
          });
        }
        return next;
      });

      // Add to event log (only status changes)
      if (event.previousStatus !== event.newStatus) {
        setStatusEvents((prev) => {
          const next = [event, ...prev];
          return next.slice(0, MAX_EVENTS);
        });

        // Play recovery sound for critical/high devices coming back online
        const isRecovery = event.previousStatus === 'Offline' && event.newStatus === 'Online';
        const isImportant = event.isCritical || event.securityLevel === 'High' || event.securityLevel === 'Critical';
        if (isRecovery && isImportant && soundEnabled) {
          playRecoverySound();
        }
      }
    });

    // Monitor config
    s.on('monitor:config', (config: MonitorConfig) => {
      setMonitorConfig(config);
    });

    s.on('monitor:config-updated', (config: MonitorConfig) => {
      setMonitorConfig(config);
    });

    // Notification with optional sound
    s.on('notification:new', (notif: { playSound?: boolean; severity?: string; title?: string }) => {
      if (notif.playSound && soundEnabled) {
        playAlertSound();
      }
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Keep sound ref current for the notification handler
  useEffect(() => {
    const s = socketRef.current;
    if (!s) return;

    // Re-register notification handler with current soundEnabled
    const handler = (notif: { playSound?: boolean }) => {
      if (notif.playSound && soundEnabled) {
        playAlertSound();
      }
    };
    s.off('notification:new');
    s.on('notification:new', handler);

    return () => {
      s.off('notification:new', handler);
    };
  }, [soundEnabled]);

  const requestPing = useCallback((deviceId: string) => {
    socketRef.current?.emit('device:request-ping', deviceId);
  }, []);

  const updateMonitorConfig = useCallback((updates: Partial<MonitorConfig>) => {
    socketRef.current?.emit('monitor:update-config', updates);
  }, []);

  const getDeviceStatus = useCallback((deviceId: string) => {
    return deviceStatuses.get(deviceId);
  }, [deviceStatuses]);

  return (
    <WebSocketContext.Provider
      value={{
        socket,
        isConnected,
        deviceStatuses,
        statusEvents,
        monitorConfig,
        requestPing,
        updateMonitorConfig,
        getDeviceStatus,
        soundEnabled,
        setSoundEnabled: handleSetSoundEnabled,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error('useWebSocket must be used within WebSocketProvider');
  return ctx;
}
