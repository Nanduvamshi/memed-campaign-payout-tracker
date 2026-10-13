import type { User } from "../types";

const authKey = "memed-auth";

export type AuthState = { token: string; user: User };

export const readAuth = (): AuthState | null => {
  if (typeof window === "undefined") return null;
  const rawValue = window.localStorage.getItem(authKey);
  if (!rawValue) return null;
  try {
    return JSON.parse(rawValue) as AuthState;
  } catch {
    window.localStorage.removeItem(authKey);
    return null;
  }
};

export const saveAuth = (auth: AuthState) => window.localStorage.setItem(authKey, JSON.stringify(auth));
export const clearAuth = () => window.localStorage.removeItem(authKey);
