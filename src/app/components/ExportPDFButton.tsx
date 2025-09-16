"use client";

import { jsPDF } from "jspdf";

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
  calculated_cost: number;
};

export default function ExportPDFButton({ product }: { product: Product }) {
  const handleExport = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(16);
    doc.text(product.product_name, 10, 20);

    // SKU + Barcode
    doc.setFontSize(11);
    doc.text(`SKU: ${product.sku || "-"}`, 10, 30);
    doc.text(`Barcode: ${product.barcode || "-"}`, 10, 36);

    // Table Header
    let y = 50;
    doc.setFontSize(12);
    doc.text("Ingredient", 10, y);
    doc.text("Qty", 80, y);
    doc.text("Unit Cost", 120, y);
    doc.text("Line Cost", 160, y);

    // Table Rows
    y += 8;
    product.components.forEach((c) => {
      doc.setFontSize(10);
      doc.text(c.name, 10, y);
      doc.text(`${c.quantity} ${c.uom}`, 80, y, { align: "right" });
      doc.text(`$${c.unit_cost.toFixed(2)}`, 120, y, { align: "right" });
      doc.text(`$${c.line_cost.toFixed(2)}`, 160, y, { align: "right" });
      y += 6;
    });

    // Totals
    y += 8;
    doc.setFontSize(12);
    doc.text(`Total Cost / kg: $${product.calculated_cost.toFixed(2)}`, 10, y);

    // Save file
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
