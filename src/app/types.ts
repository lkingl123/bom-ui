// =============================
// Shared Types from inFlow API
// =============================

// --- Category ---
export type Category = {
  categoryId: string;
  name: string;
  isDefault?: boolean;
  parentCategoryId?: string;
  timestamp?: string;
};

// --- Cost ---
export type ProductCost = {
  cost: string;
  productCostId?: string;
  productId?: string;
};

// --- Price ---
export type ProductPrice = {
  unitPrice: string;
  priceType: "FixedPrice" | string;
  fixedMarkup?: string;
  pricingSchemeId?: string;
  productPriceId?: string;
  timestamp?: string;
};

// --- Image ---
export type Image = {
  imageId: string;
  originalUrl: string;
  smallUrl?: string;
  mediumUrl?: string;
  mediumUncroppedUrl?: string;
  largeUrl?: string;
  thumbUrl?: string;
};

// =============================
// Product Types
// =============================

// --- Product Summary (list view) ---
export type ProductSummary = {
  productId: string;
  name: string;
  sku?: string;
  description?: string;
  category?: string; // 🔄 plain string
  totalQuantityOnHand?: number;
  isActive?: boolean;
  itemType?: "StockedProduct" | "NonstockedProduct" | "Service";
};

/// --- Quantity wrapper ---
export type QuantityWithUom = {
  quantity: number;
  uom?: string;
};

// --- BOM entry from API (raw) ---
export type ItemBom = {
  itemBomId: string;
  productId: string;       // parent product ID
  childProductId: string;  // component product ID
  quantity: {
    standardQuantity: string;
    uomQuantity: string;
    uom: string;
    serialNumbers: string[];
  };
  timestamp?: string;
};

// --- BOM entry expanded for UI ---
export type BomComponentUI = {
  itemBomId: string;
  childProductId: string;
  name: string;
  sku?: string;
  cost: number;
  quantity: number;
  uom: string;
};



// --- Product Detail (detail view) ---
export type ProductDetail = ProductSummary & {
  autoAssemble?: boolean;
  cost?: ProductCost;
  defaultImageId?: string | null;
  defaultPrice?: ProductPrice;
  images?: Image[];
  remarks?: string;
  standardUomName?: string;
  weight?: string;
  width?: string;
  height?: string;
  length?: string;
  lastModifiedDateTime?: string;
  vendorItems?: any[];
  inventoryLines?: any[];
  itemBoms?: ItemBom[]; 
};

// =============================
// INCI + Component Types
// =============================

// ✅ INCI entry type used everywhere
export type InciEntry = {
  name: string;
  percentage?: string;
};

// --- Component (raw material / ingredient) ---
export type Component = {
  name: string;
  quantity: number; // fraction of 1 (e.g., 0.007 = 0.7%)
  uom: string;
  has_cost: boolean;
  unit_cost: number;
  line_cost: number;

  // optional fields
  sku?: string;
  barcode?: string;
  vendor?: string;
  description?: string;
  category?: string;
  storage_type?: string;
  inci?: InciEntry[];
  remarks?: string;
};

// =============================
// Editable (UI-only) Types
// =============================

export type ComponentEditable = Component;

export type PackagingItemEditable = {
  name: string;
  quantity: number; // units per product
  unit_cost: number; // cost per unit
  line_cost: number; // quantity * unit_cost
};

export type LaborItemEditable = {
  name: string;
  quantity: number;
  cost_per_touch: number;
  line_cost: number;
};

// =============================
// Enriched Product for Calc
// =============================
export type ProductCalc = ProductDetail & {
  packaging_cost?: number;
  labor_cost?: number;
  misc_cost?: number;
  components: ComponentEditable[];

  touch_points?: number;
  cost_per_touch?: number;

  tiered_pricing: Record<string, TieredPricingEntry>;
  bulk_pricing: Record<string, BulkPricingEntry>;

  formula_kg?: number;
  cost_per_kg?: number;
  vendor_suggestions?: string[];

  unit_weight_kg: number;
  cost_per_unit_excel: number;
  total_cost_excel: number;

  base_cost_per_unit: number;
};

// =============================
// Pricing Entries
// =============================
export type TieredPricingEntry = {
  price: number;
  profit: number;
  margin: number;
};

export type BulkPricingEntry = {
  msrp: number;
  profit: number;
  packaging: number;
};

// =============================
// Manufacturing Order Types
// =============================
export type ManufacturingOrderLine = {
  lineId?: string;
  productId: string;
  quantity: number;
  uom?: string;
  remarks?: string;
  manufacturingOrderLines?: ManufacturingOrderLine[];
};

export type ManufacturingOrder = {
  manufacturingOrderId: string;
  manufacturingOrderNumber: string;
  status: "Open" | "InProgress" | "Completed";
  orderDate: string;
  dueDate?: string;
  completedDate?: string;
  remarks?: string;
  pickRemarks?: string;
  putAwayRemarks?: string;
  isCancelled?: boolean;
  isCompleted?: boolean;
  isPrioritized?: boolean;
  locationId?: string;
  primaryFinishedProductId?: string;
  primaryFinishedProduct?: ProductSummary;
  lines?: ManufacturingOrderLine[];
};
