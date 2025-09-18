"use client";

import { jsPDF } from "jspdf";
import autoTable, { type UserOptions } from "jspdf-autotable";
import type { ProductDetail, ComponentEditable } from "../types";

// Fix TS type error for lastAutoTable
declare module "jspdf" {
  interface jsPDF {
    lastAutoTable: { finalY: number };
  }
}

export default function ExportPDFButton({
  product,
  components,
  packagingCost,
  laborCost,
}: {
  product: ProductDetail;
  components: ComponentEditable[];
  packagingCost: number;
  laborCost: number;
}) {
  const handleExport = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(16);
    doc.text(product.product_name || "Untitled Product", 14, 20);

    // SKU + Barcode
    doc.setFontSize(11);
    doc.text(`SKU: ${product.sku || "-"}`, 14, 30);
    doc.text(`Barcode: ${product.barcode || "-"}`, 14, 36);

    // Totals
    const totalQuantity = components.reduce(
      (sum, c) => sum + (Number(c.quantity) || 0),
      0
    );

    // Ingredients table
    autoTable(doc, {
      startY: 50,
      head: [["Ingredient", "% of Formula", "Unit Cost", "Cost"]],
      body: components.map((c) => {
        const percent =
          totalQuantity > 0
            ? ((Number(c.quantity) || 0) / totalQuantity) * 100
            : 0;

        return [
          c.name,
          `${percent.toFixed(2)} %`,
          `$${parseFloat(c.unit_cost.toString()).toFixed(2)}`,
          `$${parseFloat(c.line_cost.toString()).toFixed(2)}`,
        ];
      }),
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
    const baseCost = components.reduce(
      (sum, c) =>
        sum +
        (parseFloat(c.line_cost.toString()) ||
          parseFloat(c.quantity.toString()) *
            parseFloat(c.unit_cost.toString())),
      0
    );

    const finalCost = baseCost + packagingCost + laborCost;

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      body: [
        [`Base Cost / kg: $${baseCost.toFixed(2)}`],
        [`Packaging: $${packagingCost.toFixed(2)}`],
        [`Labor: $${laborCost.toFixed(2)}`],
        [""],
        [`Final Cost / kg: $${finalCost.toFixed(2)}`],
      ],
      theme: "plain",
      styles: { fontSize: 12, halign: "right" },
      didParseCell: (
        data: Parameters<NonNullable<UserOptions["didParseCell"]>>[0]
      ) => {
        if (
          data.row.index === 4 &&
          data.cell.raw?.toString().startsWith("Final Cost")
        ) {
          data.cell.styles.textColor = [14, 84, 57];
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    doc.save(`${product.product_name || "product"}.pdf`);
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
