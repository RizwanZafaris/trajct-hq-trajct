import { Injectable, Logger } from "@nestjs/common";
import type { ProfileUpsert, Profile } from "@trajct/contracts";

/**
 * F-003 — Career profile builder.
 * One profile per user (UNIQUE user_id in candidate_profiles).
 * Visibility/discoverability (F-033) controlled by is_discoverable flag + consent.
 */
@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  async upsertProfile(data: ProfileUpsert, userId: string): Promise<Profile> {
    this.logger.log(`Upsert profile for ${userId}`);
    // TODO: INSERT INTO candidate_profiles ... ON CONFLICT(user_id) DO UPDATE ...
    throw new Error("F-003 not implemented — Sprint 1");
  }

  async getProfile(userId: string): Promise<Profile | null> {
    // TODO: SELECT * FROM candidate_profiles WHERE user_id = userId
    void userId;
    return null;
  }

  async setDiscoverable(userId: string, discoverable: boolean, consentRef: string): Promise<void> {
    this.logger.log(`Set discoverable=${discoverable} for ${userId}`);
    // TODO: UPDATE candidate_profiles SET is_discoverable = discoverable,
    //       consent_discoverable_ref = consentRef, discoverable_since = now()
    //       WHERE user_id = userId
    void consentRef;
  }
}
