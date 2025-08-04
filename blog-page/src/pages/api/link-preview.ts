import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import dns from 'dns/promises';
import net from 'net';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL fehlt' });
  }
  try {
    // SSRF-Schutz: Nur http(s) und keine lokalen/private IPs/Hosts (auch nach DNS-Auflösung)
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return res.status(400).json({ error: 'Ungültige URL' });
    }
    if (!/^https?:$/.test(parsed.protocol)) {
      return res.status(400).json({ error: 'Nur http(s)-URLs erlaubt' });
    }
    const forbidden = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1',
    ];
    const host = parsed.hostname;
    // Private IPv4
    if (/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(host)) {
      return res.status(400).json({ error: 'Private IPs nicht erlaubt' });
    }
    if (forbidden.includes(host)) {
      return res.status(400).json({ error: 'Lokale Hosts nicht erlaubt' });
    }
    // IPv6 local
    if (host.startsWith('[') && host.includes('::1')) {
      return res.status(400).json({ error: 'Lokale IPv6 nicht erlaubt' });
    }
    // DNS-Lookup: blockiere private/lokale IPs nach Auflösung
    try {
      const addresses = await dns.lookup(host, { all: true });
      for (const addr of addresses) {
        if (net.isIP(addr.address)) {
          // IPv4 private
          if (/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(addr.address)) {
            return res.status(400).json({ error: 'Private IPs nicht erlaubt (DNS)' });
          }
          // IPv4 loopback
          if (/^(127\.)/.test(addr.address)) {
            return res.status(400).json({ error: 'Loopback-IP nicht erlaubt (DNS)' });
          }
          // IPv6 loopback
          if (addr.address === '::1') {
            return res.status(400).json({ error: 'IPv6 loopback nicht erlaubt (DNS)' });
          }
          // IPv6 private (fc00::/7, fe80::/10)
          if (/^(fc|fd|fe80):/i.test(addr.address.replace(/\:/g, ''))) {
            return res.status(400).json({ error: 'Private IPv6 nicht erlaubt (DNS)' });
          }
        }
      }
    } catch (e) {
      return res.status(400).json({ error: 'DNS-Auflösung fehlgeschlagen' });
    }
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await response.text();
    const $ = cheerio.load(html);
    const getMeta = (name: string) =>
      $(`meta[property='og:${name}']`).attr('content') ||
      $(`meta[name='${name}']`).attr('content') || '';
    const title = getMeta('title') || $('title').text() || '';
    const description = getMeta('description') || '';
    const image = getMeta('image') || '';
    res.status(200).json({ title, description, image, url });
  } catch (e) {
    res.status(500).json({ error: 'Fehler beim Abrufen der Link-Vorschau' });
  }
}
