"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Fix TS type error for lastAutoTable
declare module "jspdf" {
  interface jsPDF {
    lastAutoTable: { finalY: number };
  }
}

type Component = {
  name: string;
  quantity: number;
  uom: string;
  unit_cost: number;
  line_cost: number;
};

type Product = {
  product_name: string;
  sku?: string;
  barcode?: string;
  components: Component[];
  calculated_cost: number; // Base cost only
};

export default function ExportPDFButton({
  product,
  packagingCost,
  laborCost,
}: {
  product: Product;
  packagingCost: number;
  laborCost: number;
}) {
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
    const baseCost = product.calculated_cost || 0;
    const finalCost = baseCost + packagingCost + laborCost;

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      body: [
        [`Base Cost / kg: $${baseCost.toFixed(2)}`],
        [`Packaging: $${packagingCost.toFixed(2)}`],
        [`Labor: $${laborCost.toFixed(2)}`],
        [``], // spacing
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
