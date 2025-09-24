// src/app/components/ProductDetailClient.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import IngredientTable from "./IngredientTable";
import PackagingTable from "./PackagingTable";
import ExportClientPDFButton from "./ExportClientPDFButton";
import ExportInternalPDFButton from "./ExportInternalPDFButton";
import CalculatorWidget from "./CalculatorWidget";
import LoadingSpinner from "./LoadingSpinner";
import { RotateCcw } from "lucide-react";
import type {
  Component,
  ComponentEditable,
  PackagingItemEditable,
  ProductDetail,
  ProductCalc,
  InciEntry,
} from "../types";
import { buildProductCalc } from "../utils/calculations";

// ✅ Simple debounce hook
function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

export default function ProductDetailClient({
  name,
}: {
  name: string;
}): React.ReactElement {
  const [product, setProduct] = useState<ProductCalc | null>(null);
  const [editableComponents, setEditableComponents] = useState<
    ComponentEditable[]
  >([]);
  const [originalComponents, setOriginalComponents] = useState<
    ComponentEditable[]
  >([]);
  const [packagingItems, setPackagingItems] = useState<PackagingItemEditable[]>(
    []
  );

  // Editable inputs (raw strings)
  const [orderQuantityInput, setOrderQuantityInput] = useState<string>("5000");
  const [touchPointsInput, setTouchPointsInput] = useState<string>("6");
  const [costPerTouchInput, setCostPerTouchInput] = useState<string>("0.09");
  const [totalOzPerUnitInput, setTotalOzPerUnitInput] = useState<string>("4");
  const [gramsPerOzInput, setGramsPerOzInput] = useState<string>("30");

  // ✅ bulk packaging overrides
  const [bulkPackagingOverrides, setBulkPackagingOverrides] = useState<
    Record<string, number>
  >({});

  // ✅ tier profit overrides + inputs
  const [tierMarginOverrides, setTierMarginOverrides] = useState<
    Record<string, number>
  >({});
  const [tierMarginInputs, setTierMarginInputs] = useState<
    Record<string, string>
  >({});

  // ✅ Debounced values
  const debouncedOrderQuantity = useDebounce(orderQuantityInput, 400);
  const debouncedTouchPoints = useDebounce(touchPointsInput, 400);
  const debouncedCostPerTouch = useDebounce(costPerTouchInput, 400);
  const debouncedTotalOzPerUnit = useDebounce(totalOzPerUnitInput, 400);
  const debouncedGramsPerOz = useDebounce(gramsPerOzInput, 400);
  const debouncedTierMarginInputs = useDebounce(tierMarginInputs, 400);

  // ✅ Reset handlers
  const handleResetTieredPricing = () => {
    setTierMarginInputs({});
    setTierMarginOverrides({});
  };

  const handleResetBulkPricing = () => {
    setBulkPackagingOverrides({});
  };

  // ✅ Fetch and compute
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `https://bom-api.fly.dev/products/${encodeURIComponent(name)}`
        );
        if (!res.ok) {
          console.error("Failed to fetch product detail:", res.status);
          return;
        }

        const data: ProductDetail = await res.json();

        const totalQuantity = data.components.reduce(
          (sum: number, c: Component) => sum + (c.quantity || 0),
          0
        );

        const normalized: ComponentEditable[] = data.components.map(
          (c: Component) => ({
            ...c,
            percent:
              totalQuantity > 0
                ? parseFloat(((c.quantity / totalQuantity) * 100).toFixed(2))
                : 0,
          })
        );

        // ✅ apply debounced tier profit overrides
        const updatedTierOverrides: Record<string, number> = {};
        Object.entries(debouncedTierMarginInputs).forEach(([qty, val]) => {
          const num = Number(val);
          if (!isNaN(num)) updatedTierOverrides[qty] = num;
        });

        const enriched = buildProductCalc(
          data,
          editableComponents,
          packagingItems,
          {
            touchPoints: Number(debouncedTouchPoints) || 0,
            costPerTouch: Number(debouncedCostPerTouch) || 0,
            orderQuantity: Number(debouncedOrderQuantity) || 0,
            totalOzPerUnit: Number(debouncedTotalOzPerUnit) || 0,
            gramsPerOz: Number(debouncedGramsPerOz) || 0,
            bulkOverrides: bulkPackagingOverrides,
            tierMarginOverrides: updatedTierOverrides,
          }
        );

        setProduct(enriched);
        // only set once when fetching — not on every calc
        setOriginalComponents(normalized);
        if (editableComponents.length === 0) {
          setEditableComponents(normalized); // ✅ only initialize if empty
        }
      } catch (err) {
        console.error("Error fetching product detail:", err);
      }
    };

    fetchData();
  }, [
    name,
    editableComponents,
    packagingItems,
    debouncedTouchPoints,
    debouncedCostPerTouch,
    debouncedOrderQuantity,
    debouncedTotalOzPerUnit,
    debouncedGramsPerOz,
    debouncedTierMarginInputs,
    bulkPackagingOverrides,
  ]);

  if (!product) return <LoadingSpinner />;

  const packagingTotal = packagingItems.reduce(
    (sum, item) => sum + (item.line_cost || 0),
    0
  );

  return (
    <main className="bg-gray-50 min-h-screen p-6">
      <section className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/products"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-[#0e5439] text-white font-medium shadow hover:bg-[#0c4630] transition"
          >
            ← Back to Catalog
          </Link>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Product Cost Dashboard</h2>
          <table className="min-w-full text-sm border border-gray-200 rounded-lg">
            <tbody>
              {/* Product Info */}
              <tr className="bg-gray-100 font-medium">
                <td colSpan={2} className="px-4 py-2">
                  Product Info
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2">Name of Product</td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={product.product_name || ""}
                    onChange={(e) =>
                      setProduct({ ...product, product_name: e.target.value })
                    }
                    className="w-full border rounded px-2 py-1 font-mono"
                  />
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2">INCI</td>
                <td className="px-4 py-2">
                  <textarea
                    value={
                      Array.isArray(product.inci)
                        ? product.inci
                            .map((i: InciEntry) =>
                              i.percentage
                                ? `${i.name} (${i.percentage})`
                                : i.name
                            )
                            .join(", ")
                        : ""
                    }
                    onChange={(e) =>
                      setProduct({
                        ...product,
                        inci: e.target.value
                          .split(",")
                          .map((s) => ({ name: s.trim() })),
                      })
                    }
                    className="w-full border rounded px-2 py-1 font-mono text-sm h-16"
                  />
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2">Remarks</td>
                <td className="px-4 py-2">
                  <textarea
                    value={product.remarks || ""}
                    onChange={(e) =>
                      setProduct({ ...product, remarks: e.target.value })
                    }
                    className="w-full border rounded px-2 py-1 font-mono text-sm h-8"
                  />
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2">SKU / Barcode / Category</td>
                <td className="px-4 py-2 text-gray-700">
                  {product.sku || "-"} / {product.barcode || "-"} /{" "}
                  {product.category || "-"}
                </td>
              </tr>

              {/* Inputs */}
              <tr className="bg-gray-100 font-medium">
                <td colSpan={2} className="px-4 py-2">
                  Inputs
                </td>
              </tr>
              {[
                [
                  "Order Quantity",
                  orderQuantityInput,
                  setOrderQuantityInput,
                ] as const,
                [
                  "Total Oz Per Unit",
                  totalOzPerUnitInput,
                  setTotalOzPerUnitInput,
                ] as const,
                ["Grams per Oz", gramsPerOzInput, setGramsPerOzInput] as const,
                [
                  "Cost per Touch",
                  costPerTouchInput,
                  setCostPerTouchInput,
                ] as const,
                [
                  "Touch Points",
                  touchPointsInput,
                  setTouchPointsInput,
                ] as const,
              ].map(([label, value, setter]) => (
                <tr key={label}>
                  <td className="px-4 py-2">{label}</td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      className="w-32 border rounded px-2 py-1 font-mono"
                    />
                  </td>
                </tr>
              ))}

              {/* Packaging + Ingredients */}
              <tr className="bg-gray-100 font-medium">
                <td colSpan={2} className="px-4 py-2">
                  Packaging & Ingredients
                </td>
              </tr>
              <tr>
                <td colSpan={2} className="px-4 py-2">
                  <PackagingTable
                    packagingItems={packagingItems}
                    setPackagingItems={setPackagingItems}
                  />
                  <IngredientTable
                    components={editableComponents}
                    setComponents={setEditableComponents}
                    laborCost={product.labor_cost ?? 0}
                    setLaborCost={(v) =>
                      setProduct((prev) =>
                        prev ? { ...prev, labor_cost: v } : prev
                      )
                    }
                    originalComponents={originalComponents}
                    packagingTotal={packagingTotal}
                  />
                </td>
              </tr>

              {/* Pricing */}
              <tr className="bg-gray-100 font-medium">
                <td colSpan={2} className="px-4 py-2">
                  Pricing
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2">Unit Weight (kg)</td>
                <td className="px-4 py-2">
                  {product.unit_weight_kg?.toFixed(3) || "-"}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2">Ingredient Cost per Unit</td>
                <td className="px-4 py-2">
                  ${product.cost_per_unit_excel?.toFixed(3) || "-"}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2">Total cost by Ingredients</td>
                <td className="px-4 py-2 text-[#0e5439] font-semibold">
                  ${product.total_cost_excel?.toFixed(2) || "-"}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2">Base Cost per Unit</td>
                <td className="px-4 py-2 font-mono">
                  {product.base_cost_per_unit
                    ? `$${product.base_cost_per_unit.toFixed(3)}`
                    : "$-"}
                  <div className="text-xs text-gray-500">
                    After Labor and Packaging
                  </div>
                </td>
              </tr>

              {/* Tiered Pricing */}
              <tr>
                <td className="px-4 py-2">Tiered Pricing</td>
                <td className="px-4 py-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">Tiers</span>
                    <button
                      onClick={handleResetTieredPricing}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition text-sm font-medium shadow-sm cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </button>
                  </div>
                  <table className="w-full text-xs border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-1 text-left">Qty</th>
                        <th className="px-2 py-1 text-right">Price/Unit</th>
                        <th className="px-2 py-1 text-right">Profit/Unit</th>
                        <th className="px-2 py-1 text-right">Margin %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(product.tiered_pricing).map(
                        ([qty, data]) => (
                          <tr key={qty} className="border-t">
                            <td className="px-2 py-1">{qty}</td>
                            {/* Price/Unit */}
                            <td className="px-2 py-1 text-right font-semibold">
                              ${data.price.toFixed(2)}
                            </td>
                            {/* Profit/Unit */}
                            <td className="px-2 py-1 text-right font-semibold">
                              {qty === "2500" ? (
                                <div className="relative flex justify-end">
                                  <span className="absolute left-35 top-1/2 -translate-y-1/2 text-gray-600">
                                    $
                                  </span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={(
                                      Number(
                                        tierMarginInputs[qty] ?? data.profit
                                      ) || 0
                                    ).toFixed(2)}
                                    onChange={(e) =>
                                      setTierMarginInputs((prev) => ({
                                        ...prev,
                                        [qty]: e.target.value,
                                      }))
                                    }
                                    className="w-20 border rounded px-1 py-0.5 text-right font-mono font-semibold"
                                  />
                                </div>
                              ) : (
                                `$${data.profit.toFixed(2)}`
                              )}
                            </td>

                            {/* Margin */}
                            <td className="px-2 py-1 text-right text-gray-600">
                              {(data.margin * 100).toFixed(1)}%
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </td>
              </tr>

              {/* Bulk Pricing */}
              <tr>
                <td className="px-4 py-2">Bulk Pricing</td>
                <td className="px-4 py-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">Bulk Options</span>
                    <button
                      onClick={handleResetBulkPricing}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition text-sm font-medium shadow-sm cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </button>
                  </div>
                  <table className="w-full text-xs border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-1 text-left">Size</th>
                        <th className="px-2 py-1 text-right">MSRP</th>
                        <th className="px-2 py-1 text-right">Profit</th>
                        <th className="px-2 py-1 text-right">Packaging</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(product.bulk_pricing).map(
                        ([size, data]) => (
                          <tr key={size} className="border-t">
                            <td className="px-2 py-1">{size}</td>
                            <td className="px-2 py-1 text-right">
                              ${data.msrp.toFixed(2)}
                            </td>
                            <td className="px-2 py-1 text-right">
                              ${data.profit.toFixed(2)}
                            </td>
                            <td className="px-2 py-1 text-right">
                              <input
                                type="number"
                                step="0.01"
                                value={Number(
                                  bulkPackagingOverrides[size] ?? data.packaging
                                ).toFixed(2)}
                                onChange={(e) =>
                                  setBulkPackagingOverrides((prev) => ({
                                    ...prev,
                                    [size]: Number(e.target.value) || 0,
                                  }))
                                }
                                className="w-20 border rounded px-1 py-0.5 text-right font-mono"
                              />
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </td>
              </tr>

              {/* Actions */}
              <tr className="bg-gray-100 font-medium">
                <td colSpan={2} className="px-4 py-2">
                  Actions
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2">Export</td>
                <td className="px-4 py-2 text-right flex gap-2 justify-end">
                  <ExportClientPDFButton product={product} />
                  <ExportInternalPDFButton
                    product={product}
                    components={editableComponents}
                    packagingItems={packagingItems}
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <div className="lg:col-span-1 mt-6">
            <CalculatorWidget />
          </div>
        </div>
      </section>
    </main>
  );
}
