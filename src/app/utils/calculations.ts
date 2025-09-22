// src/app/utils/calculations.ts

import type {
  ComponentEditable,
  ProductDetail,
  ProductCalc,
  PackagingItemEditable,
} from "../types";

export type CalcOptions = {
  inflowCost?: number;
  touchPoints?: number;
  costPerTouch?: number;
  orderQuantity: number;
  totalOzPerUnit: number;
  gramsPerOz: number;
  baseProfitMargin?: number;
};

export function buildProductCalc(
  detail: ProductDetail,
  components: ComponentEditable[],
  packagingItems: PackagingItemEditable[],
  opts: CalcOptions
): ProductCalc {
  const {
    inflowCost = 0,
    touchPoints = 0,
    costPerTouch = 0,
    orderQuantity,
    totalOzPerUnit,
    gramsPerOz,
    baseProfitMargin = 0.25,
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

  // ===== Formula Stats (recipe weight) =====
  const formulaKg = components.reduce((sum, c) => sum + (c.quantity || 0), 0);
  const costPerKg = formulaKg > 0 ? ingredientCostTotal / formulaKg : 0;

  // ===== Excel-Style Per-Unit Conversion =====
  const unitWeightKg = (totalOzPerUnit * gramsPerOz) / 1000;
  const costPerUnitExcel = costPerKg * unitWeightKg;
  const totalCostExcel = costPerUnitExcel * orderQuantity;

  // ===== Final Base Cost per Unit =====
  const baseCostPerUnit =
    costPerUnitExcel +
    packagingCostTotal / (orderQuantity || 1) +
    inflowCost / (orderQuantity || 1) +
    laborCostPerUnit;

  // ===== Tiered Pricing =====
  const marginMultipliers: Record<number, number> = {
    2500: 1.0,
    5000: 0.9,
    10000: 0.8,
    20000: 0.7,
    50000: 0.6,
    100000: 0.5,
  };

  const tieredPricing: Record<string, { price: number; profit: number }> = {};
  Object.entries(marginMultipliers).forEach(([qty, multiplier]) => {
    const profit = baseCostPerUnit * baseProfitMargin * multiplier;
    const price = baseCostPerUnit + profit;
    tieredPricing[qty] = { price: parseFloat(price.toFixed(3)), profit };
  });

  // ===== Bulk Pricing =====
  const bulkPricing = {
    "2oz - Sample": {
      msrp: 8.21,
      profit: 7.39,
      packaging: 0.28,
      multiplier: 10,
    },
    "16 oz": { msrp: 13.28, profit: 10.62, packaging: 0.4, multiplier: 5 },
    "1 Gal": { msrp: 92.25, profit: 73.8, packaging: 1.38, multiplier: 3.5 },
    "5 Gal": {
      msrp: 297.98,
      profit: 206.29,
      packaging: 8.25,
      multiplier: 3.25,
    },
    "55 Gal": {
      msrp: 2843.2,
      profit: 1809.31,
      packaging: 95.0,
      multiplier: 2.75,
    },
  };

  return {
    ...detail,
    components,
    packaging_cost: packagingCostTotal,
    inflow_cost: inflowCost,
    touch_points: touchPoints,
    cost_per_touch: costPerTouch,
    labor_cost: laborCostTotal,
    formula_kg: formulaKg,          // batch weight
    cost_per_kg: costPerKg,         // ingredient cost per kg
    tiered_pricing: tieredPricing,
    bulk_pricing: bulkPricing,

    // Excel-style
    unit_weight_kg: unitWeightKg,   // product size (kg)
    cost_per_unit_excel: costPerUnitExcel,
    total_cost_excel: totalCostExcel,
  };
}
