// src/app/components/ExportClientPDFButton.tsx
"use client";

import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ProductCalc, InciEntry } from "../types";

// Extend jsPDF type to support lastAutoTable
declare module "jspdf" {
  interface jsPDF {
    lastAutoTable?: {
      finalY: number;
    };
  }
}

interface ExportClientPDFButtonProps {
  product: ProductCalc;
}

export default function ExportClientPDFButton({
  product,
}: ExportClientPDFButtonProps): React.ReactElement {
  const handleExport = (): void => {
    const doc = new jsPDF();

    // Title & basic info
    doc.setFontSize(16);
    doc.text(product.product_name || "Product", 14, 20);

    doc.setFontSize(10);
    doc.text(`SKU: ${product.sku || "-"}`, 14, 28);
    doc.text(`Category: ${product.category || "-"}`, 14, 34);

    // ✅ Wrap INCI
    const inciText = Array.isArray(product.inci)
      ? product.inci
          .map((i: InciEntry) =>
            i.percentage ? `${i.name} (${i.percentage})` : i.name
          )
          .join(", ")
      : "-";
    const inciWrapped = doc.splitTextToSize(`INCI: ${inciText}`, 180);
    doc.text(inciWrapped, 14, 40);

    // ✅ Wrap Remarks
    const remarksWrapped = doc.splitTextToSize(
      `Remarks: ${product.remarks || "-"}`,
      180
    );
    doc.text(remarksWrapped, 14, 46 + inciWrapped.length * 5);

    // Bulk Pricing
    autoTable(doc, {
      startY: 55 + inciWrapped.length * 5,
      head: [["Size", "MSRP", "Profit", "Packaging"]],
      body:
        Object.entries(product.bulk_pricing || {}).map(
          ([size, data]: [
            string,
            { msrp: number; profit: number; packaging: number }
          ]) => [
            size,
            `$${data.msrp.toFixed(2)}`,
            `$${data.profit.toFixed(2)}`,
            `$${data.packaging.toFixed(2)}`,
          ]
        ) || [["-", "-", "-", "-"]],
      theme: "grid",
      styles: { halign: "right" },
      headStyles: { halign: "center", fillColor: [14, 84, 57] }, // ✅ green header
    });

    // Tiered Pricing
    autoTable(doc, {
      startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 80,
      head: [["Quantity", "Price / Unit", "Profit / Unit"]],
      body:
        Object.entries(product.tiered_pricing || {}).map(
          ([qty, data]: [string, { price: number; profit: number }]) => [
            qty,
            `$${data.price.toFixed(2)}`,
            `$${data.profit.toFixed(2)}`,
          ]
        ) || [["-", "-", "-"]],
      theme: "grid",
      styles: { halign: "right" },
      headStyles: { halign: "center", fillColor: [14, 84, 57] }, // ✅ green header
    });

    doc.save(`${product.product_name || "product"}_client.pdf`);
  };

  return (
    <button
      onClick={handleExport}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition cursor-pointer"
    >
      Export Client PDF
    </button>
  );
}
