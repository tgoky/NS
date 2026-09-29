import type { User } from "@/db/schema";
import type { UserPermissions } from "@/lib/types";

/** Calculates permissions from the user's role. */
export function getUserPermissions(user: Pick<User, "role">): UserPermissions {
  const base = {
    role: user.role,
    canViewAddress: false, // Could be true only after item request approval
    canMessageUsers: true,
    maxActiveListings: 5,
  };

  switch (user.role) {
    case "GIVER":
      return { ...base, canListItems: true, canRequestItems: false, maxActiveListings: 20 };
    case "RECEIVER":
      return { ...base, canListItems: false, canRequestItems: true, maxActiveListings: 0 };
    case "BOTH":
      return { ...base, canListItems: true, canRequestItems: true, maxActiveListings: 15 };
    default:
      return { ...base, canListItems: false, canRequestItems: false, canMessageUsers: false };
  }
}
