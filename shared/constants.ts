export const SHIPPING_FEE_HUF = 2500;

// Sentinel `product_variants.size` value used for products that don't need
// a size choice (e.g. keychains). The DB still requires every purchasable
// item to have exactly one variant row, so a sizeless product gets a single
// variant with this label instead of a real size.
export const SIZELESS_VARIANT_LABEL = "Egyméretes";

// A variant's cut (szabás) — férfi/női cut t-shirts get their own stock,
// unspecified/other products default to "unisex".
export const VARIANT_CUTS = ["unisex", "ferfi", "noi"] as const;
export type VariantCut = (typeof VARIANT_CUTS)[number];

export const CUT_LABELS: Record<VariantCut, string> = {
  unisex: "Unisex",
  ferfi: "Férfi",
  noi: "Női",
};

// A product's category — "polo" products expose size/cut filtering in the
// store, everything else ("egyeb") doesn't.
export const PRODUCT_CATEGORIES = ["polo", "egyeb"] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  polo: "Póló",
  egyeb: "Nem póló",
};

// Combines size + cut into a single display label, e.g. "Férfi M". Unisex
// variants (the default) just show the plain size, matching the pre-cut
// behavior. Callers still need to check for SIZELESS_VARIANT_LABEL
// separately — this helper only handles the size/cut combination.
export function formatSizeCutLabel(size: string, cut: string): string {
  if (!cut || cut === "unisex") {
    return size;
  }

  return `${CUT_LABELS[cut as VariantCut] ?? cut} ${size}`;
}
