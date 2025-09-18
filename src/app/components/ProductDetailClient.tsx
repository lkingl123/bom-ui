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
  const [editableComponents, setEditableComponents] = useState<
    ComponentEditable[]
  >([]);
  const [originalComponents, setOriginalComponents] = useState<
    ComponentEditable[]
  >([]);
  const [packagingItems, setPackagingItems] = useState<PackagingItemEditable[]>(
    []
  );

  // Editable inputs
  const [orderQuantity, setOrderQuantity] = useState<number>(5000);
  const [miscCost, setMiscCost] = useState<number>(0);
  const [inflowCost, setInflowCost] = useState<number>(0);
  const [touchPoints, setTouchPoints] = useState<number>(6);
  const [costPerTouch, setCostPerTouch] = useState<number>(0.09);

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

        const enriched = buildProductCalc(data, normalized, packagingItems, {
          miscCost,
          inflowCost,
          touchPoints,
          costPerTouch,
          orderQuantity,
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
    miscCost,
    inflowCost,
    touchPoints,
    costPerTouch,
    orderQuantity,
    packagingItems,
  ]);

  if (!product) return <p className="p-6">Loading...</p>;

  // ✅ Calculate packaging total here
  const packagingTotal = packagingItems.reduce(
    (sum, item) => sum + (item.line_cost || 0),
    0
  );

  return (
    <main className="bg-gray-50 min-h-screen">
      <section className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/products"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-[#0e5439] text-white font-medium shadow hover:bg-[#0c4630] hover:scale-105 active:scale-95 cursor-pointer transition"
          >
            ← Back to Catalog
          </Link>
        </div>

        {/* Product Name */}
        <h1 className="mb-4">
          <input
            type="text"
            value={product.product_name || ""}
            onChange={(e) =>
              setProduct({ ...product, product_name: e.target.value })
            }
            className="border rounded px-3 py-2 w-full text-3xl font-bold text-gray-900"
          />
        </h1>

        <p className="text-gray-600 mb-6">
          SKU: {product.sku || "-"} | Barcode: {product.barcode || "-"} |
          Category: {product.category || "-"}
        </p>

        {/* Ingredient Table */}
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
          miscCost={miscCost}
        />

        {/* Packaging Table */}
        <PackagingTable
          packagingItems={packagingItems}
          setPackagingItems={setPackagingItems}
        />

        {/* Cost Summary */}
        <div className="mt-8 bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Labor Calculator
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Order Quantity</p>
              <input
                type="number"
                min={1}
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(Number(e.target.value) || 0)}
                className="w-32 border rounded px-2 py-1 text-sm font-mono"
              />
            </div>
            <div>
              <p className="text-gray-500">Inflow Cost ($ total)</p>
              <input
                type="number"
                step="0.01"
                min={0}
                value={inflowCost}
                onChange={(e) => setInflowCost(Number(e.target.value) || 0)}
                className="w-32 border rounded px-2 py-1 text-sm font-mono"
              />
            </div>
            <div>
              <p className="text-gray-500">Cost Per Touch ($)</p>
              <input
                type="number"
                step="0.01"
                min={0}
                value={costPerTouch}
                onChange={(e) => setCostPerTouch(Number(e.target.value) || 0)}
                className="w-32 border rounded px-2 py-1 text-sm font-mono"
              />
            </div>

            <div>
              <p className="text-gray-500">Misc Cost ($ total)</p>
              <input
                type="number"
                step="0.01"
                min={0}
                value={miscCost}
                onChange={(e) => setMiscCost(Number(e.target.value) || 0)}
                className="w-32 border rounded px-2 py-1 text-sm font-mono"
              />
            </div>
            <div>
              <p className="text-gray-500">Touch Points</p>
              <input
                type="number"
                min={0}
                value={touchPoints}
                onChange={(e) => setTouchPoints(Number(e.target.value) || 0)}
                className="w-32 border rounded px-2 py-1 text-sm font-mono"
              />
            </div>
            {/* <div>
              <p className="text-gray-500">Formula Weight (kg)</p>
              <p className="font-mono text-gray-900">
                {product.formula_kg?.toFixed(3) || "-"}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Cost per kg</p>
              <p className="font-mono text-[#0e5439]">
                ${product.cost_per_kg?.toFixed(2) || "0.00"}
              </p>
            </div> */}
          </div>
        </div>

        {/* Tiered Pricing */}
        <div className="mt-8 bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Tiered Pricing
          </h3>
          <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100 text-gray-700 font-medium">
              <tr>
                <th className="px-4 py-2 text-left">Quantity</th>
                <th className="px-4 py-2 text-right">Price / Unit</th>
                <th className="px-4 py-2 text-right">Profit / Unit</th>
              </tr>
            </thead>
            <tbody>
              {product.tiered_pricing &&
                Object.entries(product.tiered_pricing).map(
                  ([qty, data]: [
                    string,
                    { price: number; profit: number }
                  ]) => (
                    <tr key={qty} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2">{qty}</td>
                      <td className="px-4 py-2 text-right font-mono">
                        ${data.price.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-gray-600">
                        ${data.profit.toFixed(3)}
                      </td>
                    </tr>
                  )
                )}
            </tbody>
          </table>
        </div>

        {/* Bulk Packaging */}
        <div className="mt-8 bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Cost for PEL Bulk Pricing
          </h3>
          <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100 text-gray-700 font-medium">
              <tr>
                <th className="px-4 py-2 text-left">Size</th>
                <th className="px-4 py-2 text-right">MSRP</th>
                <th className="px-4 py-2 text-right">Profit Per Unit</th>
                <th className="px-4 py-2 text-right">Packaging Cost</th>
                <th className="px-4 py-2 text-right">Multiplier</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(product.bulk_pricing).map(
                ([size, data]: [
                  string,
                  {
                    msrp: number;
                    profit: number;
                    packaging: number;
                    multiplier: number;
                  }
                ]) => (
                  <tr key={size} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{size}</td>
                    <td className="px-4 py-2 text-right font-mono">
                      ${data.msrp.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right font-mono">
                      ${data.profit.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right font-mono">
                      ${data.packaging.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right font-mono">
                      {data.multiplier}×
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Export PDF */}
        <div className="mt-6 flex justify-end">
          <ExportPDFButton
            product={product}
            components={editableComponents}
            packagingItems={packagingItems}
          />
        </div>
      </section>
    </main>
  );
}
