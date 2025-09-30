// src/app/components/ExportClientPDFButton.tsx
"use client";
import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import LoadingSpinner from "./LoadingSpinner";
import type { ProductCalc, Customer, EstimateForm } from "../types";

export default function ExportClientPDFButton({
  product,
}: {
  product: ProductCalc;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [search, setSearch] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  const [form, setForm] = useState<EstimateForm>({
    customerId: "",
    name: "",
    company: "",
    address: "",
    phone: "",
    email: "",
    estimateNo: "",
    estimateDate: "",
    validFor: "",
    notes: "",
  });

  const isFormValid = Object.values(form).every((val) => val.trim() !== "");

  // 🔎 Fetch customers when searching
  useEffect(() => {
    if (!isOpen || search.length < 2) return;

    const fetchCustomers = async () => {
      setLoadingCustomers(true);
      const url = `/api/customers?smart=${encodeURIComponent(search)}`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch customers");
        const data: Customer[] = await res.json();
        setCustomers(data);
      } catch (err) {
        console.error("[ExportClientPDFButton] Error fetching customers:", err);
      } finally {
        setLoadingCustomers(false);
      }
    };

    const timeout = setTimeout(fetchCustomers, 400);
    return () => clearTimeout(timeout);
  }, [search, isOpen]);

  // 📄 PDF generator
  const generatePDF = () => {
    const doc = new jsPDF();
    const img = new Image();
    img.src = "/pureearth-logo.webp";

    img.onload = () => {
      doc.addImage(img, "WEBP", 14, 10, 40, 15);

      doc.setFontSize(16);
      doc.text("Unit Pricing Estimate", 200, 20, { align: "right" });

      doc.setFontSize(12);
      doc.text("Bill To", 14, 35);
      doc.text(`Name: ${form.name}`, 14, 42);
      doc.text(`Company: ${form.company}`, 14, 49);
      doc.text(`Address: ${form.address}`, 14, 56);
      doc.text(`Phone: ${form.phone}`, 14, 63);
      doc.text(`Email: ${form.email}`, 14, 70);

      doc.text(`Estimate #: ${form.estimateNo}`, 200, 42, { align: "right" });
      doc.text(`Estimate Date: ${form.estimateDate}`, 200, 49, {
        align: "right",
      });
      doc.text(`Valid For: ${form.validFor}`, 200, 56, { align: "right" });

      autoTable(doc, {
        startY: 80,
        head: [
          [
            "Description",
            ...Object.keys(product.tiered_pricing ?? {}).map(
              (q) => `${q} Units`
            ),
          ],
        ],
        body: [
          [
            product.name,
            ...Object.values(product.tiered_pricing ?? {}).map(
              (d) => `$${d.price.toFixed(2)}`
            ),
          ],
        ],
        styles: { halign: "center" },
        headStyles: { fillColor: [14, 84, 57] },
      });

      // `lastAutoTable` isn’t typed, so cast doc as unknown first
      const finalY =
        (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
          ?.finalY ?? 100;

      doc.text("Notes:", 14, finalY + 15);
      doc.text(form.notes || "-", 14, finalY + 22);

      doc.save(`${product.name}_ClientEstimate.pdf`);
    };
  };

  const handleSaveExport = () => {
    if (!isFormValid) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setIsOpen(false);
    generatePDF();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition cursor-pointer"
      >
        Export Client PDF
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 p-6 rounded shadow w-96 space-y-4 text-gray-900 dark:text-gray-100">
            <h2 className="text-lg font-bold">Fill Estimate Details</h2>

            {/* 🔍 Customer search */}
            <input
              placeholder="Search Customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />

            {/* Customer dropdown */}
            {loadingCustomers ? (
              <div className="flex justify-center py-2">
                <LoadingSpinner />
              </div>
            ) : customers.length > 0 ? (
              <select
                value={form.customerId}
                required
                onChange={(e) => {
                  const selected = customers.find(
                    (c) => c.customerId === e.target.value
                  );
                  if (selected) {
                    setForm((prev) => ({
                      ...prev,
                      customerId: selected.customerId,
                      name: selected.contactName || "",
                      company: selected.name || "",
                      phone: selected.phone || "",
                      email: selected.email || "",
                    }));
                  }
                }}
                className="w-full border rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select Customer</option>
                {customers.map((c) => (
                  <option key={c.customerId} value={c.customerId}>
                    {c.name} — {c.contactName}
                  </option>
                ))}
              </select>
            ) : null}

            {/* Manual fields */}
            {(Object.keys(form) as (keyof EstimateForm)[])
              .filter(
                (field) =>
                  !["customerId", "name", "notes"].includes(field as string)
              )
              .map((field) => (
                <input
                  key={field}
                  placeholder={field}
                  value={form[field]}
                  required
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, [field]: e.target.value }))
                  }
                  className="w-full border rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              ))}

            <textarea
              placeholder="Notes"
              value={form.notes}
              required
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              className="w-full border rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              rows={3}
            />

            {/* Inline error reminder */}
            {showErrors && !isFormValid && (
              <p className="text-red-500 text-sm">
                ⚠️ All fields are required before exporting.
              </p>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 dark:text-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveExport}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
