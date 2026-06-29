import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Camera, Upload, Check, RefreshCw, Plus } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { addItem } from "@/lib/use-items";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [{ title: "Scan — SmartShelf AI" }],
  }),
  component: Scan,
});

function Scan() {
  const navigate = useNavigate();
  const [detected, setDetected] = useState(false);

  return (
    <AppShell>
      <PageHeader title="Scan & Track" subtitle="Point your camera at any barcode, QR, or product label." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner frame */}
        <div className="relative aspect-square rounded-3xl overflow-hidden border border-meds/30 bg-black/40">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(168,85,247,0.15)), repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(255,255,255,0.03) 24px, rgba(255,255,255,0.03) 25px)",
            }}
          />
          {/* corner brackets */}
          <div className="absolute inset-10 grid place-items-center">
            <div className="relative size-56 sm:size-72">
              {["top-0 left-0", "top-0 right-0", "bottom-0 left-0", "bottom-0 right-0"].map((p, i) => (
                <span
                  key={i}
                  className={`absolute ${p} size-10 border-meds`}
                  style={{
                    borderTopWidth: p.includes("top") ? 3 : 0,
                    borderBottomWidth: p.includes("bottom") ? 3 : 0,
                    borderLeftWidth: p.includes("left") ? 3 : 0,
                    borderRightWidth: p.includes("right") ? 3 : 0,
                  }}
                />
              ))}
              <motion.div
                animate={{ y: ["0%", "100%", "0%"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-meds to-transparent shadow-[0_0_20px_rgba(59,130,246,0.7)]"
              />
              <div className="absolute inset-0 grid place-items-center text-meds/70 text-xs font-mono uppercase tracking-widest">
                Align Product
              </div>
            </div>
          </div>

          <div className="absolute top-4 left-4 flex items-center gap-2 text-xs text-meds font-mono uppercase tracking-widest">
            <span className="size-2 rounded-full bg-meds animate-pulse" />
            Live Scanner
          </div>
          <div className="absolute top-4 right-4 text-xs text-muted-foreground font-mono">60 FPS</div>

          <div className="absolute bottom-4 inset-x-4 flex gap-2">
            <button
              onClick={() => setDetected(true)}
              className="flex-1 grid grid-cols-[auto_1fr] items-center gap-2 px-4 py-3 rounded-2xl bg-foreground text-background font-semibold text-sm"
            >
              <Camera className="size-4" />
              <span className="text-left">Detect Item</span>
            </button>
            <button className="px-4 py-3 rounded-2xl glass-card text-foreground font-semibold text-sm grid grid-cols-[auto_1fr] items-center gap-2">
              <Upload className="size-4" />
              <span>Upload</span>
            </button>
          </div>
        </div>

        {/* Result panel */}
        <div className="glass-card rounded-3xl p-6 sm:p-8">
          <p className="text-xs font-bold text-beauty uppercase tracking-widest mb-3">
            {detected ? "AI Detected" : "Awaiting Scan"}
          </p>
          <h3 className="font-display font-bold text-2xl mb-1">
            {detected ? "Kellogg's Corn Flakes" : "Nothing yet"}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {detected ? "Verify the auto-filled details below." : "Detected product will appear here."}
          </p>

          <div className="space-y-3">
            {[
              { label: "Name", value: "Kellogg's Corn Flakes" },
              { label: "Brand", value: "Kellogg's" },
              { label: "Category", value: "Groceries" },
              { label: "Quantity", value: "750g" },
              { label: "Expiry Date", value: "Mar 24, 2026" },
            ].map((f) => (
              <div
                key={f.label}
                className="grid grid-cols-[minmax(0,120px)_minmax(0,1fr)] items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/5"
              >
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  {f.label}
                </span>
                <span className={`text-sm font-medium ${detected ? "text-foreground" : "text-muted-foreground"}`}>
                  {detected ? f.value : "—"}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              disabled={!detected}
              onClick={() => {
                const today = new Date();
                today.setDate(today.getDate() + 90);
                addItem({
                  name: "Kellogg's Corn Flakes",
                  brand: "Kellogg's",
                  category: "grocery",
                  quantity: "750g",
                  expiresOn: today.toISOString().slice(0, 10),
                });
                navigate({ to: "/inventory" });
              }}
              className="grid grid-cols-[auto_1fr] items-center gap-2 px-4 py-3 rounded-2xl bg-grocery text-white font-semibold text-sm disabled:opacity-40"
            >
              <Check className="size-4" /> <span>Save Item</span>
            </button>
            <button
              onClick={() => setDetected(false)}
              className="grid grid-cols-[auto_1fr] items-center gap-2 px-4 py-3 rounded-2xl glass-card text-foreground font-semibold text-sm"
            >
              <RefreshCw className="size-4" /> <span>Rescan</span>
            </button>
          </div>
          <Link
            to="/inventory"
            className="mt-3 w-full grid grid-cols-[auto_1fr] items-center gap-2 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-foreground font-semibold text-sm hover:bg-white/10"
          >
            <Plus className="size-4" /> <span>Add manually in Inventory</span>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
