"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import IngredientTable from "./IngredientTable";
import PackagingTable from "./PackagingTable";
import LoadingSpinner from "./LoadingSpinner";
import { RotateCcw } from "lucide-react";
import { serializeForUpdate } from "../utils/serializeProduct";
import ExportClientPDFButton from "./ExportClientPDFButton";
import ExportInternalPDFButton from "./ExportInternalPDFButton";
import type {
  ComponentEditable,
  PackagingItemEditable,
  ProductCalc,
} from "../types";
import { buildProductCalc } from "../utils/calculations";
import { getProduct, getExpandedBom } from "../services/inflow";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [saving, setSaving] = useState(false);

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

  // --- Fetch product + BOM once ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getProduct(productId);
        if (!data) {
          console.warn(
            `[ProductDetailClient] No product found for ${productId}`
          );
          return;
        }

        const expandedBom = await getExpandedBom(productId);

        const rawComponents: ComponentEditable[] = expandedBom.map((bom) => ({
          name: bom.name,
          sku: bom.sku,
          quantity: bom.quantity,
          uom: bom.uom || "ea",
          has_cost: true,
          unit_cost: bom.cost,
          line_cost: bom.cost * bom.quantity,
          childProductId: bom.childProductId, // Added for component detail fetching
        }));

        const productObject: ProductCalc = {
          ...data,
          components: rawComponents,
        };

        setOriginalComponents(rawComponents);
        setEditableComponents(rawComponents);
        setProduct(productObject);
      } catch (err) {
        console.error("Error fetching product:", err);
      }
    };

    fetchData();
  }, [productId]);

  // --- Recalculate values ---
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
    <main className="bg-gray-50 dark:bg-gray-900 min-h-screen p-6 text-gray-900 dark:text-gray-100">
      <section className="max-w-6xl mx-auto space-y-8">
        {/* Back */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/products"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-[#0e5439] text-white font-medium shadow hover:bg-[#0c4630] transition"
          >
            ← Back to Catalog
          </Link>
        </div>
        {/* Product Info */}
        <table className="min-w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg">
          <tbody>
            <tr className="bg-gray-100 dark:bg-gray-800 font-medium">
              <td colSpan={2} className="px-4 py-2">
                Product Info
              </td>
            </tr>

            {/* Name */}
            <tr>
              <td className="px-4 py-2">Name of Product</td>
              <td className="px-4 py-2">
                <textarea
                  rows={2}
                  value={product.name || ""}
                  onChange={(e) =>
                    setProduct((prev) =>
                      prev ? { ...prev, name: e.target.value } : prev
                    )
                  }
                  className="w-full border rounded px-2 py-1 font-mono dark:bg-gray-800 dark:border-gray-600"
                />
              </td>
            </tr>

            {/* Description */}
            <tr>
              <td className="px-4 py-2">Description</td>
              <td className="px-4 py-2">
                <textarea
                  value={product.description || ""}
                  onChange={(e) =>
                    setProduct((prev) =>
                      prev ? { ...prev, description: e.target.value } : prev
                    )
                  }
                  className="w-full border rounded px-2 py-1 font-mono dark:bg-gray-800 dark:border-gray-600"
                />
              </td>
            </tr>

            {/* Remarks */}
            <tr>
              <td className="px-4 py-2">Remarks</td>
              <td className="px-4 py-2">
                <textarea
                  value={product.remarks || ""}
                  onChange={(e) =>
                    setProduct((prev) =>
                      prev ? { ...prev, remarks: e.target.value } : prev
                    )
                  }
                  className="w-full border rounded px-2 py-1 font-mono dark:bg-gray-800 dark:border-gray-600"
                />
              </td>
            </tr>

            {/* SKU */}
            <tr>
              <td className="px-4 py-2">SKU</td>
              <td className="px-4 py-2">
                <input
                  type="text"
                  value={product.sku || ""}
                  onChange={(e) =>
                    setProduct((prev) =>
                      prev ? { ...prev, sku: e.target.value } : prev
                    )
                  }
                  className="w-full border rounded px-2 py-1 font-mono dark:bg-gray-800 dark:border-gray-600"
                />
              </td>
            </tr>

            {/* Category */}
            <tr>
              <td className="px-4 py-2">Category</td>
              <td className="px-4 py-2">
                <input
                  type="text"
                  value={product.category?.toString() || ""}
                  onChange={(e) =>
                    setProduct((prev) =>
                      prev ? { ...prev, category: e.target.value } : prev
                    )
                  }
                  className="w-full border rounded px-2 py-1 font-mono dark:bg-gray-800 dark:border-gray-600"
                />
              </td>
            </tr>

            {/* INCI */}
            <tr>
              <td className="px-4 py-2">INCI</td>
              <td className="px-4 py-2">
                <textarea
                  rows={3}
                  value={product.customFields?.custom1 || ""}
                  onChange={(e) =>
                    setProduct((prev) =>
                      prev
                        ? {
                            ...prev,
                            customFields: {
                              ...prev.customFields,
                              custom1: e.target.value,
                            },
                          }
                        : prev
                    )
                  }
                  className="w-full border rounded px-2 py-1 font-mono dark:bg-gray-800 dark:border-gray-600"
                />
              </td>
            </tr>

            {/* Account */}
            <tr>
              <td className="px-4 py-2">Account</td>
              <td className="px-4 py-2">
                <input
                  type="text"
                  value={product.customFields?.custom8 || ""}
                  onChange={(e) =>
                    setProduct((prev) =>
                      prev
                        ? {
                            ...prev,
                            customFields: {
                              ...prev.customFields,
                              custom8: e.target.value,
                            },
                          }
                        : prev
                    )
                  }
                  className="w-full border rounded px-2 py-1 font-mono dark:bg-gray-800 dark:border-gray-600"
                />
              </td>
            </tr>

            {/* Save button row */}
            {/* Save button row */}
            <tr>
              <td colSpan={2} className="px-4 py-3 text-right">
                <button
                  disabled={saving}
                  onClick={async () => {
                    if (!product || saving) return;

                    const confirmed = window.confirm(
                      "Are you sure you want to save and update this product in inFlow?"
                    );
                    if (!confirmed) return;

                    setSaving(true);
                    try {
                      console.log(
                        "🚀 [Save] Sending product update request..."
                      );
                      const res = await fetch("/api/products/update", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(serializeForUpdate(product)),
                      });

                      if (!res.ok) throw new Error("Failed to save");

                      const updatedProduct = await res.json();
                      console.log(
                        "🆕 [Save] Updated product from backend:",
                        updatedProduct
                      );

                      setProduct((prev) =>
                        prev
                          ? {
                              ...prev,
                              ...updatedProduct,
                              timestamp: updatedProduct.timestamp,
                              customFields: {
                                ...prev.customFields,
                                ...updatedProduct.customFields,
                              },
                            }
                          : updatedProduct
                      );

                      await new Promise((res) => setTimeout(res, 500));
                      alert("✅ Product saved & updated in inFlow!");
                      sessionStorage.setItem("forceRefreshProducts", "true");
                      router.push("/products?forceRefresh=true");
                    } catch (err) {
                      console.error("💥 [Save] Update failed:", err);
                      alert("❌ Failed to update product in inFlow");
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className={`px-4 py-2 rounded shadow transition cursor-pointer ${
                    saving
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {saving ? "Saving..." : "Save & Update in inFlow"}
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Components */}
        <table className="min-w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg">
          <tbody>
            <tr className="bg-gray-100 dark:bg-gray-800 font-medium">
              <td colSpan={2} className="px-4 py-2">
                Packaging Component and Components
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="px-4 py-2">
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
                <PackagingTable
                  packagingItems={packagingItems}
                  setPackagingItems={setPackagingItems}
                  orderQuantity={Number(debouncedOrderQuantity) || 0}
                />
              </td>
            </tr>
          </tbody>
        </table>
        {/* Inputs Section (Side by Side) */}
        <div className="flex gap-6">
          {/* Production Inputs (Left) */}
          <table className="flex-1 text-sm border border-gray-200 dark:border-gray-700 rounded-lg">
            <tbody>
              <tr className="bg-gray-100 dark:bg-gray-800 font-medium">
                <td colSpan={2} className="px-4 py-2">
                  Production Inputs
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 w-1/2">Order Quantity</td>
                <td className="px-4 py-2 w-1/2">
                  <input
                    type="text"
                    value={orderQuantityInput}
                    onChange={(e) => setOrderQuantityInput(e.target.value)}
                    className="w-32 border rounded px-2 py-1 font-mono dark:bg-gray-800 dark:border-gray-600"
                  />
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2">Total Oz Per Unit</td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={totalOzPerUnitInput}
                    onChange={(e) => setTotalOzPerUnitInput(e.target.value)}
                    className="w-32 border rounded px-2 py-1 font-mono dark:bg-gray-800 dark:border-gray-600"
                  />
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2">Grams per Oz</td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={gramsPerOzInput}
                    onChange={(e) => setGramsPerOzInput(e.target.value)}
                    className="w-32 border rounded px-2 py-1 font-mono dark:bg-gray-800 dark:border-gray-600"
                  />
                </td>
              </tr>
            </tbody>
          </table>

          {/* Labor Inputs (Right) */}
          <table className="flex-1 text-sm border border-gray-200 dark:border-gray-700 rounded-lg">
            <tbody>
              <tr className="bg-gray-100 dark:bg-gray-800 font-medium">
                <td colSpan={2} className="px-4 py-2">
                  Labor Inputs
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 w-1/2">Cost per Touch</td>
                <td className="px-4 py-2 w-1/2">
                  <input
                    type="text"
                    value={costPerTouchInput}
                    onChange={(e) => setCostPerTouchInput(e.target.value)}
                    className="w-32 border rounded px-2 py-1 font-mono dark:bg-gray-800 dark:border-gray-600"
                  />
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2">Touch Points</td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={touchPointsInput}
                    onChange={(e) => setTouchPointsInput(e.target.value)}
                    className="w-32 border rounded px-2 py-1 font-mono dark:bg-gray-800 dark:border-gray-600"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tiered Pricing */}
        <table className="min-w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg">
          <tbody>
            <tr className="bg-gray-100 dark:bg-gray-800 font-medium">
              <td colSpan={2} className="px-4 py-2">
                Tiered Pricing
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="px-4 py-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium"></span>
                  <button
                    onClick={handleResetTieredPricing}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm font-medium shadow-sm cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>
                </div>
                <table className="w-full text-xs border dark:border-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
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
                          <tr
                            key={qty}
                            className="border-t dark:border-gray-700"
                          >
                            <td className="px-2 py-1">{qty}</td>
                            <td className="px-2 py-1 text-right font-semibold">
                              ${data.price.toFixed(2)}
                            </td>
                            {/* The focused Profit/Unit cell with alignment fix */}
                            <td className="px-2 py-1 text-right font-semibold">
                              {qty === "2500" ? (
                                <div className="flex items-center justify-end">
                                  <span className="mr-1 text-gray-600">$</span>
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
                                    className="w-20 border rounded px-1 py-0.5 text-right font-mono font-semibold dark:bg-gray-800 dark:border-gray-600"
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
        <table className="min-w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg">
          <tbody>
            <tr className="bg-gray-100 dark:bg-gray-800 font-medium">
              <td colSpan={2} className="px-4 py-2">
                Bulk Pricing
              </td>
            </tr>
            <tr>
              <td colSpan={2} className="px-4 py-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium"></span>
                  <button
                    onClick={handleResetBulkPricing}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm font-medium shadow-sm cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>
                </div>
                <table className="w-full text-xs border dark:border-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
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
                          <tr
                            key={size}
                            className="border-t dark:border-gray-700"
                          >
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
                                className="w-20 border rounded px-1 py-0.5 text-right font-mono dark:bg-gray-800 dark:border-gray-600"
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

        {/* Pricing */}
        <table className="min-w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg">
          <tbody>
            <tr className="bg-gray-100 dark:bg-gray-800 font-medium">
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
              <td className="px-4 py-2">Cost per Unit</td>
              <td className="px-4 py-2">
                ${product.cost_per_unit_excel?.toFixed(3) || "-"}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2">
                Base Cost per Unit (After Labor and Packaging)
              </td>
              <td className="px-4 py-2 font-mono">
                {product.base_cost_per_unit
                  ? `$${product.base_cost_per_unit.toFixed(3)}`
                  : "$-"}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2">Total Cost per Unit</td>
              <td className="px-4 py-2 text-[#0e5439] font-semibold">
                ${product.total_cost_excel?.toFixed(2) || "-"}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2">Total Base Cost</td>
              <td className="px-4 py-2 font-mono text-[#0e5439] font-semibold">
                {product.total_base_cost !== undefined &&
                !isNaN(product.total_base_cost)
                  ? `$${product.total_base_cost.toFixed(2)}`
                  : "$-"}
              </td>
            </tr>
          </tbody>
        </table>
        {/* Actions */}
        <table className="min-w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg">
          <tbody>
            <tr className="bg-gray-100 dark:bg-gray-800 font-medium">
              <td colSpan={2} className="px-4 py-2">
                Actions
              </td>
            </tr>
            {/* Export buttons */}
            <tr>
              <td className="px-4 py-2">Export</td>
              <td className="px-4 py-2 flex gap-2">
                {/* Client-facing export */}
                <ExportClientPDFButton product={product} />

                {/* Internal export */}
                <ExportInternalPDFButton
                  product={product}
                  packagingItems={packagingItems}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  );
}
