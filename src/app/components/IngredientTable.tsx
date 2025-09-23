// src/app/components/IngredientTable.tsx
"use client";

import React, { useState } from "react";
import { Minus, ChevronDown, ChevronUp, RotateCcw, Plus } from "lucide-react";
import type { Component, ComponentEditable, InciEntry } from "../types";
import IngredientSearch from "./IngredientSearch";

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
  const [showSearch, setShowSearch] = useState(false);

  const toggleExpand = async (
    index: number,
    ingredientName: string
  ): Promise<void> => {
    if (expandedRows[index]) {
      setExpandedRows((prev) => ({ ...prev, [index]: false }));
      return;
    }

    setExpandedRows((prev) => ({ ...prev, [index]: true }));

    if (!components[index].inci && !components[index].remarks) {
      try {
        setLoadingRows((prev) => ({ ...prev, [index]: true }));
        const res = await fetch(
          `https://bom-api.fly.dev/ingredients/${encodeURIComponent(
            ingredientName
          )}`
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
        console.error(
          `Failed to fetch ingredient details for ${ingredientName}`,
          err
        );
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
    setShowSearch(true);
  };

  const handleIngredientSelect = (ingredient: Component): void => {
    const newIngredient: ComponentEditable = {
      ...ingredient,
      quantity: 0,
      has_cost: true,
      unit_cost: ingredient.unit_cost ?? 0,
      line_cost: 0,
    };
    setComponents([...components, newIngredient]);
    setShowSearch(false);
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

  // ✅ Round to 2 decimals consistently
  const round2 = (num: number): number =>
    Math.round((num + Number.EPSILON) * 100) / 100;

  const handleEdit = (
    index: number,
    field: "name" | "unit_cost" | "line_cost",
    value: string
  ): void => {
    const updated = [...components];
    let num = parseFloat(value);
    if (isNaN(num)) num = 0;

    if (field === "unit_cost") {
      updated[index].unit_cost = round2(num);
      updated[index].line_cost =
        (updated[index].quantity || 0) * updated[index].unit_cost;
    } else if (field === "line_cost") {
      updated[index].line_cost = round2(num);
    } else if (field === "name") {
      updated[index].name = value;
    }

    setComponents(updated);
  };

  const handlePercentEdit = (index: number, value: string): void => {
    const updated = [...components];
    let num = parseFloat(value);
    if (isNaN(num)) num = 0;

    // % of Formula → quantity = percent / 100
    updated[index].quantity = num / 100;
    updated[index].line_cost =
      updated[index].quantity * (updated[index].unit_cost || 0);

    setComponents(updated);
  };

  const handleBlur = (
    index: number,
    field: "unit_cost" | "line_cost"
  ): void => {
    const updated = [...components];
    updated[index][field] = round2(updated[index][field] || 0);
    setComponents(updated);
  };

  return (
    <div>
      {showSearch && (
        <IngredientSearch
          onSelect={handleIngredientSelect}
          onClose={() => setShowSearch(false)}
        />
      )}

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
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition text-sm font-medium shadow-sm cursor-pointer"
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
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {components.map((c, i) => (
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
                        value={(c.quantity * 100).toFixed(2)}
                        onChange={(e) => handlePercentEdit(i, e.target.value)}
                        className="w-20 text-right border rounded px-2 py-1 text-sm font-mono"
                      />
                      <span className="ml-1 text-gray-500 text-xs">%</span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={c.unit_cost.toFixed(2)}
                        onChange={(e) =>
                          handleEdit(i, "unit_cost", e.target.value)
                        }
                        onBlur={() => handleBlur(i, "unit_cost")}
                        className="w-24 text-right border rounded px-2 py-1 text-sm font-mono"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={c.line_cost.toFixed(2)}
                        onChange={(e) =>
                          handleEdit(i, "line_cost", e.target.value)
                        }
                        onBlur={() => handleBlur(i, "line_cost")}
                        className="w-24 text-right border rounded px-2 py-1 text-sm font-mono"
                      />
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
                              {(() => {
                                const inciList = c.inci ?? [];
                                return inciList.length > 0 ? (
                                  inciList.map((i: InciEntry, idx: number) => (
                                    <span key={idx}>
                                      {i.percentage
                                        ? `${i.name} (${i.percentage})`
                                        : i.name}
                                      {idx < inciList.length - 1 ? ", " : ""}
                                    </span>
                                  ))
                                ) : (
                                  <span className="italic text-gray-400">
                                    N/A
                                  </span>
                                );
                              })()}
                            </div>

                            <div>
                              <span className="font-semibold">Remarks: </span>
                              {c.remarks || (
                                <span className="italic text-gray-400">
                                  N/A
                                </span>
                              )}
                            </div>
                            <div>
                              <span className="font-semibold">Vendor: </span>
                              {c.vendor || (
                                <span className="italic text-gray-400">
                                  N/A
                                </span>
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
