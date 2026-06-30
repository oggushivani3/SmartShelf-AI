import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, ScanLine, Bot, Bell, Shield } from "lucide-react";
import grocery from "@/assets/cat-grocery.jpg";
import medicine from "@/assets/cat-medicine.jpg";
import cosmetic from "@/assets/cat-cosmetic.jpg";
import { useItems } from "@/lib/use-items";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartShelf AI — Scan Today, Save Tomorrow" },
      {
        name: "description",
        content:
          "AI-powered inventory for groceries, medicines & cosmetics. Track expiry, reduce waste, get recipe suggestions.",
      },
      { property: "og:title", content: "SmartShelf AI" },
      { property: "og:description", content: "Scan Today, Save Tomorrow." },
    ],
  }),
  component: Landing,
});

type Cat = {
  title: string;
  description: string;
  img: string;
  color: "grocery" | "meds" | "beauty";
  to: string;
};

const cats: Cat[] = [
  {
    title: "Groceries",
    description: "Track perishables and get AI recipe suggestions based on what's expiring.",
    img: grocery,
    color: "grocery",
    to: "/inventory",
  },
  {
    title: "Medicines",
    description: "Manage prescriptions and home remedies. Never use expired medication again.",
    img: medicine,
    color: "meds",
    to: "/inventory",
  },
  {
    title: "Cosmetics",
    description: "Monitor shelf life of skincare and makeup to protect your skin health.",
    img: cosmetic,
    color: "beauty",
    to: "/inventory",
  },
];

const glowMap: Record<Cat["color"], string> = {
  grocery: "glow-grocery hover:border-grocery/40",
  meds: "glow-meds hover:border-meds/40",
  beauty: "glow-beauty hover:border-beauty/40",
};

const accentMap: Record<Cat["color"], string> = {
  grocery: "bg-grocery/10 text-grocery hover:bg-grocery hover:text-white",
  meds: "bg-meds/10 text-meds hover:bg-meds hover:text-white",
  beauty: "bg-beauty/10 text-beauty hover:bg-beauty hover:text-white",
};

function Landing() {
  const items = useItems();
  const user = useAuth();
  const counts: Record<Cat["color"], number> = {
    grocery: items.filter((i) => i.category === "grocery").length,
    meds: items.filter((i) => i.category === "meds").length,
    beauty: items.filter((i) => i.category === "beauty").length,
  };
  return (
    <div className="min-h-screen text-foreground">
      {/* Top nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-background/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-gradient-to-br from-grocery via-meds to-beauty grid place-items-center">
              <Sparkles className="size-4 text-white/90" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">
              SmartShelf <span className="text-muted-foreground">AI</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#categories" className="hover:text-foreground transition-colors">Categories</a>
            <a href="#preview" className="hover:text-foreground transition-colors">Preview</a>
          </div>
          <Link
            to={user ? "/dashboard" : "/login"}
            className="px-4 py-2 rounded-full bg-foreground text-background text-sm font-semibold hover:scale-[1.03] transition-transform"
          >
            Launch App
          </Link>
        </div>
      </nav>

      <main className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
        {/* Hero */}
        <section className="mb-24">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-beauty mb-6"
          >
            <span className="size-2 rounded-full bg-beauty animate-pulse" />
            AI EXPIRY PREDICTION ACTIVE
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="font-display font-bold text-5xl md:text-7xl tracking-tight text-foreground mb-6 max-w-4xl text-balance"
          >
            Scan Today,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-grocery via-meds to-beauty">
              Save Tomorrow.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed"
          >
            Your intelligent home inventory companion. Reduce waste, save money, and never let a
            product go to waste again.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex flex-wrap items-center gap-4"
          >
            <Link
              to={user ? "/dashboard" : "/login"}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background font-semibold hover:scale-[1.03] transition-transform"
            >
              Launch Dashboard <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/scan"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass-card text-foreground font-medium hover:bg-white/10 transition-colors"
            >
              <ScanLine className="size-4" /> Try Scanner
            </Link>
          </motion.div>
        </section>

        {/* Categories */}
        <section id="categories" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-28">
          {cats.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`glass-card ${glowMap[c.color]} p-6 sm:p-8 rounded-3xl group cursor-pointer transition-all duration-500`}
            >
              <div className={`w-full aspect-square rounded-2xl mb-6 overflow-hidden border border-white/5 bg-${c.color}/5`}>
                <img
                  src={c.img}
                  alt={c.title}
                  loading="lazy"
                  width={768}
                  height={768}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <h3 className="font-display font-bold text-2xl text-foreground mb-2">{c.title}</h3>
              <p className="text-sm text-muted-foreground mb-6">{c.description}</p>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <span className={`text-xs font-bold px-2 py-1 rounded-md bg-${c.color}/10 text-${c.color} justify-self-start`}>
                  {counts[c.color]} {counts[c.color] === 1 ? "ITEM" : "ITEMS"}
                </span>
                <Link
                  to={c.to}
                  className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-white text-black text-xs font-bold transition-colors ${accentMap[c.color]}`}
                >
                  Enter <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </motion.div>
          ))}
        </section>

        {/* Features */}
        <section id="features" className="mb-28">
          <h2 className="font-display font-bold text-3xl md:text-5xl text-foreground mb-3 tracking-tight">
            Built for a smarter shelf.
          </h2>
          <p className="text-muted-foreground text-lg mb-12 max-w-2xl">
            Six AI-powered features working together to eliminate waste.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: ScanLine, title: "Barcode Scanning", text: "Instant detection with AI auto-fill." },
              { icon: Sparkles, title: "AI Expiry Prediction", text: "Smart shelf-life modelling per item." },
              { icon: Bot, title: "Recipe Assistant", text: "Cook with what's about to expire." },
              { icon: Bell, title: "Smart Reminders", text: "Push alerts before it's too late." },
              { icon: Shield, title: "Family Sharing", text: "Sync one shelf across your household." },
              { icon: ArrowRight, title: "Multi-Device Sync", text: "Phone, tablet, web — always in sync." },
            ].map((f) => (
              <div key={f.title} className="glass-card rounded-2xl p-6">
                <div className="size-10 rounded-xl bg-white/5 border border-white/10 grid place-items-center mb-4">
                  <f.icon className="size-5 text-foreground" />
                </div>
                <h4 className="font-display font-semibold text-lg text-foreground mb-1">
                  {f.title}
                </h4>
                <p className="text-sm text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Preview cta */}
        <section id="preview" className="glass-card rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 size-96 bg-beauty/20 blur-3xl rounded-full pointer-events-none" />
          <h2 className="relative font-display font-bold text-3xl md:text-5xl tracking-tight mb-4">
            Ready to clear the shelf?
          </h2>
          <p className="relative text-muted-foreground mb-8 max-w-xl mx-auto">
            Open the dashboard and see how SmartShelf AI keeps every grocery, pill, and serum in
            check.
          </p>
          <Link
            to={user ? "/dashboard" : "/login"}
            className="relative inline-flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background font-semibold hover:scale-[1.03] transition-transform"
          >
            Open Dashboard <ArrowRight className="size-4" />
          </Link>
        </section>
      </main>

      <footer className="border-t border-white/5 py-8 px-6 text-center text-xs text-muted-foreground">
        © 2026 SmartShelf AI. Built for zero-waste living.
      </footer>
    </div>
  );
}
