// src/app/utils/calculations.ts

import type {
  ComponentEditable,
  ProductDetail,
  ProductCalc,
  PackagingItemEditable,
} from "../types";

type CalcOptions = {
  miscCost?: number;
  inflowCost?: number;
  touchPoints?: number;
  costPerTouch?: number;
  orderQuantity: number;
};

export function buildProductCalc(
  detail: ProductDetail,
  components: ComponentEditable[],
  packagingItems: PackagingItemEditable[],
  opts: CalcOptions
): ProductCalc {
  const {
    miscCost = 0,
    inflowCost = 0,
    touchPoints = 0,
    costPerTouch = 0,
    orderQuantity,
  } = opts;

  // ===== Ingredient Costs =====
  const ingredientCostTotal = components.reduce(
    (sum, c) => sum + (Number(c.line_cost) || 0),
    0
  );
  const ingredientCostPerUnit =
    orderQuantity > 0 ? ingredientCostTotal / orderQuantity : 0;

  // ===== Packaging Costs =====
  const packagingCostTotal = packagingItems.reduce(
    (sum, p) => sum + (p.quantity * p.unit_cost || 0),
    0
  );
  const packagingCostPerUnit =
    orderQuantity > 0 ? packagingCostTotal / orderQuantity : 0;

  // ===== Misc / Inflow =====
  const miscCostPerUnit = orderQuantity > 0 ? miscCost / orderQuantity : 0;
  const inflowCostPerUnit = orderQuantity > 0 ? inflowCost / orderQuantity : 0;

  // ===== Labor =====
  const laborCostPerUnit = touchPoints * costPerTouch;
  const laborCostTotal = laborCostPerUnit * orderQuantity;

  // ===== Final Base Cost per Unit =====
  const baseCostPerUnit =
    ingredientCostPerUnit +
    packagingCostPerUnit +
    miscCostPerUnit +
    inflowCostPerUnit +
    laborCostPerUnit;

  // ===== Formula Stats =====
  const formulaKg = components.reduce((sum, c) => sum + (c.quantity || 0), 0);
  const costPerKg = formulaKg > 0 ? ingredientCostTotal / formulaKg : 0;

  // ===== Tiered Pricing (Excel-style profit per unit) =====
  const profitPerUnitByTier: Record<number, number> = {
    2500: 0.27,
    5000: 0.243,
    10000: 0.216,
    20000: 0.189,
    50000: 0.162,
    100000: 0.189,
  };

  const tiers = Object.keys(profitPerUnitByTier).map(Number);
  const tieredPricing: Record<
    string,
    { price: number; profit: number }
  > = {};

  tiers.forEach((qty) => {
    const profitPerUnit = profitPerUnitByTier[qty];
    const tierPrice = baseCostPerUnit + profitPerUnit;
    tieredPricing[`${qty}`] = {
      price: parseFloat(tierPrice.toFixed(3)),
      profit: profitPerUnit,
    };
  });

  // ===== Bulk Pricing (Excel table) =====
  const bulkPricing: Record<
    string,
    { msrp: number; profit: number; packaging: number; multiplier: number }
  > = {
    "2oz - Sample": { msrp: 8.21, profit: 7.39, packaging: 0.28, multiplier: 10 },
    "16 oz": { msrp: 13.28, profit: 10.62, packaging: 0.40, multiplier: 5 },
    "1 Gal": { msrp: 92.25, profit: 73.8, packaging: 1.38, multiplier: 3.5 },
    "5 Gal": { msrp: 297.98, profit: 206.29, packaging: 8.25, multiplier: 3.25 },
    "55 Gal": { msrp: 2843.2, profit: 1809.31, packaging: 95.0, multiplier: 2.75 },
  };

  return {
    ...detail,
    components,
    packaging_cost: packagingCostTotal,
    misc_cost: miscCost,
    inflow_cost: inflowCost,
    touch_points: touchPoints,
    cost_per_touch: costPerTouch,
    labor_cost: laborCostTotal,
    formula_kg: formulaKg,
    cost_per_kg: costPerKg,
    shipping_cost_per_unit: 0,
    shipping_total: 0,
    profit_per_unit: 0, // now handled per tier
    msrp: 0,
    tiered_pricing: tieredPricing,
    bulk_pricing: bulkPricing,
  };
}
