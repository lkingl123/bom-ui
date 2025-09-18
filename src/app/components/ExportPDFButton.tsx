"use client";

import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  ComponentEditable,
  PackagingItemEditable,
  ProductCalc,
} from "../types";

interface ExportPDFButtonProps {
  product: ProductCalc;
  components: ComponentEditable[];
  packagingItems: PackagingItemEditable[];
  laborCost: number;
}

export default function ExportPDFButton({
  product,
  components,
  packagingItems,
  laborCost,
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
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [["Packaging Item", "Quantity", "Unit Cost", "Line Cost"]],
      body: packagingItems.map((p) => [
        p.name,
        p.quantity.toString(),
        `$${p.unit_cost.toFixed(2)}`,
        `$${p.line_cost.toFixed(2)}`,
      ]),
      theme: "grid",
    });

    // Cost Summary
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [["Metric", "Value"]],
      body: [
        ["Formula Weight (kg)", product.formula_kg?.toFixed(3) || "-"],
        ["Cost per kg", `$${product.cost_per_kg?.toFixed(2) || "0.00"}`],
        ["Labor Cost", `$${laborCost.toFixed(2)}`],
        ["Misc Cost", `$${product.misc_cost?.toFixed(2) || "0.00"}`],
        ["Inflow Cost", `$${product.inflow_cost?.toFixed(2) || "0.00"}`],
        ["Total Packaging Cost", `$${product.packaging_cost?.toFixed(2) || "0.00"}`],
      ],
      theme: "grid",
    });

    // Tiered Pricing
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [["Quantity", "Price / Unit"]],
      body: Object.entries(product.tiered_pricing || {}).map(([qty, price]) => [
        qty,
        `$${price.toFixed(2)}`,
      ]),
      theme: "grid",
    });

    // Bulk Pricing
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [["Size", "Price"]],
      body: Object.entries(product.bulk_pricing || {}).map(([size, price]) => [
        size,
        `$${price.toFixed(2)}`,
      ]),
      theme: "grid",
    });

    doc.save(`${product.product_name || "product"}.pdf`);
  };

  return (
    <button
      onClick={handleExport}
      className="px-4 py-2 bg-[#0e5439] text-white rounded hover:bg-[#0c4630] transition"
    >
      Export PDF
    </button>
  );
}
