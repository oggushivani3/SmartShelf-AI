import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ScanLine, ArrowRight, TrendingUp, AlertTriangle, Package, DollarSign, Plus } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { ItemRow } from "@/components/item-row";
import { useItems } from "@/lib/use-items";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SmartShelf AI" },
      { name: "description", content: "Your smart shelf overview, expiring items, and AI suggestions." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const items = useItems();
  const expiring = [...items].sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 4);
  const expiringCount = items.filter((i) => i.daysLeft <= 7).length;
  const stats = [
    { label: "Items Tracked", value: items.length, icon: Package, tone: "text-foreground" },
    { label: "Expiring Soon", value: expiringCount, icon: AlertTriangle, tone: "text-danger" },
    { label: "Money Saved", value: items.length === 0 ? "$0.00" : "$124.50", icon: DollarSign, tone: "text-grocery" },
    { label: "Efficiency", value: items.length === 0 ? "—" : "84%", icon: TrendingUp, tone: "text-beauty" },
  ];


  return (
    <AppShell>
      <PageHeader
        title="Hello, Alex 👋"
        subtitle={
          items.length === 0
            ? "Your shelf is empty. Add your first item to get started."
            : `${expiringCount} item${expiringCount !== 1 ? "s" : ""} need attention. Here's your shelf overview.`
        }
        action={
          <Link
            to="/scan"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground text-background text-sm font-semibold hover:scale-[1.03] transition-transform"
          >
            <ScanLine className="size-4" /> Scan
          </Link>
        }
      />

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                {s.label}
              </span>
              <s.icon className={`size-4 ${s.tone}`} />
            </div>
            <div className={`font-display font-bold text-2xl ${s.tone}`}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: list */}
        <div className="lg:col-span-8 space-y-3">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 mb-2">
            <h2 className="font-display font-bold text-2xl truncate">Expiring Soon</h2>
            <Link to="/inventory" className="text-sm text-muted-foreground hover:text-foreground shrink-0">
              View all →
            </Link>
          </div>
          {expiring.length === 0 ? (
            <div className="glass-card rounded-2xl p-10 text-center">
              <p className="text-foreground font-semibold mb-1">No items yet</p>
              <p className="text-muted-foreground text-sm mb-5">Add items to see what's expiring soon.</p>
              <Link
                to="/inventory"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground text-background text-sm font-semibold"
              >
                <Plus className="size-4" /> Add Item
              </Link>
            </div>
          ) : (
            expiring.map((item, i) => <ItemRow key={item.id} item={item} index={i} />)
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Scan card */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-beauty/80 to-meds/80 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="size-12 rounded-full bg-white/20 grid place-items-center mb-5">
                <ScanLine className="size-6 text-white" />
              </div>
              <h3 className="font-display font-bold text-2xl mb-2">Scan New Item</h3>
              <p className="text-white/80 text-sm mb-6">
                Instant AI detection for groceries, meds, or cosmetics.
              </p>
              <Link
                to="/scan"
                className="block w-full text-center py-3 bg-white text-black font-bold rounded-2xl hover:scale-[1.02] transition-transform"
              >
                Open Camera
              </Link>
            </div>
            <div className="absolute -right-6 -bottom-6 size-40 bg-white/10 rounded-full blur-3xl" />
          </div>

          {/* AI tip */}
          <div className="glass-card rounded-3xl p-6 border-l-4 border-l-beauty">
            <p className="text-xs font-bold text-beauty mb-2 tracking-wider">AI SUGGESTION</p>
            <p className="text-sm text-foreground italic mb-4 leading-relaxed">
              {items.length === 0
                ? "Add a few items and I'll suggest recipes based on what's about to expire."
                : expiringCount > 0
                  ? `You have ${expiringCount} item${expiringCount !== 1 ? "s" : ""} expiring soon — ask the AI Chef for ideas.`
                  : "Nothing expiring soon. Great job keeping your shelf fresh!"}
            </p>
            <Link
              to="/assistant"
              className="text-xs font-bold text-foreground inline-flex items-center gap-2 hover:text-beauty transition-colors"
            >
              ASK AI CHEF <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
