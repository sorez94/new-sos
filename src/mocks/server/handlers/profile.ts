import { isProfileComplete, type Profile } from "@/domain";
import { now } from "../../db/store";
import { ok, parseBody } from "../http";
import type { RouteDefinition } from "../router";
import { profilePatchSchema, profileSchema } from "../schemas";
import { toPublicUser } from "./shared";

export const profileRoutes: RouteDefinition[] = [
  [
    "PUT",
    "/me/profile",
    ({ req, auth }) => {
      const user = auth.require();
      const profile: Profile = parseBody(profileSchema, req.body);
      user.profile = profile;
      user.isProfileComplete = true;
      user.updatedAt = now();
      return ok(toPublicUser(user));
    },
  ],
  [
    "PATCH",
    "/me/profile",
    ({ req, auth }) => {
      const user = auth.require();
      const patch = parseBody(profilePatchSchema, req.body);
      const merged = { ...user.profile, ...patch, address: { ...user.profile?.address, ...patch.address } } as Partial<Profile>;
      user.profile = merged;
      user.isProfileComplete = isProfileComplete(merged);
      user.updatedAt = now();
      return ok(toPublicUser(user));
    },
  ],
];
