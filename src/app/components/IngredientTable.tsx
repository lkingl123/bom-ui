"use client";

import React from "react";
import { RotateCcw, Plus, Minus } from "lucide-react";
import type { ComponentEditable } from "../types";

interface IngredientTableProps {
  components: ComponentEditable[];
  setComponents: (c: ComponentEditable[]) => void;
  laborCost: number;
  setLaborCost: (v: number) => void;
  originalComponents: ComponentEditable[];
  packagingTotal: number;
  inflowCost: number;   // ✅ new
  miscCost: number;     // ✅ new
}

export default function IngredientTable({
  components,
  setComponents,
  laborCost,
  setLaborCost,
  originalComponents,
  packagingTotal,
  inflowCost,
  miscCost,
}: IngredientTableProps): React.ReactElement {
  const handleReset = (): void => {
    setComponents([...originalComponents]); 
    setLaborCost(0);
  };

  const handleAddIngredient = (): void => {
    const newIngredient: ComponentEditable = {
      name: "New Ingredient",
      percent: 0,
      uom: "kg",
      unit_cost: 0,
      line_cost: 0,
      quantity: 0,
      has_cost: true,
    };
    setComponents([...components, newIngredient]);
  };

  const handleRemoveIngredient = (index: number): void => {
    const updated = [...components];
    updated.splice(index, 1);
    setComponents(updated);
  };

  const baseCost = components.reduce(
    (sum, c) => sum + (Number(c.line_cost) || 0),
    0
  );

  // ✅ final cost matches Excel
  const finalCost =
    baseCost + laborCost + packagingTotal + inflowCost + miscCost;

  const handleEdit = (
    index: number,
    field: "name" | "unit_cost" | "line_cost" | "percent",
    value: string
  ): void => {
    const updated = [...components];

    if (field === "percent") {
      const percent = parseFloat(value) || 0;
      updated[index] = {
        ...updated[index],
        percent: parseFloat(percent.toFixed(2)),
      };
      updated[index].line_cost =
        (updated[index].percent / 100) * updated[index].unit_cost;
    } else if (field === "unit_cost") {
      const unitCost = parseFloat(value) || 0;
      updated[index] = { ...updated[index], unit_cost: unitCost };
      const percent = updated[index].percent || 0;
      updated[index].line_cost = (percent / 100) * unitCost;
    } else if (field === "line_cost") {
      updated[index] = {
        ...updated[index],
        line_cost: parseFloat(value) || 0,
      };
    } else if (field === "name") {
      updated[index] = { ...updated[index], name: value };
    }

    setComponents(updated);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex justify-between mb-4 mt-6">
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

      {/* Table */}
      <div className="rounded-xl border border-gray-200 shadow-sm bg-white p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs font-semibold">
              <tr>
                <th className="px-4 py-3 text-left">Ingredient</th>
                <th className="px-4 py-3 text-right">% of Formula</th>
                <th className="px-4 py-3 text-right">Cost / kg</th>
                <th className="px-4 py-3 text-right">Cost</th>
              </tr>
            </thead>
            <tbody>
              {components.map((c, i) => (
                <tr key={i} className="border-t hover:bg-gray-50 transition">
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
                  <td className="px-4 py-2 text-right">
                    <input
                      type="number"
                      step="0.01"
                      value={c.percent.toFixed(2)}
                      onChange={(e) => handleEdit(i, "percent", e.target.value)}
                      className="w-20 text-right border rounded px-2 py-1 text-sm font-mono"
                    />
                    <span className="ml-1 text-gray-500 text-xs">%</span>
                  </td>
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
                  <td className="px-4 py-2 text-right font-mono">
                    ${c.line_cost.toFixed(2)}
                  </td>
                </tr>
              ))}

              {/* Totals */}
              <tr className="bg-gray-50 font-semibold border-t">
                <td colSpan={3} className="px-4 py-3 text-right">
                  Ingredient Cost Per Unit
                </td>
                <td className="px-4 py-3 text-right text-[#0e5439] font-mono">
                  ${baseCost.toFixed(2)}
                </td>
              </tr>
              <tr className="italic border-t">
                <td colSpan={3} className="px-4 py-3 text-right">
                  Labor $
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  ${laborCost.toFixed(2)}
                </td>
              </tr>
              <tr className="italic border-t">
                <td colSpan={3} className="px-4 py-3 text-right">
                  Packaging $
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  ${packagingTotal.toFixed(2)}
                </td>
              </tr>
              <tr className="italic border-t">
                <td colSpan={3} className="px-4 py-3 text-right">
                  Inflow $
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  ${inflowCost.toFixed(2)}
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
