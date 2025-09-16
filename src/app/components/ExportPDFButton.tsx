"use client";

import { jsPDF } from "jspdf";

export default function ExportPDFButton({
  product,
}: {
  product: any;
}) {
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
    product.components.forEach((c: any) => {
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
      className="px-5 py-2.5 rounded-lg bg-[#0e5439] text-white font-medium shadow-md hover:bg-[#0c4630] transition transform hover:-translate-y-0.5"
    >
      Export PDF
    </button>
  );
}
