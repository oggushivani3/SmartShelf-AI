import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { Bell, Clock, X, BellOff } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useItems } from "@/lib/use-items";

export const Route = createFileRoute("/reminders")({
  head: () => ({ meta: [{ title: "Reminders — SmartShelf AI" }] }),
  component: Reminders,
});

const catBg: Record<string, string> = {
  grocery: "bg-grocery/15 text-grocery border-grocery/30",
  meds: "bg-meds/15 text-meds border-meds/30",
  beauty: "bg-beauty/15 text-beauty border-beauty/30",
};

function describe(days: number) {
  if (days < 0) return `expired ${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} ago`;
  if (days === 0) return "expires today";
  if (days === 1) return "expires tomorrow";
  return `expires in ${days} days`;
}

function Reminders() {
  const items = useItems();
  const derived = useMemo(
    () =>
      items
        .filter((i) => i.daysLeft <= 7)
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .map((i) => ({
          id: i.id,
          item: i.name,
          message: describe(i.daysLeft),
          category: i.category,
          time: i.expiresOn,
        })),
    [items],
  );
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const list = derived.filter((r) => !dismissed.has(r.id));

  const dismiss = (id: string) =>
    setDismissed((s) => {
      const next = new Set(s);
      next.add(id);
      return next;
    });

  return (
    <AppShell>
      <PageHeader
        title="Smart Reminders"
        subtitle="Push-style alerts for everything about to expire."
        action={
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-muted-foreground">
            <Bell className="size-3.5" /> {list.length} active
          </span>
        }
      />

      <div className="space-y-3 max-w-2xl">
        <AnimatePresence>
          {list.map((r) => (
            <motion.div
              key={r.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 60 }}
              transition={{ duration: 0.3 }}
              className="glass-card rounded-2xl p-4 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4"
            >
              <div className={`size-11 rounded-xl border grid place-items-center ${catBg[r.category]}`}>
                <Bell className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">
                  <span className={`text-${r.category}`}>{r.item}</span> {r.message}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Clock className="size-3" /> {r.time}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => dismiss(r.id)}
                  className="size-9 grid place-items-center rounded-full hover:bg-white/10 text-muted-foreground hover:text-foreground"
                  aria-label="Snooze"
                >
                  <BellOff className="size-4" />
                </button>
                <button
                  onClick={() => dismiss(r.id)}
                  className="size-9 grid place-items-center rounded-full hover:bg-white/10 text-muted-foreground hover:text-foreground"
                  aria-label="Dismiss"
                >
                  <X className="size-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {list.length === 0 && (
          <div className="glass-card rounded-2xl p-12 text-center">
            <BellOff className="size-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">
              {items.length === 0
                ? "Add items to your inventory to get expiry reminders."
                : "You're all caught up. Nothing expiring soon."}
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
