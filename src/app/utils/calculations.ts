// src/app/utils/calculations.ts

import type {
  ComponentEditable,
  ProductDetail,
  ProductCalc,
  PackagingItemEditable,
  BulkPricingEntry,
} from "../types";

export type CalcOptions = {
  touchPoints?: number;
  costPerTouch?: number;
  orderQuantity: number;
  totalOzPerUnit: number;
  gramsPerOz: number;

  // ✅ overrides
  bulkOverrides?: Record<string, number>;
  tierMarginOverrides?: Record<string, number>; // now stores profit overrides (not %)
};

export function buildProductCalc(
  detail: ProductDetail,
  components: ComponentEditable[],
  packagingItems: PackagingItemEditable[],
  opts: CalcOptions
): ProductCalc {
  const {
    touchPoints = 0,
    costPerTouch = 0,
    orderQuantity,
    totalOzPerUnit,
    gramsPerOz,
    tierMarginOverrides = {},
  } = opts;

  // ===== Ingredient Costs =====
  const ingredientCostTotal = components.reduce(
    (sum, c) => sum + (Number(c.line_cost) || 0),
    0
  );

  // ===== Packaging Costs =====
  const packagingCostTotal = packagingItems.reduce(
    (sum, p) => sum + (p.quantity * p.unit_cost || 0),
    0
  );

  // ===== Labor =====
  const laborCostPerUnit = touchPoints * costPerTouch;
  const laborCostTotal = laborCostPerUnit * orderQuantity;

  // ===== Formula Stats =====
  const formulaKg = components.reduce((sum, c) => sum + (c.quantity || 0), 0);

  // If the BOM is much less than 1.0, assume remainder is water (cost = 0)
  const normalizedKg = formulaKg < 0.9 ? 1.0 : formulaKg;

  const costPerKg = normalizedKg > 0 ? ingredientCostTotal / normalizedKg : 0;

  // ===== Excel-Style Per-Unit Conversion =====
  const unitWeightKg = (totalOzPerUnit * gramsPerOz) / 1000;
  const costPerUnitExcel = costPerKg * unitWeightKg;
  const totalCostExcel = costPerUnitExcel * orderQuantity;

  // ===== Final Base Cost per Unit =====
  const baseCostPerUnit =
    costPerUnitExcel +
    packagingCostTotal / (orderQuantity || 1) +
    laborCostPerUnit;

  // ===== Tiered Pricing =====
  // discount multipliers applied to the base profit (2500 tier)
  const discountMultipliers: Record<number, number> = {
    2500: 1.0,
    5000: 0.9,
    10000: 0.8,
    20000: 0.7,
    50000: 0.6,
    100000: 0.5,
  };

  const tieredPricing: Record<
    string,
    { price: number; profit: number; margin: number }
  > = {};

  // base profit per unit comes from tierMarginOverrides["2500"]
  // fallback: 20% of base cost
  let baseProfit = tierMarginOverrides["2500"];
  if (baseProfit == null) {
    baseProfit = baseCostPerUnit * 0.2;
  }

  Object.entries(discountMultipliers).forEach(([qty, multiplier]) => {
    const profitPerUnit =
      qty === "2500"
        ? baseProfit
        : parseFloat((baseProfit * multiplier).toFixed(3));

    const price = baseCostPerUnit + profitPerUnit;
    const margin = price > 0 ? profitPerUnit / price : 0;

    tieredPricing[qty] = {
      price: parseFloat(price.toFixed(3)),
      profit: profitPerUnit,
      margin: parseFloat(margin.toFixed(3)),
    };
  });

  // ===== Bulk Pricing =====
  const bulkOptions = [
    { label: "2oz - Sample", sizeKg: 2 / 35.274, packaging: 0.28 },
    { label: "16 oz", sizeKg: 16 / 35.274, packaging: 0.4 },
    { label: "1 Gal", sizeKg: 3.785, packaging: 1.38 },
    { label: "5 Gal", sizeKg: 18.5, packaging: 8.25 },
    { label: "55 Gal", sizeKg: 208.18, packaging: 95.0 },
  ];

  const bulkPricing: Record<string, BulkPricingEntry> = {};
  bulkOptions.forEach(({ label, sizeKg, packaging }) => {
    const effectivePackaging = opts.bulkOverrides?.[label] ?? packaging;
    const baseCost = costPerKg * sizeKg + effectivePackaging;
    const profit = baseCost * 0.2; // simple 20% default profit
    const price = baseCost + profit;

    bulkPricing[label] = {
      msrp: parseFloat(price.toFixed(2)),
      profit: parseFloat(profit.toFixed(2)),
      packaging: effectivePackaging,
    };
  });

  return {
    ...detail,
    components,
    packaging_cost: packagingCostTotal,
    touch_points: touchPoints,
    cost_per_touch: costPerTouch,
    labor_cost: laborCostTotal,
    formula_kg: formulaKg,
    cost_per_kg: costPerKg,
    tiered_pricing: tieredPricing,
    bulk_pricing: bulkPricing,

    // Excel-style
    unit_weight_kg: unitWeightKg,
    cost_per_unit_excel: costPerUnitExcel,
    total_cost_excel: totalCostExcel,
    base_cost_per_unit: baseCostPerUnit,
  };
}
