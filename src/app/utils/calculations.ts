import type { Component } from "../types";

export function calculateBaseCost(components: Component[]): number {
  return components.reduce((sum, c) => sum + (c.line_cost || 0), 0);
}

export function calculateLaborCost(touchPoints: number, costPerTouch: number): number {
  return touchPoints * costPerTouch;
}

export function calculatePackagingCost(packagingItems: { name: string; cost: number }[]): number {
  return packagingItems.reduce((sum, p) => sum + (p.cost || 0), 0);
}

export function calculateUnitCost(
  baseCost: number,
  packagingCost: number,
  laborCost: number,
  miscCost: number
): number {
  return baseCost + packagingCost + laborCost + miscCost;
}

export function calculateProfit(unitPrice: number, unitCost: number): number {
  return unitPrice - unitCost;
}

export function getBulkPricing(unitCost: number): { qty: number; price: number; profit: number }[] {
  const tiers = [
    { qty: 2500, price: 1.35 },
    { qty: 5000, price: 1.32 },
    { qty: 10000, price: 1.30 },
    { qty: 20000, price: 1.27 },
    { qty: 50000, price: 1.24 },
    { qty: 100000, price: 1.27 },
  ];

  return tiers.map((t) => ({
    qty: t.qty,
    price: t.price,
    profit: calculateProfit(t.price, unitCost),
  }));
}
