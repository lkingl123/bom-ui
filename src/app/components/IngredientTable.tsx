"use client";

import { RotateCcw, Plus, Minus } from "lucide-react";
import type { Component } from "../types";

export default function IngredientTable({
  components,
  setComponents,
  packagingCost,
  setPackagingCost,
  laborCost,
  setLaborCost,
}: {
  components: Component[];
  setComponents: (c: Component[]) => void;
  packagingCost: number;
  setPackagingCost: (v: number) => void;
  laborCost: number;
  setLaborCost: (v: number) => void;
}) {
  const handleReset = () => {
    setComponents(
      components.map((c) => ({
        ...c,
        quantity: c.quantity,
        unit_cost: c.unit_cost,
        line_cost: c.line_cost,
      }))
    );
    setPackagingCost(100.5);
    setLaborCost(200.5);
  };

  const handleAddIngredient = () => {
    const newIngredient: Component = {
      name: "New Ingredient",
      quantity: 0,
      uom: "kg",
      unit_cost: 0,
      line_cost: 0,
    };
    setComponents([...components, newIngredient]);
  };

  const handleRemoveIngredient = (index: number) => {
    const updated = [...components];
    updated.splice(index, 1);
    setComponents(updated);
  };

  const updatedTotal = components.reduce((sum, c) => {
    const qty = Number(c.quantity) || 0;
    const unit = Number(c.unit_cost) || 0;
    return sum + qty * unit;
  }, 0);

  const totalQuantity = components.reduce(
    (sum, c) => sum + (Number(c.quantity) || 0),
    0
  );

  const finalCost = updatedTotal + packagingCost + laborCost;

  const handleEdit = (
    index: number,
    field: "name" | "unit_cost" | "line_cost" | "percent",
    value: string
  ) => {
    const updated = [...components];

    if (field === "percent") {
      const percent = parseFloat(value) || 0;
      const newQuantity = (percent / 100) * totalQuantity;
      updated[index] = { ...updated[index], quantity: newQuantity };
      updated[index].line_cost =
        newQuantity * (Number(updated[index].unit_cost) || 0);
    } else {
      const numericValue =
        field === "unit_cost" || field === "line_cost"
          ? parseFloat(value) || 0
          : value;

      updated[index] = { ...updated[index], [field]: numericValue };

      if (field === "unit_cost") {
        const qty = Number(updated[index].quantity) || 0;
        const unit = Number(updated[index].unit_cost) || 0;
        updated[index].line_cost = qty * unit;
      }
    }

    setComponents(updated);
  };

  return (
    <div>
      {/* Toolbar above table */}
      <div className="flex justify-between mb-4">
        <button
          onClick={handleAddIngredient}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[#0e5439] text-white hover:bg-[#0c4630] transition text-sm font-medium shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Ingredient
        </button>
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
                <th className="px-4 py-3 text-right">% of Formula</th>
                <th className="px-4 py-3 text-right">Unit Cost</th>
                <th className="px-4 py-3 text-right">Line Cost</th>
              </tr>
            </thead>
            <tbody>
              {components.map((c, i) => {
                const percent =
                  totalQuantity > 0
                    ? ((Number(c.quantity) || 0) / totalQuantity) * 100
                    : 0;

                return (
                  <tr key={i} className="border-t hover:bg-gray-50 transition">
                    {/* Ingredient Name (editable) with remove button */}
                    <td className="px-4 py-2 flex items-center gap-2">
                      <button
                        onClick={() => handleRemoveIngredient(i)}
                        className="text-red-500 hover:text-red-700"
                        title="Remove ingredient"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="text"
                        value={c.name}
                        onChange={(e) => handleEdit(i, "name", e.target.value)}
                        className="flex-1 border rounded px-2 py-1 text-sm"
                      />
                    </td>

                    {/* % of Formula (editable) */}
                    <td className="px-4 py-2 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={percent.toFixed(2)}
                        onChange={(e) =>
                          handleEdit(i, "percent", e.target.value)
                        }
                        className="w-20 text-right border rounded px-2 py-1 text-sm font-mono"
                      />
                      <span className="ml-1 text-gray-500 text-xs">%</span>
                    </td>

                    {/* Unit Cost */}
                    <td className="px-4 py-2 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={c.unit_cost}
                        onChange={(e) =>
                          handleEdit(i, "unit_cost", e.target.value)
                        }
                        className="w-24 text-right border rounded px-2 py-1 text-sm font-mono"
                      />
                    </td>

                    {/* Line Cost */}
                    <td className="px-4 py-2 text-right font-mono">
                      ${c.line_cost.toFixed(2)}
                    </td>
                  </tr>
                );
              })}

              {/* Totals */}
              <tr className="bg-gray-50 font-semibold border-t">
                <td colSpan={3} className="px-4 py-3 text-right">
                  Base Cost / kg
                </td>
                <td className="px-4 py-3 text-right text-[#0e5439] font-mono">
                  ${updatedTotal.toFixed(2)}
                </td>
              </tr>
              <tr className="italic border-t">
                <td colSpan={3} className="px-4 py-3 text-right">
                  Packaging $
                </td>
                <td className="px-4 py-3 text-right">
                  <input
                    type="number"
                    step="0.01"
                    value={packagingCost}
                    onChange={(e) =>
                      setPackagingCost(parseFloat(e.target.value) || 0)
                    }
                    className="w-24 text-right border rounded px-3 py-1 text-sm font-mono"
                  />
                </td>
              </tr>
              <tr className="italic border-t">
                <td colSpan={3} className="px-4 py-3 text-right">
                  Labor $
                </td>
                <td className="px-4 py-3 text-right">
                  <input
                    type="number"
                    step="0.01"
                    value={laborCost}
                    onChange={(e) =>
                      setLaborCost(parseFloat(e.target.value) || 0)
                    }
                    className="w-24 text-right border rounded px-3 py-1 text-sm font-mono"
                  />
                </td>
              </tr>
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
