/**
 * F-058 — Firecrawl discovery adapter.
 * Port of jobHunt/agents/sources/firecrawl_source.py.
 * Uses FIRECRAWL_API_KEY. If absent → available()=false, discover()=[] (never throws).
 */

import { createHash } from "crypto";
import type { JobDiscoveryAdapter, DiscoveryQuery, DiscoveredJob } from "./types.js";

export class FirecrawlAdapter implements JobDiscoveryAdapter {
  readonly name = "firecrawl";

  available(): boolean {
    return !!process.env["FIRECRAWL_API_KEY"];
  }

  async discover(query: DiscoveryQuery): Promise<DiscoveredJob[]> {
    if (!this.available()) {
      console.warn("[discovery:firecrawl] FIRECRAWL_API_KEY not set — returning []");
      return [];
    }

    const apiKey = process.env["FIRECRAWL_API_KEY"]!;
    const baseUrl = process.env["FIRECRAWL_BASE_URL"] ?? "https://api.firecrawl.dev";
    const searchTerm = [...query.keywords, ...query.locations].join(" ");

    try {
      const resp = await fetch(`${baseUrl}/v1/search`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ query: `${searchTerm} jobs`, limit: query.limit }),
        signal: AbortSignal.timeout(20000),
      });
      if (!resp.ok) {
        console.error(`[discovery:firecrawl] search ${resp.status}`);
        return [];
      }
      const data = (await resp.json()) as { data?: Array<{ url?: string; title?: string; markdown?: string; metadata?: Record<string, unknown> }> };
      return (data.data ?? []).map((item) => {
        const url = item.url ?? "";
        return {
          sourceAdapter: this.name,
          externalId: createHash("sha256").update(url).digest("hex").slice(0, 24),
          title: item.title ?? "Untitled role",
          company: (item.metadata?.["company"] as string | undefined) ?? "",
          location: query.locations[0] ?? "",
          jdText: (item.markdown ?? "").slice(0, 20000),
          jdUrl: url,
          postedAt: (item.metadata?.["publishedDate"] as string | undefined) ?? null,
        } satisfies DiscoveredJob;
      });
    } catch (err) {
      console.error("[discovery:firecrawl] error:", err instanceof Error ? err.message : err);
      return [];
    }
  }
}
