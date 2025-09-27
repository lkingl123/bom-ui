"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import IngredientTable from "./IngredientTable";
import PackagingTable from "./PackagingTable";
import LoadingSpinner from "./LoadingSpinner";
import { RotateCcw } from "lucide-react";
import type {
  ComponentEditable,
  PackagingItemEditable,
  ProductCalc,
  ProductDetail,
} from "../types";
import { buildProductCalc } from "../utils/calculations";
import { getProduct, getExpandedBom } from "../services/inflow";

// --- debounce hook ---
function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

export default function ProductDetailClient({
  productId,
}: {
  productId: string;
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

  // Inputs
  const [orderQuantityInput, setOrderQuantityInput] = useState("5000");
  const [touchPointsInput, setTouchPointsInput] = useState("6");
  const [costPerTouchInput, setCostPerTouchInput] = useState("0.09");
  const [totalOzPerUnitInput, setTotalOzPerUnitInput] = useState("4");
  const [gramsPerOzInput, setGramsPerOzInput] = useState("30");

  // Overrides
  const [bulkPackagingOverrides, setBulkPackagingOverrides] = useState<
    Record<string, number>
  >({});
  const [tierMarginInputs, setTierMarginInputs] = useState<
    Record<string, string>
  >({});

  // Debounced inputs
  const debouncedOrderQuantity = useDebounce(orderQuantityInput, 400);
  const debouncedTouchPoints = useDebounce(touchPointsInput, 400);
  const debouncedCostPerTouch = useDebounce(costPerTouchInput, 400);
  const debouncedTotalOzPerUnit = useDebounce(totalOzPerUnitInput, 400);
  const debouncedGramsPerOz = useDebounce(gramsPerOzInput, 400);
  const debouncedTierMarginInputs = useDebounce(tierMarginInputs, 400);

  // Reset handlers
  const handleResetTieredPricing = () => setTierMarginInputs({});
  const handleResetBulkPricing = () => setBulkPackagingOverrides({});

  // --- Fetch product + BOM once (when productId changes) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data: ProductDetail = await getProduct(productId);
        const expandedBom = await getExpandedBom(productId);

        const rawComponents: ComponentEditable[] = expandedBom.map((bom) => ({
          name: bom.name,
          sku: bom.sku,
          quantity: bom.quantity,
          uom: bom.uom || "ea",
          has_cost: true,
          unit_cost: bom.cost,
          line_cost: bom.cost * bom.quantity,
        }));

        const productObject = {
          ...data,
          components: rawComponents,
        } as ProductCalc;

        console.log(
          "[ProductDetailClient] Raw API product object:",
          JSON.stringify(productObject, null, 2)
        );

        setOriginalComponents(rawComponents);
        setEditableComponents(rawComponents);
        setProduct(productObject);
      } catch (err) {
        console.error("Error fetching product:", err);
      }
    };

    fetchData();
  }, [productId]);

  // --- Recalculate values when inputs/overrides change ---
  useEffect(() => {
    if (!product) return;

    const updatedTierOverrides: Record<string, number> = {};
    Object.entries(debouncedTierMarginInputs).forEach(([qty, val]) => {
      const num = Number(val);
      if (!isNaN(num)) updatedTierOverrides[qty] = num;
    });

    const enriched = buildProductCalc(
      product,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedTouchPoints,
    debouncedCostPerTouch,
    debouncedOrderQuantity,
    debouncedTotalOzPerUnit,
    debouncedGramsPerOz,
    debouncedTierMarginInputs,
    bulkPackagingOverrides,
    packagingItems,
    editableComponents,
  ]);

  if (!product) return <LoadingSpinner />;

  const packagingTotal = packagingItems.reduce(
    (sum, item) => sum + (item.line_cost || 0),
    0
  );

  return (
    <main className="bg-gray-50 min-h-screen p-6">
      <section className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/products"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-[#0e5439] text-white font-medium shadow hover:bg-[#0c4630] transition"
          >
            ← Back to Catalog
          </Link>
        </div>

        {/* Product Info */}
        <table className="min-w-full text-sm border border-gray-200 rounded-lg">
          <tbody>
            <tr className="bg-gray-100 font-medium">
              <td colSpan={2} className="px-4 py-2">
                Product Info
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2">Name of Product</td>
              <td className="px-4 py-2">{product.name || "-"}</td>
            </tr>
            <tr>
              <td className="px-4 py-2">Remarks</td>
              <td className="px-4 py-2">{product.remarks || "-"}</td>
            </tr>
            <tr>
              <td className="px-4 py-2">SKU / Category</td>
              <td className="px-4 py-2 text-gray-700">
                {product.sku || "-"} / {product.category?.toString() || "-"}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Packaging & Ingredients */}
        <table className="min-w-full text-sm border border-gray-200 rounded-lg">
          <tbody>
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
                  orderQuantity={Number(debouncedOrderQuantity) || 0}
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
          </tbody>
        </table>

        {/* Inputs */}
        <table className="min-w-full text-sm border border-gray-200 rounded-lg">
          <tbody>
            <tr className="bg-gray-100 font-medium">
              <td colSpan={2} className="px-4 py-2">
                <div className="flex items-center gap-220">
                  <span>Inputs</span>
                  <span>Labor Cost</span>
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="px-4 py-2">
                <div className="flex flex-wrap gap-12">
                  {/* Left side */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm">
                      Order Quantity
                      <input
                        type="text"
                        value={orderQuantityInput}
                        onChange={(e) => setOrderQuantityInput(e.target.value)}
                        className="ml-2 w-32 border rounded px-2 py-1 font-mono"
                      />
                    </label>
                    <label className="text-sm">
                      Total Oz Per Unit
                      <input
                        type="text"
                        value={totalOzPerUnitInput}
                        onChange={(e) => setTotalOzPerUnitInput(e.target.value)}
                        className="ml-2 w-32 border rounded px-2 py-1 font-mono"
                      />
                    </label>
                    <label className="text-sm">
                      Grams per Oz
                      <input
                        type="text"
                        value={gramsPerOzInput}
                        onChange={(e) => setGramsPerOzInput(e.target.value)}
                        className="ml-2 w-32 border rounded px-2 py-1 font-mono"
                      />
                    </label>
                  </div>

                  {/* Right side inputs (no heading here anymore) */}
                  <div className="flex flex-col gap-2 ml-auto">
                    <label className="text-sm">
                      Cost per Touch
                      <input
                        type="text"
                        value={costPerTouchInput}
                        onChange={(e) => setCostPerTouchInput(e.target.value)}
                        className="ml-2 w-32 border rounded px-2 py-1 font-mono"
                      />
                    </label>
                    <label className="text-sm">
                      Touch Points
                      <input
                        type="text"
                        value={touchPointsInput}
                        onChange={(e) => setTouchPointsInput(e.target.value)}
                        className="ml-2 w-32 border rounded px-2 py-1 font-mono"
                      />
                    </label>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Pricing */}
        <table className="min-w-full text-sm border border-gray-200 rounded-lg">
          <tbody>
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
          </tbody>
        </table>

        {/* Tiered Pricing */}
        <table className="min-w-full text-sm border border-gray-200 rounded-lg">
          <tbody>
            <tr className="bg-gray-100 font-medium">
              <td colSpan={2} className="px-4 py-2">
                Tiered Pricing
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="px-4 py-2">
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
                    {product.tiered_pricing ? (
                      Object.entries(product.tiered_pricing).map(
                        ([qty, data]) => (
                          <tr key={qty} className="border-t">
                            <td className="px-2 py-1">{qty}</td>
                            <td className="px-2 py-1 text-right font-semibold">
                              ${data.price.toFixed(2)}
                            </td>
                            <td className="px-2 py-1 text-right font-semibold">
                              {qty === "2500" ? (
                                <div className="relative flex justify-end">
                                  <span className="absolute left-70 top-1/2 -translate-y-1/2 text-gray-600">
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
                            <td className="px-2 py-1 text-right text-gray-600">
                              {(data.margin * 100).toFixed(1)}%
                            </td>
                          </tr>
                        )
                      )
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-2 py-2 text-center text-gray-500"
                        >
                          No tiered pricing available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Bulk Pricing */}
        <table className="min-w-full text-sm border border-gray-200 rounded-lg">
          <tbody>
            <tr className="bg-gray-100 font-medium">
              <td colSpan={2} className="px-4 py-2">
                Bulk Pricing
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="px-4 py-2">
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
                      <th className="px-2 py-1 text-right">Price/Unit</th>
                      <th className="px-2 py-1 text-right">Profit/Unit</th>
                      <th className="px-2 py-1 text-right">Packaging</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.bulk_pricing ? (
                      Object.entries(product.bulk_pricing).map(
                        ([size, data]) => (
                          <tr key={size} className="border-t">
                            <td className="px-2 py-1">{size}</td>
                            <td className="px-2 py-1 text-right font-semibold">
                              ${data.msrp.toFixed(2)}
                            </td>
                            <td className="px-2 py-1 text-right font-semibold">
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
                      )
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-2 py-2 text-center text-gray-500"
                        >
                          No bulk pricing available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Actions */}
        <table className="min-w-full text-sm border border-gray-200 rounded-lg">
          <tbody>
            <tr className="bg-gray-100 font-medium">
              <td colSpan={2} className="px-4 py-2">
                Actions
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2">Export</td>
              <td className="px-4 py-2">
                {/* Placeholder for export button or actions */}
                <button className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition">
                  Export PDF
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  );
}
