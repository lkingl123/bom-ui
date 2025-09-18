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
  const miscCostPerUnit =
    orderQuantity > 0 ? miscCost / orderQuantity : 0;
  const inflowCostPerUnit =
    orderQuantity > 0 ? inflowCost / orderQuantity : 0;

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
  const costPerKg =
    formulaKg > 0 ? ingredientCostTotal / formulaKg : 0;

  // ===== Tiered Pricing =====
  const profitPerUnit = laborCostPerUnit;
  const tierMultipliers: Record<number, number> = {
    2500: 0.25,
    5000: 0.9,
    10000: 0.8,
    20000: 0.7,
    50000: 0.6,
    100000: 0.7,
  };
  const tiers = [2500, 5000, 10000, 20000, 50000, 100000];
  const tieredPricing: Record<string, number> = {};
  tiers.forEach((qty) => {
    const multiplier = tierMultipliers[qty] ?? 1;
    const tierPrice = baseCostPerUnit + profitPerUnit * multiplier;
    tieredPricing[`${qty}`] = parseFloat(tierPrice.toFixed(3));
  });

  // ===== Bulk Pricing =====
  const bulkMultipliers: Record<string, number> = {
    "2oz Sample": 10,
    "16oz": 5,
    "1 Gal": 3.5,
    "5 Gal": 3.25,
    "55 Gal": 2.75,
  };
  const bulkPricing: Record<string, number> = {};
  Object.entries(bulkMultipliers).forEach(([size, mult]) => {
    bulkPricing[size] = parseFloat(
      (baseCostPerUnit * mult).toFixed(2)
    );
  });

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
    profit_per_unit: profitPerUnit,
    msrp: 0,
    tiered_pricing: tieredPricing,
    bulk_pricing: bulkPricing,
  };
}
