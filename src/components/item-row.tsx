import { motion } from "framer-motion";
import type { Item } from "@/lib/mock-data";
import { categoryMeta, expiryTone } from "@/lib/mock-data";

const toneStyles: Record<string, string> = {
  danger: "text-danger",
  warning: "text-warning",
  success: "text-success",
};

const catBg: Record<string, string> = {
  grocery: "bg-grocery/15 border-grocery/20 text-grocery",
  meds: "bg-meds/15 border-meds/20 text-meds",
  beauty: "bg-beauty/15 border-beauty/20 text-beauty",
};

export function ItemRow({ item, index = 0 }: { item: Item; index?: number }) {
  const tone = expiryTone(item.daysLeft);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
    >
      <div
        className={`size-12 sm:size-14 rounded-xl border grid place-items-center text-xl shrink-0 ${catBg[item.category]}`}
      >
        <span>{item.icon}</span>
      </div>
      <div className="min-w-0">
        <h4 className="font-semibold text-foreground truncate">{item.name}</h4>
        <p className="text-xs text-muted-foreground truncate">
          {item.brand} • {item.quantity} • {categoryMeta[item.category].label}
        </p>
      </div>
      <div className="text-right shrink-0">
        <div className={`text-sm font-bold ${toneStyles[tone]}`}>
          {item.daysLeft <= 0
            ? "Expired"
            : item.daysLeft === 1
              ? "1 Day Left"
              : `${item.daysLeft} Days Left`}
        </div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Exp {item.expiresOn}
        </div>
      </div>
    </motion.div>
  );
}
