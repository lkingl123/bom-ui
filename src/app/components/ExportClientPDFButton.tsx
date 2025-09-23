"use client";

import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ProductCalc, InciEntry } from "../types";

// Extend jsPDF type
declare module "jspdf" {
  interface jsPDF {
    lastAutoTable?: { finalY: number };
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

    // ===== Header =====
    doc.setFontSize(16);
    doc.text(product.product_name || "Product", 14, 20);

    doc.setFontSize(10);
    doc.text(`SKU: ${product.sku || "-"}`, 14, 28);
    doc.text(`Category: ${product.category || "-"}`, 14, 34);

    // ===== INCI =====
    const inciList = Array.isArray(product.inci)
      ? product.inci.map((i: InciEntry) =>
          i.percentage ? `${i.name} (${i.percentage})` : i.name
        )
      : ["-"];
    const inciWrapped: string[] = doc.splitTextToSize(
      ["INCI:"].concat(inciList.map((item) => `- ${item}`)).join("\n"),
      180
    );
    doc.text(inciWrapped, 14, 40);

    // ===== Remarks =====
    const remarksWrapped = doc.splitTextToSize(
      `Remarks: ${product.remarks || "-"}`,
      180
    );
    const remarksY = 40 + inciWrapped.length * 6 + 6;
    doc.text(remarksWrapped, 14, remarksY);

    // Dynamic Y after INCI + Remarks
    const currentY = remarksY + remarksWrapped.length * 6 + 10;

    // ===== Bulk Pricing =====
    autoTable(doc, {
      startY: currentY,
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
      headStyles: { halign: "center", fillColor: [14, 84, 57] },
    });

    // ===== Tiered Pricing =====
    autoTable(doc, {
      startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : currentY + 20,
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
      headStyles: { halign: "center", fillColor: [14, 84, 57] },
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
