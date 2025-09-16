"use client";

import { useState } from "react";

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
  // Demo: start with some random values
  const [packagingCost, setPackagingCost] = useState(() =>
    Number((Math.random() * 2 + 0.5).toFixed(2)) // between 0.5–2.5
  );
  const [laborCost, setLaborCost] = useState(() =>
    Number((Math.random() * 3 + 1).toFixed(2)) // between 1–4
  );

  const finalCost = totalCost + packagingCost + laborCost;

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
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
          {components.map((c) => (
            <tr
              key={c.name}
              className="border-t hover:bg-gray-50 transition"
            >
              <td className="px-4 py-2">{c.name}</td>
              <td className="px-4 py-2 text-right">
                {c.quantity} {c.uom}
              </td>
              <td className="px-4 py-2 text-right">${c.unit_cost.toFixed(2)}</td>
              <td className="px-4 py-2 text-right">${c.line_cost.toFixed(2)}</td>
            </tr>
          ))}

          {/* Base Cost */}
          <tr className="bg-gray-50 font-semibold border-t">
            <td colSpan={3} className="px-4 py-3 text-right">
              Base Cost / kg
            </td>
            <td className="px-4 py-3 text-right text-green-600">
              ${totalCost.toFixed(2)}
            </td>
          </tr>

          {/* Packaging Input */}
          <tr className="italic border-t">
            <td colSpan={3} className="px-4 py-3 text-right">
              Packaging
            </td>
            <td className="px-4 py-3 text-right">
              <input
                type="number"
                step="0.01"
                value={packagingCost}
                onChange={(e) => setPackagingCost(Number(e.target.value))}
                className="w-20 text-right border rounded px-2 py-1 text-sm"
              />
            </td>
          </tr>

          {/* Labor Input */}
          <tr className="italic border-t">
            <td colSpan={3} className="px-4 py-3 text-right">
              Labor
            </td>
            <td className="px-4 py-3 text-right">
              <input
                type="number"
                step="0.01"
                value={laborCost}
                onChange={(e) => setLaborCost(Number(e.target.value))}
                className="w-20 text-right border rounded px-2 py-1 text-sm"
              />
            </td>
          </tr>

          {/* Final Cost */}
          <tr className="bg-gray-100 font-bold border-t">
            <td colSpan={3} className="px-4 py-3 text-right">
              Final Cost / kg
            </td>
            <td className="px-4 py-3 text-right text-[#0e5439]">
              ${finalCost.toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
