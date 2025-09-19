"use client";

import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  ComponentEditable,
  PackagingItemEditable,
  ProductCalc,
} from "../types";

// Extend jsPDF type to include lastAutoTable
declare module "jspdf" {
  interface jsPDF {
    lastAutoTable?: {
      finalY: number;
    };
  }
}

interface ExportPDFButtonProps {
  product: ProductCalc;
  components: ComponentEditable[];
  packagingItems: PackagingItemEditable[];
}

export default function ExportPDFButton({
  product,
  components,
  packagingItems,
}: ExportPDFButtonProps): React.ReactElement {
  const handleExport = (): void => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(16);
    doc.text(product.product_name || "Product", 14, 20);

    doc.setFontSize(10);
    doc.text(`SKU: ${product.sku || "-"}`, 14, 28);
    doc.text(`Barcode: ${product.barcode || "-"}`, 14, 34);
    doc.text(`Category: ${product.category || "-"}`, 14, 40);

    // Ingredients Table
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

    // Packaging Table
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

    // Cost Summary (misc removed)
    const finalCombined =
      (product.cost_per_kg || 0) +
      (product.labor_cost || 0) +
      (product.packaging_cost || 0) +
      (product.inflow_cost || 0);

    autoTable(doc, {
      startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 70,
      head: [["Metric", "Value"]],
      body: [
        ["Formula Weight (kg)", product.formula_kg?.toFixed(3) || "-"],
        ["Ingredient Cost Per Unit", `$${(product.cost_per_kg || 0).toFixed(2)}`],
        ["Labor Cost", `$${(product.labor_cost || 0).toFixed(2)}`],
        ["Inflow Cost", `$${(product.inflow_cost || 0).toFixed(2)}`],
        ["Total Packaging Cost", `$${(product.packaging_cost || 0).toFixed(2)}`],
        ["Final Combined Cost", `$${finalCombined.toFixed(2)}`],
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
          `$${data.profit.toFixed(3)}`,
        ]
      ),
      theme: "grid",
    });

    // Bulk Pricing
    autoTable(doc, {
      startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 90,
      head: [["Size", "MSRP", "Profit Per Unit", "Packaging Cost"]],
      body: Object.entries(product.bulk_pricing || {}).map(
        ([size, data]: [
          string,
          { msrp: number; profit: number; packaging: number }
        ]) => [
          size,
          `$${data.msrp.toFixed(2)}`,
          `$${data.profit.toFixed(2)}`,
          `$${data.packaging.toFixed(2)}`,
        ]
      ),
      theme: "grid",
    });

    doc.save(`${product.product_name || "product"}.pdf`);
  };

  return (
    <button
      onClick={handleExport}
      className="px-4 py-2 bg-[#0e5439] text-white rounded hover:bg-[#0c4630] transition cursor-pointer"
    >
      Export PDF
    </button>
  );
}
