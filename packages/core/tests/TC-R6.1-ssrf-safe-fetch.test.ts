/**
 * TC-R6.1 — SSRF-safe fetch private-range detection (architect fix R6).
 *
 * - CIDR matching, not string prefix: 172.17.x.x is private (the prefix '172.16.' misses it)
 * - loopback / link-local / private / CGNAT / IPv6 loopback all blocked
 * - public IPs pass
 * - cloud metadata 169.254.169.254 blocked
 *
 * Covers: R6 (the resolve-then-check + redirect revalidation is exercised at runtime;
 * here we unit-test the IP classifier which is the security-critical core).
 */

import { describe, it, expect } from "vitest";
import { isPrivateIp, SSRFBlockedError, safeFetch } from "../engine/safe-fetch.js";

describe("TC-R6.1 SSRF private-range detection (CIDR, not prefix)", () => {
  it("blocks the full 172.16.0.0/12 range — incl. 172.17–31 that a prefix misses", () => {
    expect(isPrivateIp("172.16.0.1")).toBe(true);
    expect(isPrivateIp("172.17.5.5")).toBe(true);   // the prefix-matching bug
    expect(isPrivateIp("172.31.255.254")).toBe(true);
    expect(isPrivateIp("172.32.0.1")).toBe(false);  // just outside /12 → public
  });

  it("blocks loopback, link-local, private, CGNAT", () => {
    expect(isPrivateIp("127.0.0.1")).toBe(true);
    expect(isPrivateIp("10.1.2.3")).toBe(true);
    expect(isPrivateIp("192.168.1.1")).toBe(true);
    expect(isPrivateIp("169.254.169.254")).toBe(true); // cloud metadata endpoint
    expect(isPrivateIp("100.64.0.1")).toBe(true);      // CGNAT
    expect(isPrivateIp("0.0.0.0")).toBe(true);
  });

  it("blocks IPv6 loopback and link-local", () => {
    expect(isPrivateIp("::1")).toBe(true);
    expect(isPrivateIp("fe80::1")).toBe(true);
    expect(isPrivateIp("fc00::1")).toBe(true);
    expect(isPrivateIp("::ffff:127.0.0.1")).toBe(true); // v4-mapped loopback
  });

  it("allows public IPs", () => {
    expect(isPrivateIp("8.8.8.8")).toBe(false);
    expect(isPrivateIp("1.1.1.1")).toBe(false);
    expect(isPrivateIp("203.0.113.10")).toBe(false);
  });

  it("safeFetch rejects an IP-literal URL in a private range", async () => {
    await expect(safeFetch("http://169.254.169.254/latest/meta-data/")).rejects.toBeInstanceOf(SSRFBlockedError);
    await expect(safeFetch("http://127.0.0.1:6379/")).rejects.toBeInstanceOf(SSRFBlockedError);
  });

  it("safeFetch rejects non-http(s) protocols", async () => {
    await expect(safeFetch("file:///etc/passwd")).rejects.toBeInstanceOf(SSRFBlockedError);
    await expect(safeFetch("gopher://evil/")).rejects.toBeInstanceOf(SSRFBlockedError);
  });
});
