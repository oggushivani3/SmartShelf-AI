export type Category = "grocery" | "meds" | "beauty";

export type Item = {
  id: string;
  name: string;
  brand: string;
  category: Category;
  quantity: string;
  daysLeft: number;
  expiresOn: string;
  icon: string;
};


export const items: Item[] = [];

export const reminders: {
  id: string;
  item: string;
  message: string;
  category: Category;
  time: string;
}[] = [];


export const recipes = [
  {
    id: "rec1",
    name: "Creamy Spinach Pasta",
    using: ["Whole Milk", "Fresh Spinach"],
    time: "20 min",
    difficulty: "Easy",
    emoji: "🍝",
  },
  {
    id: "rec2",
    name: "Tomato Bruschetta",
    using: ["Sourdough Bread", "Cherry Tomatoes"],
    time: "15 min",
    difficulty: "Easy",
    emoji: "🥖",
  },
  {
    id: "rec3",
    name: "Greek Yogurt Parfait",
    using: ["Greek Yogurt"],
    time: "5 min",
    difficulty: "Easy",
    emoji: "🍨",
  },
  {
    id: "rec4",
    name: "Caprese Salad",
    using: ["Cherry Tomatoes"],
    time: "10 min",
    difficulty: "Easy",
    emoji: "🥗",
  },
];

export const categoryMeta: Record<Category, { label: string; color: string; description: string }> = {
  grocery: { label: "Groceries", color: "grocery", description: "Track perishables and pantry items" },
  meds: { label: "Medicines", color: "meds", description: "Prescriptions and home remedies" },
  beauty: { label: "Cosmetics", color: "beauty", description: "Skincare and beauty products" },
};

export function expiryTone(days: number): "danger" | "warning" | "success" {
  if (days <= 3) return "danger";
  if (days <= 30) return "warning";
  return "success";
}
