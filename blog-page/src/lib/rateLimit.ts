import { NextApiRequest, NextApiResponse } from 'next';

export function getClientIp(req: NextApiRequest): string {
  // X-Forwarded-For kann mehrere IPs enthalten, erste ist die Client-IP
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (typeof xForwardedFor === 'string' && xForwardedFor.length > 0) {
    return xForwardedFor.split(',')[0].trim();
  }
  if (Array.isArray(xForwardedFor) && xForwardedFor.length > 0) {
    return xForwardedFor[0].split(',')[0].trim();
  }
  // Fallback auf remoteAddress
  return req.socket?.remoteAddress || '';
}

const rateLimitMap = new Map<string, { count: number; last: number }>();

export function rateLimit(req: NextApiRequest, res: NextApiResponse, max = 5, windowMs = 60_000): boolean {
  const ip = getClientIp(req);
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, last: now };
  if (now - entry.last > windowMs) {
    entry.count = 1;
    entry.last = now;
  } else {
    entry.count++;
  }
  rateLimitMap.set(ip, entry);
  if (entry.count > max) {
    res.status(429).json({ error: 'Zu viele Anfragen. Bitte warte kurz.' });
    return true;
  }
  return false;
}
