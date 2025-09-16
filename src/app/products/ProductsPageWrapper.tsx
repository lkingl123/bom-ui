"use client";

import React from "react";
import { Product } from "../types"; // adjust path if needed

interface ProductsPageWrapperProps {
  products: Product[];
}

// Helper to format currency safely
function formatCurrency(value?: number): string {
  return value !== undefined ? value.toFixed(2) : "N/A";
}

export default function ProductsPageWrapper({ products }: ProductsPageWrapperProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product, index) => (
        <div
          key={product.sku ?? index}
          className="rounded-lg border bg-white shadow p-4 hover:shadow-md transition"
        >
          <h2 className="text-lg font-semibold">{product.product_name}</h2>

          {product.sku && (
            <p className="text-sm text-gray-500 mb-1">SKU: {product.sku}</p>
          )}
          {product.barcode && (
            <p className="text-sm text-gray-500 mb-1">Barcode: {product.barcode}</p>
          )}

          <p className="font-medium">
            Base Cost: ${formatCurrency(product.calculated_cost)}
          </p>

          {product.packaging_cost !== undefined && (
            <p className="text-sm text-gray-500">
              Packaging Cost: ${formatCurrency(product.packaging_cost)}
            </p>
          )}

          {product.labor_cost !== undefined && (
            <p className="text-sm text-gray-500">
              Labor Cost: ${formatCurrency(product.labor_cost)}
            </p>
          )}

          <div className="mt-2">
            <h3 className="text-sm font-semibold">Components:</h3>
            <ul className="list-disc list-inside text-sm text-gray-600">
              {product.components.map((c, idx) => (
                <li key={idx}>
                  {c.name} — {c.quantity} {c.uom} @ ${formatCurrency(c.unit_cost)}{" "}
                  (Line: ${formatCurrency(c.line_cost)})
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}
