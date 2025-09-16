"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";

type Component = {
  name: string;
  quantity: number;
  uom: string;
  unit_cost: number;
  line_cost: number;
};

export default function IngredientTable({
  components,
  totalCost,
}: {
  components: Component[];
  totalCost: number;
}) {
  const [editableComponents, setEditableComponents] = useState<Component[]>(components);
  const [packagingCost, setPackagingCost] = useState(1.5);
  const [laborCost, setLaborCost] = useState(2.5);

  const handleReset = () => {
    setEditableComponents(components);
    setPackagingCost(1.5);
    setLaborCost(2.5);
  };

  const updatedTotal = editableComponents.reduce(
    (sum, c) => sum + c.line_cost,
    0
  );
  const finalCost = updatedTotal + packagingCost + laborCost;

  const handleEdit = (
    index: number,
    field: "quantity" | "unit_cost" | "line_cost",
    value: number
  ) => {
    const updated = [...editableComponents];
    updated[index] = { ...updated[index], [field]: value };

    if (field === "unit_cost" || field === "quantity") {
      updated[index].line_cost =
        updated[index].unit_cost * updated[index].quantity;
    }

    setEditableComponents(updated);
  };

  return (
    <div>
      {/* Toolbar above table */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition text-sm font-medium shadow-sm cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {/* Table card */}
      <div className="rounded-xl border border-gray-200 shadow-sm bg-white p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs font-semibold">
              <tr>
                <th className="px-4 py-3 text-left">Ingredient</th>
                <th className="px-4 py-3 text-right">Quantity</th>
                <th className="px-4 py-3 text-right">Unit Cost</th>
                <th className="px-4 py-3 text-right">Line Cost</th>
              </tr>
            </thead>
            <tbody>
              {editableComponents.map((c, i) => (
                <tr key={c.name} className="border-t hover:bg-gray-50 transition">
                  <td className="px-4 py-2">{c.name}</td>

                  {/* Editable Quantity */}
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end items-center gap-1">
                      <input
                        type="number"
                        step="0.0001"
                        value={c.quantity.toFixed(4)}
                        onChange={(e) =>
                          handleEdit(i, "quantity", Number(e.target.value))
                        }
                        className="w-24 text-right border rounded px-2 py-1 text-sm font-mono"
                      />
                      <span className="text-gray-500 text-xs">{c.uom}</span>
                    </div>
                  </td>

                  {/* Editable Unit Cost */}
                  <td className="px-4 py-2 text-right">
                    <input
                      type="number"
                      step="0.01"
                      value={c.unit_cost.toFixed(2)}
                      onChange={(e) =>
                        handleEdit(i, "unit_cost", Number(e.target.value))
                      }
                      className="w-24 text-right border rounded px-2 py-1 text-sm font-mono"
                    />
                  </td>

                  {/* Editable Line Cost */}
                  <td className="px-4 py-2 text-right">
                    <input
                      type="number"
                      step="0.01"
                      value={c.line_cost.toFixed(2)}
                      onChange={(e) =>
                        handleEdit(i, "line_cost", Number(e.target.value))
                      }
                      className="w-24 text-right border rounded px-2 py-1 text-sm font-mono"
                    />
                  </td>
                </tr>
              ))}

              {/* Base Cost */}
              <tr className="bg-gray-50 font-semibold border-t">
                <td colSpan={3} className="px-4 py-3 text-right">
                  Base Cost / kg
                </td>
                <td className="px-4 py-3 text-right text-[#0e5439] font-mono">
                  ${updatedTotal.toFixed(2)}
                </td>
              </tr>

              {/* Packaging */}
              <tr className="italic border-t">
                <td colSpan={3} className="px-4 py-3 text-right">
                  Packaging $
                </td>
                <td className="px-4 py-3 text-right">
                  <input
                    type="number"
                    step="0.01"
                    value={packagingCost.toFixed(2)}
                    onChange={(e) => setPackagingCost(Number(e.target.value))}
                    className="w-24 text-right border rounded px-3 py-1 text-sm font-mono"
                  />
                </td>
              </tr>

              {/* Labor */}
              <tr className="italic border-t">
                <td colSpan={3} className="px-4 py-3 text-right">
                  Labor $
                </td>
                <td className="px-4 py-3 text-right">
                  <input
                    type="number"
                    step="0.01"
                    value={laborCost.toFixed(2)}
                    onChange={(e) => setLaborCost(Number(e.target.value))}
                    className="w-24 text-right border rounded px-3 py-1 text-sm font-mono"
                  />
                </td>
              </tr>

              {/* Final Cost */}
              <tr className="bg-gray-100 font-bold border-t">
                <td colSpan={3} className="px-4 py-3 text-right">
                  Final Cost / kg
                </td>
                <td className="px-4 py-3 text-right text-[#0e5439] font-mono">
                  ${finalCost.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
