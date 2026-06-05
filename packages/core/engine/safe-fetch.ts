/**
 * [FIX R6] SSRF-safe URL fetcher.
 *
 * The architect fix is explicit: resolve DNS FIRST, check the RESOLVED IP against private
 * CIDR ranges (not string prefixes — '172.16.' misses 172.17–31.*), and re-validate on
 * every redirect hop. Used by the engine's persona research + job-discovery fetches, and
 * (Sprint B) by the diagnostic / rate-a-job JD fetchers.
 *
 * Note: this resolves-then-checks and re-checks each redirect hop. Pinning the socket to the
 * vetted IP (full DNS-rebinding TOCTOU defence) is a follow-up hardening; the resolve→check
 * + per-hop revalidation satisfies the R6 requirement and blocks the common SSRF vectors.
 */

import { lookup } from "node:dns/promises";

export class SSRFBlockedError extends Error {
  constructor(reason: string) {
    super(`SSRF blocked: ${reason}`);
    this.name = "SSRFBlockedError";
  }
}

export interface SafeFetchResult {
  text: string;
  finalUrl: string;
  statusCode: number;
}

// Private / link-local / loopback ranges — CIDR, not string prefix.
const BLOCKED_V4_CIDRS: Array<[string, number]> = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],   // CGNAT
  ["127.0.0.0", 8],     // loopback
  ["169.254.0.0", 16],  // link-local (cloud metadata 169.254.169.254)
  ["172.16.0.0", 12],   // private — covers 172.16–31.*
  ["192.0.0.0", 24],
  ["192.168.0.0", 16],  // private
];

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const o = Number(p);
    if (!Number.isInteger(o) || o < 0 || o > 255) return null;
    n = (n << 8) | o;
  }
  return n >>> 0;
}

function inCidrV4(ip: string, base: string, bits: number): boolean {
  const ipInt = ipv4ToInt(ip);
  const baseInt = ipv4ToInt(base);
  if (ipInt === null || baseInt === null) return false;
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (ipInt & mask) === (baseInt & mask);
}

/** True if an IP literal is private / loopback / link-local (IPv4 or IPv6). */
export function isPrivateIp(ip: string): boolean {
  // IPv6
  if (ip.includes(":")) {
    const v = ip.toLowerCase();
    if (v === "::1" || v === "::") return true;                 // loopback / unspecified
    if (v.startsWith("fe80") || v.startsWith("fc") || v.startsWith("fd")) return true; // link-local / ULA
    // IPv4-mapped IPv6 (::ffff:a.b.c.d)
    const mapped = v.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped?.[1]) return isPrivateIp(mapped[1]);
    return false;
  }
  return BLOCKED_V4_CIDRS.some(([base, bits]) => inCidrV4(ip, base, bits));
}

/** Resolve a hostname to all IPs and reject if any resolves to a private range. */
async function assertHostPublic(hostname: string): Promise<void> {
  // An IP literal host: check directly.
  if (/^[\d.]+$/.test(hostname) || hostname.includes(":")) {
    if (isPrivateIp(hostname)) throw new SSRFBlockedError(`host ${hostname} is a private IP`);
    return;
  }
  let addrs;
  try {
    addrs = await lookup(hostname, { all: true });
  } catch {
    throw new SSRFBlockedError(`DNS resolution failed for ${hostname}`);
  }
  if (addrs.length === 0) throw new SSRFBlockedError(`no DNS records for ${hostname}`);
  for (const a of addrs) {
    if (isPrivateIp(a.address)) {
      throw new SSRFBlockedError(`${hostname} resolves to private IP ${a.address}`);
    }
  }
}

export interface SafeFetchOptions {
  timeoutMs?: number;
  maxRedirects?: number;
  userAgent?: string;
  maxBytes?: number;
}

/**
 * Fetch a URL with SSRF protection. Resolves+checks the host (and every redirect hop)
 * against private ranges before connecting. Throws SSRFBlockedError on a private target.
 */
export async function safeFetch(rawUrl: string, opts: SafeFetchOptions = {}): Promise<SafeFetchResult> {
  const timeoutMs = opts.timeoutMs ?? 8000;
  const maxRedirects = opts.maxRedirects ?? 3;
  const userAgent = opts.userAgent ?? "Trajct/1.0 JD-Fetcher";
  const maxBytes = opts.maxBytes ?? 5 * 1024 * 1024;

  let url = rawUrl;
  for (let hop = 0; hop <= maxRedirects; hop++) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new SSRFBlockedError(`invalid URL: ${url}`);
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new SSRFBlockedError(`disallowed protocol: ${parsed.protocol}`);
    }

    // [R6] resolve-then-check this hop's host BEFORE connecting.
    await assertHostPublic(parsed.hostname);

    const resp = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: { "User-Agent": userAgent },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (resp.status >= 300 && resp.status < 400) {
      const location = resp.headers.get("location");
      if (!location) return { text: "", finalUrl: url, statusCode: resp.status };
      url = new URL(location, url).toString();   // re-loop → re-validate next hop
      continue;
    }

    // Terminal response — read body with a byte cap.
    const reader = resp.body?.getReader();
    if (!reader) {
      const text = await resp.text();
      return { text: text.slice(0, maxBytes), finalUrl: url, statusCode: resp.status };
    }
    let received = 0;
    const chunks: Uint8Array[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        received += value.length;
        chunks.push(value);
        if (received >= maxBytes) { await reader.cancel(); break; }
      }
    }
    const text = new TextDecoder().decode(concat(chunks)).slice(0, maxBytes);
    return { text, finalUrl: url, statusCode: resp.status };
  }
  throw new SSRFBlockedError(`too many redirects (> ${maxRedirects})`);
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}
