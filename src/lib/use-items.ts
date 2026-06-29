import { useSyncExternalStore } from "react";
import type { Category, Item } from "./mock-data";

const KEY = "smartshelf:items:v1";

type Listener = () => void;
const listeners = new Set<Listener>();

function read(): Item[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Item[];
  } catch {
    return [];
  }
}

let cache: Item[] = read();

function write(next: Item[]) {
  cache = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(next));
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
function getServerSnapshot(): Item[] {
  return [];
}

export function useItems() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

const ICONS: Record<Category, string> = {
  grocery: "🥗",
  meds: "💊",
  beauty: "🧴",
};

export function addItem(input: {
  name: string;
  brand: string;
  category: Category;
  quantity: string;
  expiresOn: string; // YYYY-MM-DD
  icon?: string;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(input.expiresOn);
  const daysLeft = Math.round((d.getTime() - today.getTime()) / 86400000);
  const item: Item = {
    id: crypto.randomUUID(),
    name: input.name,
    brand: input.brand,
    category: input.category,
    quantity: input.quantity,
    daysLeft,
    expiresOn: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    icon: input.icon || ICONS[input.category],
  };
  write([item, ...cache]);
  return item;
}

export function removeItem(id: string) {
  write(cache.filter((i) => i.id !== id));
}

export function clearItems() {
  write([]);
}
