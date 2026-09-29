"use client";

import { createContext, useContext, type ReactNode } from "react";

export type ShellUser = {
  id: string;
  username: string;
  fullName: string | null;
  avatar: string | null;
  email: string;
  role: string;
};

const CurrentUserContext = createContext<ShellUser | null>(null);

export function CurrentUserProvider({ user, children }: { user: ShellUser; children: ReactNode }) {
  return <CurrentUserContext.Provider value={user}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser() {
  const user = useContext(CurrentUserContext);
  if (!user) throw new Error("useCurrentUser must be used inside the app shell");
  return user;
}

export function initialsOf(user: Pick<ShellUser, "fullName" | "username">) {
  return (user.fullName || user.username).slice(0, 2).toUpperCase();
}
