"use client";
import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import LoadingSpinner from "./LoadingSpinner";
import type { ProductCalc, Customer, EstimateForm } from "../types";
import { ArrowLeft, X } from "lucide-react";

export default function ExportClientPDFButton({ product }: { product: ProductCalc }) {
  const [isOpen, setIsOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [search, setSearch] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

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

  const isFormValid = Object.entries(form).every(
    ([k, v]) => !(k !== "customerId" && v.trim() === "")
  );

  // 🔎 Fetch customers
  useEffect(() => {
    if (!isOpen || search.length < 2 || isCreatingNew || selectedCustomer) return;
    const fetchCustomers = async () => {
      setLoadingCustomers(true);
      try {
        const res = await fetch(`/api/customers?smart=${encodeURIComponent(search)}`);
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
  }, [search, isOpen, isCreatingNew, selectedCustomer]);

  // 📄 Generate PDF
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
      doc.text(`Estimate Date: ${form.estimateDate}`, 200, 49, { align: "right" });
      doc.text(`Valid For: ${form.validFor}`, 200, 56, { align: "right" });

      autoTable(doc, {
        startY: 80,
        head: [["Description", ...Object.keys(product.tiered_pricing ?? {}).map((q) => `${q} Units`)]],
        body: [
          [
            product.name,
            ...Object.values(product.tiered_pricing ?? {}).map((d) => `$${d.price.toFixed(2)}`),
          ],
        ],
        styles: { halign: "center" },
        headStyles: { fillColor: [14, 84, 57] },
      });

      const finalY =
        (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 100;

      doc.text("Notes:", 14, finalY + 15);
      doc.text(form.notes || "-", 14, finalY + 22);

      doc.save(`${product.name}_ClientEstimate.pdf`);
    };
  };

  // 🧠 Handlers
  const handleSaveExport = () => {
    if (!isFormValid) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setIsOpen(false);
    generatePDF();
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setForm((prev) => ({
      ...prev,
      customerId: customer.customerId,
      name: customer.contactName || "",
      company: customer.name,
      phone: customer.phone || "",
      email: customer.email || "",
      address: "",
    }));
  };

  const handleChangeCustomer = () => {
    // ✅ Clear customer-related fields only
    setSelectedCustomer(null);
    setSearch("");
    setCustomers([]);
    setIsCreatingNew(false);
    setForm((prev) => ({
      ...prev,
      customerId: "",
      name: "",
      company: "",
      address: "",
      phone: "",
      email: "",
    }));
  };

  const handleCreateNew = () => {
    // ✅ Fully blank form for new customer
    setIsCreatingNew(true);
    setSelectedCustomer(null);
    setSearch("");
    setCustomers([]);
    setForm((prev) => ({
      ...prev,
      customerId: "",
      name: "",
      company: "",
      address: "",
      phone: "",
      email: "",
    }));
  };

  const handleBack = () => {
    setIsCreatingNew(false);
    setSearch("");
    setCustomers([]);
  };

  const resetModal = () => {
    setIsCreatingNew(false);
    setSelectedCustomer(null);
    setSearch("");
    setCustomers([]);
    setForm({
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
  };

  // 🖼 UI
  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
          resetModal();
        }}
        className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition cursor-pointer"
      >
        Export Client PDF
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-xl w-full max-w-lg text-gray-900 dark:text-gray-100 relative">
            {isCreatingNew && (
              <button
                onClick={handleBack}
                className="absolute top-4 left-4 text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft size={18} />
              </button>
            )}

            <h2 className="text-xl font-semibold mb-4 text-center">Client Estimate</h2>

            {/* 🔍 Customer Search */}
            {!isCreatingNew && !selectedCustomer && (
              <div className="space-y-2">
                <label className="block text-sm font-medium">Search Customer</label>
                <input
                  placeholder="Type at least 2 characters..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800"
                />

                {loadingCustomers ? (
                  <div className="flex justify-center py-2">
                    <LoadingSpinner />
                  </div>
                ) : customers.length > 0 ? (
                  <ul className="border rounded divide-y divide-gray-200 dark:divide-gray-700 max-h-48 overflow-y-auto">
                    {customers.map((c) => (
                      <li
                        key={c.customerId}
                        onClick={() => handleSelectCustomer(c)}
                        className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                      >
                        <p className="font-medium">{c.name}</p>
                        <p className="text-sm text-gray-500">{c.contactName || c.email}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">
                    No customers found.&nbsp;
                    <button
                      onClick={handleCreateNew}
                      className="text-blue-600 hover:underline"
                    >
                      ➕ Create New Customer
                    </button>
                  </p>
                )}
              </div>
            )}

            {/* 👤 Selected Customer Summary */}
            {selectedCustomer && (
              <div className="flex items-center justify-between border-b pb-2 mb-4 bg-gray-50 dark:bg-gray-800 rounded px-2 py-1">
                <div>
                  <p className="font-semibold">{form.company}</p>
                  <p className="text-sm text-gray-600">{form.name || form.email}</p>
                  <p className="text-xs text-gray-500">{form.phone}</p>
                </div>
                <button
                  onClick={handleChangeCustomer}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <X size={14} /> Change
                </button>
              </div>
            )}

            {/* 👤 Customer Info */}
            <div className="space-y-3 mt-3">
              {["name", "company", "address", "phone", "email"].map((f) => (
                <div key={f}>
                  <label className="block text-xs font-medium capitalize mb-1">{f}</label>
                  <input
                    value={(form as any)[f]}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [f]: e.target.value }))
                    }
                    className="w-full border rounded px-3 py-1.5 bg-white dark:bg-gray-800"
                    placeholder={`Enter ${f}`}
                  />
                </div>
              ))}
            </div>

            {/* 🧾 Estimate Info */}
            <div className="space-y-3 mt-4">
              {/* Estimate No */}
              <div>
                <label className="block text-xs font-medium mb-1">Estimate No</label>
                <input
                  type="text"
                  value={form.estimateNo}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, estimateNo: e.target.value }))
                  }
                  className="w-full border rounded px-3 py-1.5 bg-white dark:bg-gray-800"
                  placeholder="Enter estimate number"
                />
              </div>

              {/* Estimate Date */}
              <div>
                <label className="block text-xs font-medium mb-1">Estimate Date</label>
                <input
                  type="date"
                  value={form.estimateDate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, estimateDate: e.target.value }))
                  }
                  className="w-full border rounded px-3 py-1.5 bg-white dark:bg-gray-800"
                />
              </div>

              {/* Valid For */}
              <div>
                <label className="block text-xs font-medium mb-1">Valid For</label>
                <input
                  type="text"
                  value={form.validFor}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, validFor: e.target.value }))
                  }
                  className="w-full border rounded px-3 py-1.5 bg-white dark:bg-gray-800"
                  placeholder="e.g. 30 days"
                />
              </div>
            </div>

            {/* 📝 Notes */}
            <div className="mt-4">
              <label className="block text-xs font-medium mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="w-full border rounded px-3 py-1.5 bg-white dark:bg-gray-800"
                rows={3}
                placeholder="Enter any notes"
              />
            </div>

            {showErrors && !isFormValid && (
              <p className="text-red-500 text-sm mt-2">
                ⚠️ Please fill all required fields before exporting.
              </p>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveExport}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Export PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
