"use client";

import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ProductCalc } from "../types";

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

    // Bulk Pricing (client only cares about this + tiered pricing)
    autoTable(doc, {
      startY: 45,
      head: [["Size", "MSRP", "Profit"]],
      body: Object.entries(product.bulk_pricing || {}).map(
        ([size, data]: [string, { msrp: number; profit: number; packaging: number }]) => [
          size,
          `$${data.msrp.toFixed(2)}`,
          `$${data.profit.toFixed(2)}`,
        ]
      ),
      theme: "grid",
    });

    // Tiered Pricing
    autoTable(doc, {
      startY: (doc as any).lastAutoTable?.finalY + 10 || 70,
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
