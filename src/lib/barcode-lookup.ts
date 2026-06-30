export interface ProductInfo {
  name: string;
  brand: string;
  category: "grocery" | "meds" | "beauty";
  imageUrl?: string;
  quantity?: string;
  estimatedExpiryDate?: string;
}

export function estimateExpiryDate(category: string, name: string): string {
  const now = new Date();
  let daysToAdd = 30;

  const n = name.toLowerCase();

  if (category === "grocery") {
    if (n.includes("milk") || n.includes("bread") || n.includes("fresh")) daysToAdd = 7;
    else if (n.includes("cheese") || n.includes("yogurt") || n.includes("cream")) daysToAdd = 14;
    else if (n.includes("biscuit") || n.includes("cookie") || n.includes("cracker")) daysToAdd = 180;
    else if (n.includes("can") || n.includes("sauce") || n.includes("pasta") || n.includes("rice")) daysToAdd = 365;
    else if (n.includes("snack") || n.includes("chip") || n.includes("namkeen")) daysToAdd = 180;
    else daysToAdd = 90;
  } else if (category === "meds") {
    daysToAdd = 365 * 2;
  } else if (category === "beauty") {
    daysToAdd = 365;
  }

  now.setDate(now.getDate() + daysToAdd);
  return now.toISOString().split("T")[0];
}

/** Try Open Food Facts (global + India region) */
async function tryOpenFoodFacts(barcode: string): Promise<ProductInfo | null> {
  const urls = [
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`,
    `https://in.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`,
  ];

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": "SmartShelfAI/1.0" },
      });
      clearTimeout(timeout);

      if (!res.ok) continue;
      const data = await res.json();
      if (data.status !== 1 || !data.product) continue;

      const p = data.product;
      const name = p.product_name || p.product_name_en || p.product_name_hi || "";
      const brand = p.brands || "";
      const quantity = p.quantity || "";
      const imageUrl = p.image_front_small_url || p.image_url || undefined;

      const cats = (p.categories_tags || []).join(" ").toLowerCase();
      let category: ProductInfo["category"] = "grocery";
      if (cats.includes("medicine") || cats.includes("pharma") || cats.includes("health") || cats.includes("supplement")) {
        category = "meds";
      } else if (cats.includes("cosmetic") || cats.includes("beauty") || cats.includes("skincare") || cats.includes("makeup")) {
        category = "beauty";
      }

      if (!name) continue;
      return { name, brand, category, imageUrl, quantity, estimatedExpiryDate: estimateExpiryDate(category, name) };
    } catch {
      // try next
    }
  }
  return null;
}

/** Try Open Beauty Facts */
async function tryOpenBeautyFacts(barcode: string): Promise<ProductInfo | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(
      `https://world.openbeautyfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`,
      { signal: controller.signal, headers: { "User-Agent": "SmartShelfAI/1.0" } }
    );
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
    const name = p.product_name || "";
    const brand = p.brands || "";
    if (!name) return null;

    return {
      name, brand,
      category: "beauty",
      imageUrl: p.image_front_small_url || undefined,
      quantity: p.quantity || "",
      estimatedExpiryDate: estimateExpiryDate("beauty", name),
    };
  } catch {
    return null;
  }
}

/** Try UPC Item DB (good for Indian/Asian products) */
async function tryUPCItemDB(barcode: string): Promise<ProductInfo | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(barcode)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    const item = data.items?.[0];
    if (!item) return null;

    const name = item.title || "";
    const brand = item.brand || "";
    if (!name) return null;

    const n = name.toLowerCase();
    let category: ProductInfo["category"] = "grocery";
    if (n.includes("medicine") || n.includes("tablet") || n.includes("capsule") || n.includes("syrup")) {
      category = "meds";
    } else if (n.includes("cream") || n.includes("shampoo") || n.includes("lotion") || n.includes("soap") || n.includes("perfume")) {
      category = "beauty";
    }

    return {
      name, brand, category,
      imageUrl: item.images?.[0] || undefined,
      quantity: item.size || "",
      estimatedExpiryDate: estimateExpiryDate(category, name),
    };
  } catch {
    return null;
  }
}

/**
 * Look up a barcode using multiple APIs for maximum coverage of Indian products.
 * Returns product info or null if not found in any database.
 */
export async function lookupBarcode(barcode: string): Promise<ProductInfo | null> {
  // Try all APIs in parallel for speed, return first success
  const results = await Promise.allSettled([
    tryOpenFoodFacts(barcode),
    tryOpenBeautyFacts(barcode),
    tryUPCItemDB(barcode),
  ]);

  for (const r of results) {
    if (r.status === "fulfilled" && r.value) return r.value;
  }

  return null;
}
