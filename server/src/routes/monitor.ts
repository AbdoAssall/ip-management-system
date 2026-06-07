import { Router } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { getMonitorService } from '../services/deviceMonitor';

const router = Router();

/**
 * GET /api/monitor/status
 * Returns the current ping status map for all devices
 */
router.get('/status', authenticate, async (_req, res) => {
  const monitor = getMonitorService();
  if (!monitor) {
    res.status(503).json({ error: 'Monitor service not running' });
    return;
  }
  res.json(monitor.getStatusMap());
});

/**
 * GET /api/monitor/config
 * Returns the current monitor configuration
 */
router.get('/config', authenticate, async (_req, res) => {
  const monitor = getMonitorService();
  if (!monitor) {
    res.status(503).json({ error: 'Monitor service not running' });
    return;
  }
  res.json(monitor.getConfig());
});

/**
 * PUT /api/monitor/config
 * Update monitor configuration (Admin/IT Manager only)
 */
router.put('/config', authenticate, authorize('Admin', 'IT Manager'), async (req: AuthRequest, res) => {
  const monitor = getMonitorService();
  if (!monitor) {
    res.status(503).json({ error: 'Monitor service not running' });
    return;
  }

  const { pingIntervalMs, criticalIntervalMs, pingTimeoutS, pingRetries, enabled } = req.body;
  const updates: Record<string, unknown> = {};

  if (pingIntervalMs !== undefined) updates.pingIntervalMs = Number(pingIntervalMs);
  if (criticalIntervalMs !== undefined) updates.criticalIntervalMs = Number(criticalIntervalMs);
  if (pingTimeoutS !== undefined) updates.pingTimeoutS = Number(pingTimeoutS);
  if (pingRetries !== undefined) updates.pingRetries = Number(pingRetries);
  if (enabled !== undefined) updates.enabled = Boolean(enabled);

  monitor.updateConfig(updates);
  res.json(monitor.getConfig());
});

/**
 * POST /api/monitor/ping/:deviceId
 * Trigger an on-demand ping for a single device
 */
router.post('/ping/:deviceId', authenticate, async (req, res) => {
  const monitor = getMonitorService();
  if (!monitor) {
    res.status(503).json({ error: 'Monitor service not running' });
    return;
  }

  const deviceId = Array.isArray(req.params.deviceId) ? req.params.deviceId[0] : req.params.deviceId;
  if (!deviceId) {
    res.status(400).json({ error: 'Device ID required' });
    return;
  }

  await monitor.onDeviceChanged(deviceId);
  const statusMap = monitor.getStatusMap();
  const entry = statusMap.find((e) => e.deviceId === deviceId);
  if (!entry) {
    res.status(404).json({ error: 'Device not found in monitor' });
    return;
  }
  res.json(entry);
});

/**
 * POST /api/monitor/refresh
 * Force reload of the device list from the database
 */
router.post('/refresh', authenticate, authorize('Admin', 'IT Manager'), async (_req, res) => {
  const monitor = getMonitorService();
  if (!monitor) {
    res.status(503).json({ error: 'Monitor service not running' });
    return;
  }

  await monitor.refreshDeviceList();
  res.json({ message: 'Device list refreshed', count: monitor.getStatusMap().length });
});

export default router;
