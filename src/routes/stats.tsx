import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { Package, AlertTriangle, Trash2, DollarSign } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useItems } from "@/lib/use-items";

export const Route = createFileRoute("/stats")({
  head: () => ({ meta: [{ title: "Stats — SmartShelf AI" }] }),
  component: Stats,
});

const COLORS = ["oklch(0.72 0.17 162)", "oklch(0.65 0.18 250)", "oklch(0.68 0.20 300)"];

function Stats() {
  const items = useItems();
  const byCat = [
    { name: "Groceries", value: items.filter((i) => i.category === "grocery").length },
    { name: "Medicines", value: items.filter((i) => i.category === "meds").length },
    { name: "Cosmetics", value: items.filter((i) => i.category === "beauty").length },
  ];

  const monthly = [
    { month: "Jan", saved: 42, wasted: 12 },
    { month: "Feb", saved: 58, wasted: 9 },
    { month: "Mar", saved: 71, wasted: 7 },
    { month: "Apr", saved: 88, wasted: 11 },
    { month: "May", saved: 105, wasted: 6 },
    { month: "Jun", saved: 124, wasted: 4 },
  ];

  const efficiency = [{ name: "Efficiency", value: 84, fill: "oklch(0.68 0.2 300)" }];

  const kpis = [
    { label: "Items Tracked", value: items.length, icon: Package, color: "text-foreground" },
    { label: "Expiring Soon", value: items.filter((i) => i.daysLeft <= 7).length, icon: AlertTriangle, color: "text-warning" },
    { label: "Expired", value: items.filter((i) => i.daysLeft <= 0).length, icon: Trash2, color: "text-danger" },
    { label: "Money Saved", value: items.length === 0 ? "$0.00" : "$124.50", icon: DollarSign, color: "text-grocery" },
  ];

  return (
    <AppShell>
      <PageHeader title="Stats" subtitle="Your shelf efficiency over time." />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                {k.label}
              </span>
              <k.icon className={`size-4 ${k.color}`} />
            </div>
            <div className={`font-display font-bold text-3xl ${k.color}`}>{k.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie */}
        <div className="glass-card rounded-3xl p-6">
          <h3 className="font-display font-bold text-lg mb-1">Distribution</h3>
          <p className="text-xs text-muted-foreground mb-4">Items by category</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byCat}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={4}
                  stroke="none"
                >
                  {byCat.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.18 0.012 270)",
                    border: "1px solid oklch(1 0 0 / 0.1)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {byCat.map((c, i) => (
              <div key={c.name} className="text-center">
                <div className="size-2 rounded-full mx-auto mb-1" style={{ background: COLORS[i] }} />
                <p className="text-[11px] text-muted-foreground">{c.name}</p>
                <p className="text-sm font-bold">{c.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Efficiency radial */}
        <div className="glass-card rounded-3xl p-6">
          <h3 className="font-display font-bold text-lg mb-1">Shelf Efficiency</h3>
          <p className="text-xs text-muted-foreground mb-4">Used vs wasted ratio</p>
          <div className="h-60 relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="70%" outerRadius="100%" data={efficiency} startAngle={90} endAngle={-270}>
                <RadialBar background={{ fill: "oklch(1 0 0 / 0.05)" }} dataKey="value" cornerRadius={20} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <div className="text-center">
                <div className="font-display font-bold text-4xl text-foreground">84%</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Efficient
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bar */}
        <div className="glass-card rounded-3xl p-6 lg:col-span-1">
          <h3 className="font-display font-bold text-lg mb-1">This Week</h3>
          <p className="text-xs text-muted-foreground mb-4">Usage by category</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCat}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "oklch(0.62 0.02 270)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "oklch(0.62 0.02 270)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.18 0.012 270)",
                    border: "1px solid oklch(1 0 0 / 0.1)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  cursor={{ fill: "oklch(1 0 0 / 0.03)" }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {byCat.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly trend */}
      <div className="glass-card rounded-3xl p-6 mt-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 mb-4">
          <div className="min-w-0">
            <h3 className="font-display font-bold text-lg">Money Saved Over Time</h3>
            <p className="text-xs text-muted-foreground">Cumulative savings from used vs wasted items</p>
          </div>
          <div className="text-right shrink-0">
            <div className="font-display font-bold text-3xl text-grocery">$124.50</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Last month</div>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "oklch(0.62 0.02 270)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "oklch(0.62 0.02 270)" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.18 0.012 270)",
                  border: "1px solid oklch(1 0 0 / 0.1)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                cursor={{ fill: "oklch(1 0 0 / 0.03)" }}
              />
              <Bar dataKey="saved" name="Saved $" fill="oklch(0.72 0.17 162)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="wasted" name="Wasted $" fill="oklch(0.65 0.22 25)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AppShell>
  );
}
