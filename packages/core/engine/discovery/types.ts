/**
 * F-058 — Multi-source job discovery types.
 */

export interface DiscoveredJob {
  sourceAdapter: string;
  externalId: string;
  title: string;
  company: string;
  location: string;
  jdText: string;
  jdUrl: string;
  postedAt: string | null;
  legitimacyScore?: number;
  legitimacyTier?: "legitimate" | "caution" | "suspicious";
}

export interface DiscoveryQuery {
  keywords: string[];
  locations: string[];
  companies?: string[];
  limit: number;
}

export interface JobDiscoveryAdapter {
  name: string;
  /** True if the adapter is configured (has its API key / is usable). */
  available(): boolean;
  discover(query: DiscoveryQuery): Promise<DiscoveredJob[]>;
}
