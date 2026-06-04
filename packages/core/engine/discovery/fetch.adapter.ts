/**
 * F-058 — Direct-fetch discovery adapter (no API key required).
 * Scrapes a company careers page HTML and extracts job links as a fallback.
 * Always available. Best-effort: returns [] rather than throwing.
 */

import { createHash } from "crypto";
import { safeFetch } from "../safe-fetch.js";
import type { JobDiscoveryAdapter, DiscoveryQuery, DiscoveredJob } from "./types.js";

export class FetchAdapter implements JobDiscoveryAdapter {
  readonly name = "fetch";

  available(): boolean {
    return true;
  }

  async discover(query: DiscoveryQuery): Promise<DiscoveredJob[]> {
    const results: DiscoveredJob[] = [];
    // The fetch adapter discovers from explicit company careers URLs passed as "companies"
    // (each entry may be a careers-page URL). Without URLs it has nothing to scrape.
    for (const company of query.companies ?? []) {
      if (!/^https?:\/\//.test(company)) continue;
      try {
        // [R6] SSRF-safe fetch — careers URLs may be user-supplied.
        const resp = await safeFetch(company, { userAgent: "Trajct/1.0 Job-Discovery" });
        if (resp.statusCode < 200 || resp.statusCode >= 300) continue;
        const html = resp.text;
        const links = this.extractJobLinks(html, company);
        for (const link of links.slice(0, query.limit)) {
          results.push({
            sourceAdapter: this.name,
            externalId: createHash("sha256").update(link.href).digest("hex").slice(0, 24),
            title: link.text || "Role",
            company,
            location: query.locations[0] ?? "",
            jdText: "",
            jdUrl: link.href,
            postedAt: null,
          });
        }
      } catch {
        // best-effort
      }
    }
    return results;
  }

  private extractJobLinks(html: string, base: string): Array<{ href: string; text: string }> {
    const out: Array<{ href: string; text: string }> = [];
    const re = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const href = m[1] ?? "";
      const text = (m[2] ?? "").replace(/<[^>]+>/g, "").trim();
      if (/job|career|position|opening|vacanc|req/i.test(href + " " + text)) {
        const abs = href.startsWith("http") ? href : new URL(href, base).toString();
        out.push({ href: abs, text: text.slice(0, 200) });
      }
    }
    return out;
  }
}
