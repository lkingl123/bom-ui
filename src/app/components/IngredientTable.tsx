"use client";

import React, { useState } from "react";
import { RotateCcw, Plus, Minus, ChevronDown, ChevronUp } from "lucide-react";
import type { ComponentEditable } from "../types";

interface IngredientTableProps {
  components: ComponentEditable[];
  setComponents: (c: ComponentEditable[]) => void;
  laborCost: number;
  setLaborCost: (v: number) => void;
  originalComponents: ComponentEditable[];
  packagingTotal: number;
  inflowCost: number;
}

export default function IngredientTable({
  components,
  setComponents,
  laborCost,
  setLaborCost,
  originalComponents,
  packagingTotal,
  inflowCost,
}: IngredientTableProps): React.ReactElement {
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [loadingRows, setLoadingRows] = useState<Record<number, boolean>>({});

  const toggleExpand = async (index: number, ingredientName: string): Promise<void> => {
    if (expandedRows[index]) {
      setExpandedRows((prev) => ({ ...prev, [index]: false }));
      return;
    }

    setExpandedRows((prev) => ({ ...prev, [index]: true }));

    if (!components[index].inci && !components[index].remarks) {
      try {
        setLoadingRows((prev) => ({ ...prev, [index]: true }));
        const res = await fetch(
          `https://bom-api.fly.dev/ingredients/${encodeURIComponent(ingredientName)}`
        );
        if (res.ok) {
          const data = await res.json();
          const updated = [...components];
          updated[index] = {
            ...updated[index],
            ...data,
          };
          setComponents(updated);
        }
      } catch (err) {
        console.error(`Failed to fetch ingredient details for ${ingredientName}`, err);
      } finally {
        setLoadingRows((prev) => ({ ...prev, [index]: false }));
      }
    }
  };

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
      inci: "",
      remarks: "",
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

  const finalCost = baseCost + laborCost + packagingTotal + inflowCost;

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

  // ✅ Sort by % (descending) but still editable
  const sortedComponents = [...components].sort((a, b) => b.percent - a.percent);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex justify-between mb-4 mt-6">
        <button
          onClick={handleAddIngredient}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[#0e5439] text-white hover:bg-[#0c4630] transition text-sm font-medium shadow-sm cursor-pointer"
        >
          Add Ingredient
        </button>
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition text-sm font-medium shadow-sm cursor-pointer"
        >
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
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {sortedComponents.map((c, i) => (
                <React.Fragment key={i}>
                  <tr className="border-t hover:bg-gray-50 transition">
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
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => toggleExpand(i, c.name)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        {expandedRows[i] ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>

                  {expandedRows[i] && (
                    <tr className="bg-gray-50 border-t">
                      <td colSpan={5} className="px-4 py-3">
                        {loadingRows[i] ? (
                          <div className="text-sm text-gray-500 italic">
                            Loading details…
                          </div>
                        ) : (
                          <div className="text-sm text-gray-700 space-y-2">
                            <div>
                              <span className="font-semibold">INCI: </span>
                              {c.inci || (
                                <span className="italic text-gray-400">N/A</span>
                              )}
                            </div>
                            <div>
                              <span className="font-semibold">Remarks: </span>
                              {c.remarks || (
                                <span className="italic text-gray-400">N/A</span>
                              )}
                            </div>
                            <div>
                              <span className="font-semibold">Vendor: </span>
                              {c.vendor || (
                                <span className="italic text-gray-400">N/A</span>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}

              {/* Totals */}
              <tr className="bg-gray-50 font-semibold border-t">
                <td colSpan={3} className="px-4 py-3 text-right">
                  Total Cost Per KG
                </td>
                <td className="px-4 py-3 text-right text-[#0e5439] font-mono">
                  ${baseCost.toFixed(2)}
                </td>
                <td></td>
              </tr>
              <tr className="italic border-t">
                <td colSpan={3} className="px-4 py-3 text-right">
                  Labor $
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  ${laborCost.toFixed(2)}
                </td>
                <td></td>
              </tr>
              <tr className="italic border-t">
                <td colSpan={3} className="px-4 py-3 text-right">
                  Packaging $
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  ${packagingTotal.toFixed(2)}
                </td>
                <td></td>
              </tr>
              <tr className="italic border-t">
                <td colSpan={3} className="px-4 py-3 text-right">
                  Inflow $
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  ${inflowCost.toFixed(2)}
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
