// src/app/components/ExportClientPDFButton.tsx
"use client";

import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ProductCalc } from "../types";

// Extend jsPDF to support lastAutoTable
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

    // ✅ Handle INCI as array
    const inciText = Array.isArray(product.inci)
      ? product.inci
          .map((i) =>
            i.percentage ? `${i.name} (${i.percentage})` : i.name
          )
          .join(", ")
      : "-";

    doc.text(`INCI: ${inciText}`, 14, 40);

    const remarks = doc.splitTextToSize(
      `Remarks: ${product.remarks || "-"}`,
      180
    );
    doc.text(remarks, 14, 46);

    // Bulk Pricing (now includes packaging)
    autoTable(doc, {
      startY: 55,
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
      headStyles: { halign: "center", fillColor: "#0e5439", textColor: "#fff" },
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
      headStyles: { halign: "center", fillColor: "#0e5439", textColor: "#fff" },
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
