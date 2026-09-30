import type { Profile, ProfileInput, User } from "@/domain";
import type { ApiClient } from "@/lib/api/client";

export function createProfileService(api: ApiClient) {
  return {
    /** Sets all required profile fields (used by the "complete profile" step). */
    complete: (input: ProfileInput) => api.put<User>("/me/profile", input),
    /** Partial update of an existing profile. */
    update: (input: Partial<Profile>) => api.patch<User>("/me/profile", input),
  };
}

export type ProfileService = ReturnType<typeof createProfileService>;
