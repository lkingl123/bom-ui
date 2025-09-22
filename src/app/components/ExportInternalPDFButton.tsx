"use client";

import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  ComponentEditable,
  PackagingItemEditable,
  ProductCalc,
} from "../types";

// Extend jsPDF to support lastAutoTable
declare module "jspdf" {
  interface jsPDF {
    lastAutoTable?: {
      finalY: number;
    };
  }
}

interface ExportInternalPDFButtonProps {
  product: ProductCalc;
  components: ComponentEditable[];
  packagingItems: PackagingItemEditable[];
}

export default function ExportInternalPDFButton({
  product,
  components,
  packagingItems,
}: ExportInternalPDFButtonProps): React.ReactElement {
  const handleExport = (): void => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(product.product_name || "Product", 14, 20);

    doc.setFontSize(10);
    doc.text(`SKU: ${product.sku || "-"}`, 14, 28);
    doc.text(`Barcode: ${product.barcode || "-"}`, 14, 34);
    doc.text(`Category: ${product.category || "-"}`, 14, 40);

    // Ingredients
    autoTable(doc, {
      startY: 50,
      head: [["Ingredient", "% of Formula", "Cost / kg", "Line Cost"]],
      body: components.map((c) => [
        c.name,
        `${c.percent.toFixed(2)}%`,
        `$${c.unit_cost.toFixed(2)}`,
        `$${c.line_cost.toFixed(2)}`,
      ]),
      theme: "grid",
    });

    // Packaging
    autoTable(doc, {
      startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 60,
      head: [["Packaging Item", "Quantity", "Unit Cost", "Line Cost"]],
      body: packagingItems.map((p) => [
        p.name,
        p.quantity.toString(),
        `$${p.unit_cost.toFixed(2)}`,
        `$${p.line_cost.toFixed(2)}`,
      ]),
      theme: "grid",
    });

    // Cost summary
    autoTable(doc, {
      startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 70,
      head: [["Metric", "Value"]],
      body: [
        ["Formula Weight (kg)", product.formula_kg?.toFixed(3) || "-"],
        ["Total Cost Per KG", `$${(product.cost_per_kg || 0).toFixed(2)}`],
        ["Labor Cost", `$${(product.labor_cost || 0).toFixed(2)}`],
        ["Inflow Cost", `$${(product.inflow_cost || 0).toFixed(2)}`],
        ["Total Packaging Cost", `$${(product.packaging_cost || 0).toFixed(2)}`],
      ],
      theme: "grid",
    });

    // Tiered Pricing
    autoTable(doc, {
      startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 80,
      head: [["Quantity", "Price / Unit", "Profit / Unit"]],
      body: Object.entries(product.tiered_pricing || {}).map(
        ([qty, data]: [string, { price: number; profit: number }]) => [
          qty,
          `$${data.price.toFixed(2)}`,
          `$${data.profit.toFixed(2)}`,
        ]
      ),
      theme: "grid",
    });

    // Bulk Pricing
    autoTable(doc, {
      startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 90,
      head: [["Size", "MSRP", "Profit", "Packaging"]],
      body: Object.entries(product.bulk_pricing || {}).map(
        ([size, data]: [string, { msrp: number; profit: number; packaging: number }]) => [
          size,
          `$${data.msrp.toFixed(2)}`,
          `$${data.profit.toFixed(2)}`,
          `$${data.packaging.toFixed(2)}`,
        ]
      ),
      theme: "grid",
    });

    doc.save(`${product.product_name || "product"}_internal.pdf`);
  };

  return (
    <button
      onClick={handleExport}
      className="px-4 py-2 bg-[#0e5439] text-white rounded hover:bg-[#0c4630] transition cursor-pointer"
    >
      Export Internal PDF
    </button>
  );
}
