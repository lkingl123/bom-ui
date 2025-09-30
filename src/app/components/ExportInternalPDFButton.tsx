"use client";

import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ProductCalc, ComponentEditable, PackagingItemEditable } from "../types";

export default function ExportInternalPDFButton({
  product,
}: {
  product: ProductCalc;
}) {
  const handleExport = () => {
    const doc = new jsPDF();

    // -------------------------
    // Product Info
    // -------------------------
    doc.setFontSize(16);
    doc.text(product.name || "Product", 14, 20);

    doc.setFontSize(10);
    doc.text(`Name of Product: ${product.name || "-"}`, 14, 30);
    doc.text(`Description: ${product.description || "-"}`, 14, 36, { maxWidth: 180 });
    doc.text(`Remarks: ${product.remarks || "-"}`, 14, 42, { maxWidth: 180 });
    doc.text(`SKU: ${product.sku || "-"}`, 14, 48);
    doc.text(`Category: ${product.category || "-"}`, 14, 54);
    doc.text(`Account: ${product.customFields?.custom8 || "-"}`, 14, 60);
    doc.text(`INCI: ${product.customFields?.custom1 || "-"}`, 14, 66, { maxWidth: 180 });

    let y = 76;

    // -------------------------
    // Ingredient Table
    // -------------------------
    if (product.components?.length) {
      autoTable(doc, {
        startY: y,
        head: [["Component", "% of Formula", "Cost/kg", "Cost"]],
        body: product.components.map((c: ComponentEditable) => [
          c.name,
          `${(c.quantity * 100).toFixed(2)}%`,
          `$${c.unit_cost?.toFixed(2)}`,
          `$${c.line_cost?.toFixed(2)}`,
        ]),
        styles: { fontSize: 8 },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    // -------------------------
    // Packaging Table
    // -------------------------
    if ((product as any).packagingItems?.length) {
      autoTable(doc, {
        startY: y,
        head: [["Packaging Component", "Unit Cost", "Line Cost"]],
        body: (product as any).packagingItems.map((p: PackagingItemEditable) => [
          p.name,
          `$${p.unit_cost?.toFixed(2)}`,
          `$${p.line_cost?.toFixed(2)}`,
        ]),
        styles: { fontSize: 8 },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    // -------------------------
    // Tiered Pricing
    // -------------------------
    if (product.tiered_pricing) {
      autoTable(doc, {
        startY: y,
        head: [["Qty", "Price/Unit", "Profit/Unit", "Margin %"]],
        body: Object.entries(product.tiered_pricing).map(([qty, data]: any) => [
          qty,
          `$${data.price.toFixed(2)}`,
          `$${data.profit.toFixed(2)}`,
          `${(data.margin * 100).toFixed(1)}%`,
        ]),
        styles: { fontSize: 8 },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    // -------------------------
    // Bulk Pricing
    // -------------------------
    if (product.bulk_pricing) {
      autoTable(doc, {
        startY: y,
        head: [["Size", "MSRP", "Profit/Unit", "Packaging"]],
        body: Object.entries(product.bulk_pricing).map(([size, data]: any) => [
          size,
          `$${data.msrp.toFixed(2)}`,
          `$${data.profit.toFixed(2)}`,
          `$${data.packaging.toFixed(2)}`,
        ]),
        styles: { fontSize: 8 },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    // -------------------------
    // Pricing Summary
    // -------------------------
    doc.setFontSize(12);
    doc.text("Pricing Summary", 14, y);
    y += 6;
    doc.setFontSize(10);
    doc.text(`Unit Weight (kg): ${product.unit_weight_kg?.toFixed(3) || "-"}`, 14, y);
    y += 5;
    doc.text(`Cost per Unit: $${product.cost_per_unit_excel?.toFixed(3) || "-"}`, 14, y);
    y += 5;
    doc.text(
      `Base Cost per Unit: ${
        product.base_cost_per_unit ? `$${product.base_cost_per_unit.toFixed(3)}` : "-"
      }`,
      14,
      y
    );
    y += 5;
    doc.text(`Total Cost per Unit: $${product.total_cost_excel?.toFixed(2) || "-"}`, 14, y);
    y += 5;
    doc.text(
      `Total Base Cost: ${
        product.total_base_cost !== undefined ? `$${product.total_base_cost.toFixed(2)}` : "-"
      }`,
      14,
      y
    );

    // Save
    doc.save(`${product.name || "product"}.pdf`);
  };

  return (
    <button
      onClick={handleExport}
      className="px-4 py-2 bg-gray-600 text-white rounded shadow hover:bg-gray-700 transition cursor-pointer"
    >
      Export Internal PDF
    </button>
  );
}
