import { Request } from 'express';

/** Safely extract a string IP from the Express request */
export function getClientIP(req: Request): string {
  const ip = req.ip;
  if (Array.isArray(ip)) return ip[0] || 'unknown';
  return ip || 'unknown';
}

/** Safely extract a string param from req.params (Express 5 returns string | string[]) */
export function getParam(req: Request, name: string): string {
  const val = req.params[name];
  if (Array.isArray(val)) return val[0] || '';
  return val || '';
}
