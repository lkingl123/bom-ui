"use client";

import React from "react";
import type { LaborItemEditable } from "../types";

type Props = {
  laborItems: LaborItemEditable[];
  setLaborItems: React.Dispatch<React.SetStateAction<LaborItemEditable[]>>;
};

export default function LaborTable({ laborItems, setLaborItems }: Props) {
  const handleChange = (
    index: number,
    field: keyof LaborItemEditable,
    value: string | number
  ) => {
    const updated = [...laborItems];

    if (field === "quantity" || field === "cost_per_touch") {
      (updated[index][field] as number) = Number(value) || 0;
    } else if (field === "name") {
      (updated[index][field] as string) = value as string;
    }

    updated[index].line_cost =
      (updated[index].quantity || 0) * (updated[index].cost_per_touch || 0);

    setLaborItems(updated);
  };

  const addRow = () => {
    setLaborItems([
      ...laborItems,
      { name: "", quantity: 0, cost_per_touch: 0, line_cost: 0 },
    ]);
  };

  const removeRow = (index: number) => {
    setLaborItems(laborItems.filter((_, i) => i !== index));
  };

  const total = laborItems.reduce(
    (sum, item) => sum + (item.line_cost || 0),
    0
  );

  return (
    <div className="mt-8 bg-white rounded-xl shadow p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Labor Components
      </h3>
      <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-100 text-gray-700 font-medium">
          <tr>
            <th className="px-4 py-2 text-left">Step</th>
            <th className="px-4 py-2 text-right">Touches</th>
            <th className="px-4 py-2 text-right">Cost / Touch ($)</th>
            <th className="px-4 py-2 text-right">Line Cost ($)</th>
            <th className="px-4 py-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {laborItems.map((item, index) => (
            <tr key={index} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => handleChange(index, "name", e.target.value)}
                  className="border rounded px-2 py-1 w-full text-sm"
                />
              </td>
              <td className="px-4 py-2 text-right">
                <input
                  type="number"
                  min={0}
                  value={item.quantity}
                  onChange={(e) =>
                    handleChange(index, "quantity", Number(e.target.value))
                  }
                  className="w-24 border rounded px-2 py-1 text-sm text-right font-mono"
                />
              </td>
              <td className="px-4 py-2 text-right">
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={item.cost_per_touch}
                  onChange={(e) =>
                    handleChange(index, "cost_per_touch", Number(e.target.value))
                  }
                  className="w-24 border rounded px-2 py-1 text-sm text-right font-mono"
                />
              </td>
              <td className="px-4 py-2 text-right font-mono">
                ${item.line_cost.toFixed(2)}
              </td>
              <td className="px-4 py-2 text-center">
                <button
                  onClick={() => removeRow(index)}
                  className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 font-semibold">
            <td className="px-4 py-2 text-right" colSpan={3}>
              Total Labor Cost
            </td>
            <td className="px-4 py-2 text-right font-mono">
              ${total.toFixed(2)}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>

      <div className="mt-4">
        <button
          onClick={addRow}
          className="px-4 py-2 bg-[#0e5439] text-white rounded hover:bg-[#0c4630] transition"
        >
          + Add Labor Item
        </button>
      </div>
    </div>
  );
}
