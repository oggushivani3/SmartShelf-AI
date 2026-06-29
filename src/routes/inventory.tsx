import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Plus, X, Trash2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { ItemRow } from "@/components/item-row";
import { categoryMeta, type Category } from "@/lib/mock-data";
import { useItems, addItem, removeItem } from "@/lib/use-items";
import grocery from "@/assets/cat-grocery.jpg";
import medicine from "@/assets/cat-medicine.jpg";
import cosmetic from "@/assets/cat-cosmetic.jpg";

const CAT_IMAGES: Record<Category, string> = {
  grocery,
  meds: medicine,
  beauty: cosmetic,
};

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [{ title: "Inventory — SmartShelf AI" }],
  }),
  component: Inventory,
});

type CatFilter = Category | "all";
type ExpiryFilter = "all" | "soon" | "expired";

function Inventory() {
  const items = useItems();
  const [cat, setCat] = useState<CatFilter>("all");
  const [exp, setExp] = useState<ExpiryFilter>("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    return items
      .filter((i) => (cat === "all" ? true : i.category === cat))
      .filter((i) => {
        if (exp === "soon") return i.daysLeft > 0 && i.daysLeft <= 7;
        if (exp === "expired") return i.daysLeft <= 0;
        return true;
      })
      .filter((i) =>
        query.trim() === ""
          ? true
          : (i.name + " " + i.brand).toLowerCase().includes(query.toLowerCase()),
      )
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [items, cat, exp, query]);

  const cats: { key: CatFilter; label: string; color: string }[] = [
    { key: "all", label: "All", color: "bg-white/10 text-foreground" },
    { key: "grocery", label: "Groceries", color: "bg-grocery/15 text-grocery" },
    { key: "meds", label: "Medicines", color: "bg-meds/15 text-meds" },
    { key: "beauty", label: "Cosmetics", color: "bg-beauty/15 text-beauty" },
  ];

  const exps: { key: ExpiryFilter; label: string }[] = [
    { key: "all", label: "All Items" },
    { key: "soon", label: "Expiring Soon" },
    { key: "expired", label: "Expired" },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Inventory"
        subtitle={`${filtered.length} item${filtered.length !== 1 ? "s" : ""} on your shelves`}
        action={
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground text-background text-sm font-semibold hover:scale-[1.03] transition-transform"
          >
            <Plus className="size-4" /> Add Item
          </button>
        }
      />

      {/* Search */}
      <div className="glass-card rounded-2xl p-2 mb-6 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
        <Search className="size-5 text-muted-foreground ml-3" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or brand..."
          className="bg-transparent outline-none py-2 pr-3 text-sm text-foreground placeholder:text-muted-foreground min-w-0"
        />
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {cats.map((c) => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              cat === c.key ? c.color : "bg-white/5 text-muted-foreground hover:text-foreground"
            }`}
          >
            {c.label}
            {c.key !== "all" && (
              <span className="ml-1.5 opacity-60">
                {items.filter((i) => i.category === (c.key as Category)).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Expiry tabs */}
      <div className="flex items-center gap-2 border-b border-white/5 mb-6">
        <Filter className="size-3.5 text-muted-foreground" />
        {exps.map((e) => (
          <button
            key={e.key}
            onClick={() => setExp(e.key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              exp === e.key
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {e.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <p className="text-foreground font-semibold mb-1">Your shelf is empty</p>
            <p className="text-muted-foreground text-sm mb-5">
              Add your first item to start tracking expiry.
            </p>
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground text-background text-sm font-semibold"
            >
              <Plus className="size-4" /> Add Item
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center text-muted-foreground">
            No items match these filters.
          </div>
        ) : (
          filtered.map((item, i) => (
            <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <ItemRow item={item} index={i} />
              <button
                onClick={() => removeItem(item.id)}
                className="size-10 grid place-items-center rounded-full hover:bg-white/10 text-muted-foreground hover:text-danger"
                aria-label="Remove"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Category legend on bottom */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
        {(["grocery", "meds", "beauty"] as Category[]).map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`glass-card rounded-2xl p-5 text-left relative overflow-hidden group glow-${c === "meds" ? "meds" : c === "beauty" ? "beauty" : "grocery"}`}
          >
            <img
              src={CAT_IMAGES[c]}
              alt=""
              className="absolute -right-6 -bottom-6 size-32 object-cover rounded-2xl opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
            />
            <div className="relative z-10">
              <div className={`size-2 rounded-full bg-${c} mb-3`} />
              <h4 className="font-display font-semibold text-lg">{categoryMeta[c].label}</h4>
              <p className="text-xs text-muted-foreground max-w-[60%]">{categoryMeta[c].description}</p>
            </div>
          </button>
        ))}
      </div>


      <AnimatePresence>
        {open && <AddItemModal onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </AppShell>
  );
}

function AddItemModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState<Category>("grocery");
  const [quantity, setQuantity] = useState("");
  const [expiresOn, setExpiresOn] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !expiresOn) return;
    addItem({ name: name.trim(), brand: brand.trim(), category, quantity: quantity.trim(), expiresOn });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md grid place-items-center p-4"
      onClick={onClose}
    >
      <motion.form
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="glass-card rounded-3xl p-6 w-full max-w-md space-y-4"
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center">
          <h3 className="font-display font-bold text-xl">Add Item</h3>
          <button type="button" onClick={onClose} className="size-9 grid place-items-center rounded-full hover:bg-white/10" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>

        <Field label="Name">
          <input
            autoFocus
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Whole Milk"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-beauty/60"
          />
        </Field>
        <Field label="Brand">
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="e.g. Organic Valley"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-beauty/60"
          />
        </Field>
        <Field label="Category">
          <div className="grid grid-cols-3 gap-2">
            {(["grocery", "meds", "beauty"] as Category[]).map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  category === c
                    ? `bg-${c}/15 text-${c} border-${c}/40`
                    : "bg-white/5 border-white/10 text-muted-foreground"
                }`}
              >
                {categoryMeta[c].label}
              </button>
            ))}
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantity">
            <input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="2L, 100 tabs..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-beauty/60"
            />
          </Field>
          <Field label="Expires on">
            <input
              required
              type="date"
              value={expiresOn}
              onChange={(e) => setExpiresOn(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-beauty/60"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 rounded-2xl glass-card text-foreground font-semibold text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-3 rounded-2xl bg-foreground text-background font-semibold text-sm hover:scale-[1.02] transition-transform"
          >
            Save Item
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
