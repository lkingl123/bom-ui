// src/app/components/PackagingTable.tsx
"use client";

import React, { useState } from "react";
import { RotateCcw, Plus, Minus } from "lucide-react";
import type { PackagingItemEditable, ProductSummary } from "../types";
import PackagingSearch from "./PackagingSearch";

interface PackagingTableProps {
  packagingItems: PackagingItemEditable[];
  setPackagingItems: (c: PackagingItemEditable[]) => void;
  orderQuantity: number; // ✅ passed from ProductDetailClient
}

export default function PackagingTable({
  packagingItems,
  setPackagingItems,
  orderQuantity,
}: PackagingTableProps): React.ReactElement {
  const [showSearch, setShowSearch] = useState(false);

  const handleReset = (): void => {
    setPackagingItems([]);
  };

  const handleAddItem = (): void => {
    setShowSearch(true); // open search modal
  };

  const handleRemoveItem = (index: number): void => {
    const updated = [...packagingItems];
    updated.splice(index, 1);
    setPackagingItems(updated);
  };

  const handleEdit = (
    index: number,
    field: "name" | "unit_cost",
    value: string
  ): void => {
    const updated = [...packagingItems];
    if (field === "name") {
      updated[index] = { ...updated[index], name: value };
    } else {
      const num = parseFloat(value) || 0;
      updated[index] = { ...updated[index], unit_cost: num };
    }

    // line_cost now = unit_cost × orderQuantity
    updated[index].line_cost = (updated[index].unit_cost || 0) * orderQuantity;

    setPackagingItems(updated);
  };

  const handleSelectFromSearch = (p: ProductSummary): void => {
    const unitCost = p.cost?.cost ? parseFloat(p.cost.cost) : 0;

    const newItem: PackagingItemEditable = {
      name: p.name,
      quantity: 1, // placeholder, but unused
      unit_cost: unitCost,
      line_cost: unitCost * orderQuantity, // 🔑 use global order quantity
    };

    setPackagingItems([...packagingItems, newItem]);
    setShowSearch(false);
  };

  const total = packagingItems.reduce(
    (sum, item) => sum + (item.line_cost || 0),
    0
  );

  return (
    <div className="mt-8">
      {/* Toolbar */}
      <div className="flex justify-between mb-4">
        <button
          onClick={handleAddItem}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[#0e5439] text-white hover:bg-[#0c4630] transition text-sm font-medium shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Packaging Component
        </button>
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition text-sm font-medium shadow-sm cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 shadow-sm bg-white p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs font-semibold">
              <tr>
                <th className="px-4 py-3 text-left">Packaging Component</th>
                <th className="px-4 py-3 text-right">Unit Cost ($)</th>
                <th className="px-4 py-3 text-right">Line Cost ($)</th>
              </tr>
            </thead>
            <tbody>
              {packagingItems.map((item, index) => (
                <tr key={index} className="border-t hover:bg-gray-50 transition">
                  <td className="px-4 py-2 flex items-center gap-2">
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-500 hover:text-red-700"
                      title="Remove packaging item"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleEdit(index, "name", e.target.value)}
                      className="flex-1 border rounded px-2 py-1 text-sm"
                    />
                  </td>

                  <td className="px-4 py-2 text-right">
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={item.unit_cost}
                      onChange={(e) =>
                        handleEdit(index, "unit_cost", e.target.value)
                      }
                      className="w-24 text-right border rounded px-2 py-1 text-sm font-mono"
                    />
                  </td>

                  <td className="px-4 py-2 text-right font-mono">
                    ${(item.unit_cost * orderQuantity).toFixed(2)}
                  </td>
                </tr>
              ))}

              {/* Totals */}
              <tr className="bg-gray-50 font-semibold border-t">
                <td colSpan={2} className="px-4 py-3 text-right">
                  Total Packaging Cost
                </td>
                <td className="px-4 py-3 text-right text-[#0e5439] font-mono">
                  ${total.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Search */}
      {showSearch && (
        <PackagingSearch
          onSelect={handleSelectFromSearch}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  );
}
