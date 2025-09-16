"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Product } from "../types";

// Fix TS type error for lastAutoTable
declare module "jspdf" {
  interface jsPDF {
    lastAutoTable: { finalY: number };
  }
}

export default function ExportPDFButton({ product }: { product: Product }) {
  const handleExport = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(16);
    doc.text(product.product_name, 14, 20);

    // SKU + Barcode
    doc.setFontSize(11);
    doc.text(`SKU: ${product.sku || "-"}`, 14, 30);
    doc.text(`Barcode: ${product.barcode || "-"}`, 14, 36);

    // Ingredients table
    autoTable(doc, {
      startY: 50,
      head: [["Ingredient", "Qty", "Unit Cost", "Line Cost"]],
      body: product.components.map((c) => [
        c.name,
        `${c.quantity.toFixed(3)} ${c.uom}`,
        `$${c.unit_cost.toFixed(2)}`,
        `$${c.line_cost.toFixed(2)}`,
      ]),
      theme: "grid",
      styles: { fontSize: 10, halign: "right" },
      headStyles: { fillColor: [14, 84, 57], halign: "center" },
      columnStyles: {
        0: { halign: "left" },
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "right" },
      },
    });

    // Costs summary
    const baseCost = product.calculated_cost ?? 0;
    const packaging = product.packaging_cost ?? 0;
    const labor = product.labor_cost ?? 0;
    const finalCost = baseCost + packaging + labor;

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      body: [
        [`Base Cost / kg: $${baseCost.toFixed(2)}`],
        [`Packaging: $${packaging.toFixed(2)}`],
        [`Labor: $${labor.toFixed(2)}`],
        [""],
        [`Final Cost / kg: $${finalCost.toFixed(2)}`],
      ],
      theme: "plain",
      styles: { fontSize: 12, halign: "right" },
      didParseCell: (data) => {
        if (
          data.row.index === 4 &&
          data.cell.raw?.toString().startsWith("Final Cost")
        ) {
          data.cell.styles.textColor = [14, 84, 57];
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    doc.save(`${product.product_name}.pdf`);
  };

  return (
    <button
      onClick={handleExport}
      className="px-4 py-2 rounded-lg bg-[#0e5439] text-white font-medium shadow hover:bg-[#0c4630] transition cursor-pointer"
    >
      Export PDF
    </button>
  );
}
