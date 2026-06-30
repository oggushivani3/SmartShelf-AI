export interface ProductInfo {
  name: string;
  brand: string;
  category: "grocery" | "meds" | "beauty";
  imageUrl?: string;
  quantity?: string;
}

/**
 * Look up a barcode using the Open Food Facts API.
 * Returns product info or null if not found.
 */
export async function lookupBarcode(barcode: string): Promise<ProductInfo | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`,
      {
        signal: controller.signal,
        headers: { "User-Agent": "SmartShelfAI/1.0 (https://smartshelf.app)" },
      },
    );
    clearTimeout(timeout);

    if (!res.ok) return null;

    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
    const name = p.product_name || p.product_name_en || "";
    const brand = p.brands || "";
    const quantity = p.quantity || "";
    const imageUrl = p.image_front_small_url || p.image_url || undefined;

    // Try to guess category from Open Food Facts categories
    const cats = (p.categories_tags || []).join(" ").toLowerCase();
    let category: ProductInfo["category"] = "grocery";
    if (
      cats.includes("medicine") ||
      cats.includes("pharma") ||
      cats.includes("health") ||
      cats.includes("supplement")
    ) {
      category = "meds";
    } else if (
      cats.includes("cosmetic") ||
      cats.includes("beauty") ||
      cats.includes("skincare") ||
      cats.includes("makeup")
    ) {
      category = "beauty";
    }

    if (!name) return null;

    return { name, brand, category, imageUrl, quantity };
  } catch {
    return null;
  }
}
