// src/app/components/ProductDetailClient.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import IngredientTable from "./IngredientTable";
import PackagingTable from "./PackagingTable";
import ExportPDFButton from "./ExportPDFButton";
import type {
  Component,
  ComponentEditable,
  PackagingItemEditable,
  ProductDetail,
  ProductCalc,
} from "../types";
import { buildProductCalc } from "../utils/calculations";

export default function ProductDetailClient({
  name,
}: {
  name: string;
}): React.ReactElement {
  const [product, setProduct] = useState<ProductCalc | null>(null);
  const [editableComponents, setEditableComponents] = useState<ComponentEditable[]>([]);
  const [originalComponents, setOriginalComponents] = useState<ComponentEditable[]>([]);
  const [packagingItems, setPackagingItems] = useState<PackagingItemEditable[]>([]);

  // Editable inputs
  const [orderQuantity, setOrderQuantity] = useState<number>(5000);
  const [inflowCost, setInflowCost] = useState<number>(0);
  const [touchPoints, setTouchPoints] = useState<number>(6);
  const [costPerTouch, setCostPerTouch] = useState<number>(0.09);
  const [totalOzPerUnit, setTotalOzPerUnit] = useState<number>(4);
  const [gramsPerOz, setGramsPerOz] = useState<number>(30);

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

        const normalized: ComponentEditable[] = data.components.map((c: Component) => ({
          ...c,
          percent:
            totalQuantity > 0
              ? parseFloat(((c.quantity / totalQuantity) * 100).toFixed(2))
              : 0,
        }));

        const enriched = buildProductCalc(data, normalized, packagingItems, {
          inflowCost,
          touchPoints,
          costPerTouch,
          orderQuantity,
          totalOzPerUnit,
          gramsPerOz,
        });

        setProduct(enriched);
        setEditableComponents(normalized);
        setOriginalComponents(normalized);
      } catch (err) {
        console.error("Error fetching product detail:", err);
      }
    };

    fetchData();
  }, [
    name,
    inflowCost,
    touchPoints,
    costPerTouch,
    orderQuantity,
    packagingItems,
    totalOzPerUnit,
    gramsPerOz,
  ]);

  if (!product) return <p className="p-6">Loading...</p>;

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

        {/* Master Table */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Product Cost Dashboard</h2>
          <table className="min-w-full text-sm border border-gray-200 rounded-lg">
            <tbody>
              {/* Product Info */}
              <tr className="bg-gray-100 font-medium">
                <td colSpan={2} className="px-4 py-2">Product Info</td>
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
                <td className="px-4 py-2">SKU / Barcode / Category</td>
                <td className="px-4 py-2 text-gray-700">
                  {product.sku || "-"} / {product.barcode || "-"} / {product.category || "-"}
                </td>
              </tr>

              {/* Inputs */}
              <tr className="bg-gray-100 font-medium">
                <td colSpan={2} className="px-4 py-2">Inputs</td>
              </tr>
              <tr>
                <td className="px-4 py-2">Order Quantity</td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(Number(e.target.value) || 0)}
                    className="w-32 border rounded px-2 py-1 font-mono"
                  />
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2">Total Oz Per Unit</td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    value={totalOzPerUnit}
                    onChange={(e) => setTotalOzPerUnit(Number(e.target.value) || 0)}
                    className="w-32 border rounded px-2 py-1 font-mono"
                  />
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2">Grams per Oz</td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    value={gramsPerOz}
                    onChange={(e) => setGramsPerOz(Number(e.target.value) || 0)}
                    className="w-32 border rounded px-2 py-1 font-mono"
                  />
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2">Inflow Cost ($)</td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    step="0.01"
                    value={inflowCost}
                    onChange={(e) => setInflowCost(Number(e.target.value) || 0)}
                    className="w-32 border rounded px-2 py-1 font-mono"
                  />
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2">Cost per Touch</td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    step="0.01"
                    value={costPerTouch}
                    onChange={(e) => setCostPerTouch(Number(e.target.value) || 0)}
                    className="w-32 border rounded px-2 py-1 font-mono"
                  />
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2">Touch Points</td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    value={touchPoints}
                    onChange={(e) => setTouchPoints(Number(e.target.value) || 0)}
                    className="w-32 border rounded px-2 py-1 font-mono"
                  />
                </td>
              </tr>

              {/* Packaging + Ingredients */}
              <tr className="bg-gray-100 font-medium">
                <td colSpan={2} className="px-4 py-2">Packaging & Ingredients</td>
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
                      setProduct((prev) => (prev ? { ...prev, labor_cost: v } : prev))
                    }
                    originalComponents={originalComponents}
                    packagingTotal={packagingTotal}
                    inflowCost={inflowCost}
                  />
                </td>
              </tr>

              {/* Pricing */}
              <tr className="bg-gray-100 font-medium">
                <td colSpan={2} className="px-4 py-2">Pricing</td>
              </tr>
              <tr>
                <td className="px-4 py-2">Unit Weight (kg)</td>
                <td className="px-4 py-2">{product.unit_weight_kg?.toFixed(3) || "-"}</td>
              </tr>
              <tr>
                <td className="px-4 py-2">Ingredient Cost per Unit (Excel)</td>
                <td className="px-4 py-2">${product.cost_per_unit_excel?.toFixed(3) || "-"}</td>
              </tr>
              <tr>
                <td className="px-4 py-2">Final Total Cost (Excel)</td>
                <td className="px-4 py-2 text-[#0e5439] font-bold">${product.total_cost_excel?.toFixed(2) || "-"}</td>
              </tr>
              <tr>
                <td className="px-4 py-2">Tiered Pricing</td>
                <td className="px-4 py-2">
                  <table className="w-full text-xs border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-1 text-left">Qty</th>
                        <th className="px-2 py-1 text-right">Price/Unit</th>
                        <th className="px-2 py-1 text-right">Profit/Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.tiered_pricing &&
                        Object.entries(product.tiered_pricing).map(
                          ([qty, data]: [string, { price: number; profit: number }]) => (
                            <tr key={qty} className="border-t">
                              <td className="px-2 py-1">{qty}</td>
                              <td className="px-2 py-1 text-right">${data.price.toFixed(2)}</td>
                              <td className="px-2 py-1 text-right text-gray-600">
                                ${data.profit.toFixed(3)}
                              </td>
                            </tr>
                          )
                        )}
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2">Bulk Pricing</td>
                <td className="px-4 py-2">
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
                        ([size, data]: [
                          string,
                          { msrp: number; profit: number; packaging: number }
                        ]) => (
                          <tr key={size} className="border-t">
                            <td className="px-2 py-1">{size}</td>
                            <td className="px-2 py-1 text-right">${data.msrp.toFixed(2)}</td>
                            <td className="px-2 py-1 text-right">${data.profit.toFixed(2)}</td>
                            <td className="px-2 py-1 text-right">${data.packaging.toFixed(2)}</td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </td>
              </tr>

              {/* Actions */}
              <tr className="bg-gray-100 font-medium">
                <td colSpan={2} className="px-4 py-2">Actions</td>
              </tr>
              <tr>
                <td className="px-4 py-2">Export</td>
                <td className="px-4 py-2 text-right">
                  <ExportPDFButton
                    product={product}
                    components={editableComponents}
                    packagingItems={packagingItems}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
