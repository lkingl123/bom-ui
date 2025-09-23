// =============================
// API Types
// =============================

// Product shape from the LIST endpoint (/products?sort_by=...)
export type ProductSummary = {
  name: string; // product name in list view
  sku: string;
  cost: number; // base cost
  components: number; // just a count in list view
  category: string;
  remarks: string;
};

// Component entry from the DETAIL endpoint
export type Component = {
  name: string;
  quantity: number;   // stored as fraction of 1 (e.g., 0.007 = 0.7%)
  uom: string;
  has_cost: boolean;
  unit_cost: number;
  line_cost: number;

  // ✅ optional fields from /ingredients/{ingredient_name}
  sku?: string;
  barcode?: string;
  vendor?: string;
  description?: string;
  category?: string;
  storage_type?: string;
  inci?: string;
  remarks?: string;
};

// Product shape from the DETAIL endpoint (/products/{name})
export type ProductDetail = {
  product_name: string;
  sku: string;
  barcode: string;
  components: Component[];
  component_count: number;
  calculated_cost: number;
  is_complete: boolean;
  has_suspicious_quantities: boolean;
  description: string;
  remarks: string;
  print_ingredients: string;
  print_title: string;
  category: string;

  // ✅ prepare for future
  inci?: string;
};

// =============================
// Frontend-Only Types
// =============================

// Editable version of Component for UI
// ⚡ No percent field here — we compute it from `quantity` in the UI
export type ComponentEditable = Component;

// Enriched product type for calculations & quotes
export type ProductCalc = ProductDetail & {
  packaging_cost?: number;
  labor_cost?: number;
  misc_cost?: number;
  inflow_cost?: number;
  components: ComponentEditable[];

  // Labor breakdown
  touch_points?: number;
  cost_per_touch?: number;

  // Pricing tables
  tiered_pricing: Record<string, TieredPricingEntry>;
  bulk_pricing: Record<string, BulkPricingEntry>;

  // Formula / vendor details
  formula_kg?: number;
  cost_per_kg?: number;
  vendor_suggestions?: string[];

  // ✅ Excel-style fields
  unit_weight_kg: number;
  cost_per_unit_excel: number;
  total_cost_excel: number;

  base_cost_per_unit: number;
};

// Editable packaging item for UI
export type PackagingItemEditable = {
  name: string;
  quantity: number; // how many units per product
  unit_cost: number; // cost per unit
  line_cost: number; // calculated (quantity * unit_cost)
};

// Editable labor item for UI
export type LaborItemEditable = {
  name: string;
  quantity: number;
  cost_per_touch: number; // $
  line_cost: number;
};

// =============================
// Pricing Entries
// =============================

export type TieredPricingEntry = {
  price: number;
  profit: number;
  margin: number; // ✅ new
};

export type BulkPricingEntry = {
  msrp: number;
  profit: number;
  packaging: number;
};
