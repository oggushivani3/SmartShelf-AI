import { useSyncExternalStore } from "react";

export interface AuthUser {
  name: string;
  email: string;
  photoUrl?: string;
}

const KEY = "smartshelf:auth:v1";

type Listener = () => void;
const listeners = new Set<Listener>();

function read(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

let cache: AuthUser | null = read();

function write(next: AuthUser | null) {
  cache = next;
  if (typeof window !== "undefined") {
    if (next) {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } else {
      window.localStorage.removeItem(KEY);
    }
  }
  listeners.forEach((l) => l());
}

function subscribe(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function getSnapshot() {
  return cache;
}

function getServerSnapshot(): AuthUser | null {
  return null;
}

/** Reactive hook — returns the current signed-in user or null. */
export function useAuth(): AuthUser | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Call after a successful Google sign-in. */
export function signIn(user: AuthUser) {
  write(user);
}

/** Clear auth state and sign out. */
export function signOut() {
  write(null);
}

/**
 * Decode a Google ID token (JWT) to extract user info.
 * This only decodes the payload — verification happens on Google's side
 * since we're using Google Identity Services client-side flow.
 */
export function decodeGoogleJwt(credential: string): AuthUser | null {
  try {
    const payload = credential.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return {
      name: decoded.name || decoded.given_name || "User",
      email: decoded.email || "",
      photoUrl: decoded.picture || undefined,
    };
  } catch {
    return null;
  }
}
