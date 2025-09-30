// src/app/components/IngredientTable.tsx
"use client";

import React, { useState } from "react";
import { Minus, ChevronDown, ChevronUp, RotateCcw, Plus } from "lucide-react";
import type { ComponentEditable, ProductSummary, ProductDetail } from "../types";
import IngredientSearch from "./IngredientSearch";
import { getProduct } from "../services/inflow";

interface IngredientTableProps {
  components: ComponentEditable[];
  setComponents: (c: ComponentEditable[]) => void;
  laborCost: number;
  setLaborCost: (v: number) => void;
  originalComponents: ComponentEditable[];
  packagingTotal: number;
}

export default function IngredientTable({
  components,
  setComponents,
  laborCost,
  setLaborCost,
  originalComponents,
  packagingTotal,
}: IngredientTableProps): React.ReactElement {
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [loadingRows, setLoadingRows] = useState<Record<number, boolean>>({});
  const [showSearch, setShowSearch] = useState(false);
  const [extraDetails, setExtraDetails] = useState<
    Record<number, { inci?: string; description?: string; remarks?: string }>
  >({});

  // 🔑 Expand row → fetch details
  const toggleExpand = async (index: number, childProductId?: string) => {
    if (expandedRows[index]) {
      setExpandedRows((prev) => ({ ...prev, [index]: false }));
      return;
    }
    setExpandedRows((prev) => ({ ...prev, [index]: true }));

    if (childProductId && !extraDetails[index]) {
      try {
        setLoadingRows((prev) => ({ ...prev, [index]: true }));
        const detail: ProductDetail | null = await getProduct(childProductId);
        if (!detail) {
          setLoadingRows((prev) => ({ ...prev, [index]: false }));
          return;
        }

        setExtraDetails((prev) => ({
          ...prev,
          [index]: {
            inci: detail.customFields?.custom1 ?? "",
            description: detail.description ?? "",
            remarks: detail.remarks ?? "",
          },
        }));
      } catch (err) {
        console.error(`Failed to fetch inFlow details for ${childProductId}`, err);
      } finally {
        setLoadingRows((prev) => ({ ...prev, [index]: false }));
      }
    }
  };

  const handleReset = (): void => {
    setComponents([...originalComponents]);
    setLaborCost(0);
    setExtraDetails({});
  };

  const handleAddIngredient = (): void => setShowSearch(true);

  const handleIngredientSelect = (ingredient: ProductSummary): void => {
    const unitCost = ingredient.cost?.cost ? parseFloat(ingredient.cost.cost) : 0;
    const newIngredient: ComponentEditable = {
      name: ingredient.name,
      sku: ingredient.sku,
      quantity: 0,
      uom: "kg",
      has_cost: true,
      unit_cost: unitCost,
      line_cost: 0,
      childProductId: ingredient.productId,
    };
    setComponents([...components, newIngredient]);
    setShowSearch(false);
  };

  const handleRemoveIngredient = (index: number): void => {
    const updated = [...components];
    updated.splice(index, 1);
    setComponents(updated);

    const { [index]: _, ...rest } = extraDetails;
    setExtraDetails(rest);
  };

  const baseCost = components.reduce(
    (sum, c) => sum + (Number(c.line_cost) || 0),
    0
  );

  const round2 = (num: number): number =>
    Math.round((num + Number.EPSILON) * 100) / 100;

  const handleEdit = (index: number, field: "name", value: string): void => {
    const updated = [...components];
    if (field === "name") {
      updated[index].name = value;
    }
    setComponents(updated);
  };

  const handlePercentEdit = (index: number, value: string): void => {
    const updated = [...components];
    let num = parseFloat(value);
    if (isNaN(num)) num = 0;
    updated[index].quantity = num / 100;
    updated[index].line_cost =
      updated[index].quantity * (updated[index].unit_cost || 0);
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
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[#0e5439] text-white hover:bg-[#0c4630] transition text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Component
        </button>
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm font-medium shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900 p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 uppercase text-xs font-semibold">
              <tr>
                <th className="px-4 py-3 text-left">Component</th>
                <th className="px-4 py-3 text-right">% of Formula</th>
                <th className="px-4 py-3 text-right">Cost / kg</th>
                <th className="px-4 py-3 text-right">Cost</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {components.map((c, i) => (
                <React.Fragment key={i}>
                  <tr className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                    <td className="px-4 py-2 flex items-center gap-2">
                      <button
                        onClick={() => handleRemoveIngredient(i)}
                        className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                        title="Remove ingredient"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="text"
                        value={c.name}
                        onChange={(e) => handleEdit(i, "name", e.target.value)}
                        className="flex-1 border rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={(c.quantity * 100).toFixed(2)}
                        onChange={(e) => handlePercentEdit(i, e.target.value)}
                        className="w-20 text-right border rounded px-2 py-1 text-sm font-mono bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                      />
                      <span className="ml-1 text-gray-500 dark:text-gray-400 text-xs">%</span>
                    </td>
                    {/* Read-only Cost/kg */}
                    <td className="px-4 py-2 text-right font-mono">
                      {c.unit_cost !== undefined ? `$${c.unit_cost.toFixed(2)}` : "$0.00"}
                    </td>
                    {/* Read-only Cost */}
                    <td className="px-4 py-2 text-right font-mono">
                      {c.line_cost !== undefined ? `$${c.line_cost.toFixed(2)}` : "$0.00"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => toggleExpand(i, c.childProductId)}
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
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
                    <tr className="bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700">
                      <td colSpan={5} className="px-4 py-3">
                        {loadingRows[i] ? (
                          <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                            Loading details…
                          </div>
                        ) : (
                          <div className="text-sm text-gray-700 dark:text-gray-200 space-y-2">
                            <div>
                              <span className="font-semibold">INCI: </span>
                              {extraDetails[i]?.inci || (
                                <span className="italic text-gray-400">N/A</span>
                              )}
                            </div>
                            <div>
                              <span className="font-semibold">Description: </span>
                              {extraDetails[i]?.description || (
                                <span className="italic text-gray-400">N/A</span>
                              )}
                            </div>
                            <div>
                              <span className="font-semibold">Remarks: </span>
                              {extraDetails[i]?.remarks || (
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
              <tr className="bg-gray-50 dark:bg-gray-800 font-semibold border-t dark:border-gray-700">
                <td colSpan={3} className="px-4 py-3 text-right">Total Cost Per KG</td>
                <td className="px-4 py-3 text-right text-[#0e5439] font-mono">
                  ${baseCost.toFixed(2)}
                </td>
                <td></td>
              </tr>
              <tr className="italic border-t dark:border-gray-700">
                <td colSpan={3} className="px-4 py-3 text-right">Labor $</td>
                <td className="px-4 py-3 text-right font-mono">${laborCost.toFixed(2)}</td>
                <td></td>
              </tr>
              <tr className="italic border-t dark:border-gray-700">
                <td colSpan={3} className="px-4 py-3 text-right">Packaging $</td>
                <td className="px-4 py-3 text-right font-mono">${packagingTotal.toFixed(2)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
