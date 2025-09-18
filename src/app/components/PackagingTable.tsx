"use client";

import React from "react";
import { RotateCcw, Plus, Minus } from "lucide-react";
import type { PackagingItemEditable } from "../types";

interface PackagingTableProps {
  packagingItems: PackagingItemEditable[];
  setPackagingItems: (c: PackagingItemEditable[]) => void;
}

export default function PackagingTable({
  packagingItems,
  setPackagingItems,
}: PackagingTableProps): React.ReactElement {
  const handleReset = (): void => {
    setPackagingItems([]);
  };

  const handleAddItem = (): void => {
    const newItem: PackagingItemEditable = {
      name: "New Packaging Item",
      quantity: 0,
      unit_cost: 0,
      line_cost: 0,
    };
    setPackagingItems([...packagingItems, newItem]);
  };

  const handleRemoveItem = (index: number): void => {
    const updated = [...packagingItems];
    updated.splice(index, 1);
    setPackagingItems(updated);
  };

  const handleEdit = (
    index: number,
    field: "name" | "quantity" | "unit_cost" | "line_cost",
    value: string
  ): void => {
    const updated = [...packagingItems];

    if (field === "name") {
      updated[index] = { ...updated[index], name: value };
    } else {
      const num = parseFloat(value) || 0;
      updated[index] = { ...updated[index], [field]: num };
    }

    updated[index].line_cost =
      (updated[index].quantity || 0) * (updated[index].unit_cost || 0);

    setPackagingItems(updated);
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
          Add Packaging Item
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
                <th className="px-4 py-3 text-left">Packaging Item</th>
                <th className="px-4 py-3 text-right">Quantity</th>
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
                      min={0}
                      value={item.quantity}
                      onChange={(e) =>
                        handleEdit(index, "quantity", e.target.value)
                      }
                      className="w-20 text-right border rounded px-2 py-1 text-sm font-mono"
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
                    ${item.line_cost.toFixed(2)}
                  </td>
                </tr>
              ))}

              {/* Totals */}
              <tr className="bg-gray-50 font-semibold border-t">
                <td colSpan={3} className="px-4 py-3 text-right">
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
    </div>
  );
}
