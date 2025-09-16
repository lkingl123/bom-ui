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
  return (
    <div className="rounded-2xl border border-gray-200 shadow-md bg-white overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-[#0e5439]">
        <h2 className="text-lg font-semibold text-white">
          Ingredient Breakdown
        </h2>
        <p className="text-green-100 text-sm">
          Detailed cost contribution for each ingredient
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-3 text-left">Ingredient</th>
              <th className="px-6 py-3 text-right">Quantity</th>
              <th className="px-6 py-3 text-right">Unit Cost</th>
              <th className="px-6 py-3 text-right">Line Cost</th>
            </tr>
          </thead>
          <tbody>
            {components.map((c, idx) => (
              <tr
                key={c.name}
                className={`transition ${
                  idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-[#eaf4ef]`}
              >
                <td className="px-6 py-3 font-medium text-gray-800">
                  {c.name}
                </td>
                <td className="px-6 py-3 text-right text-gray-700">
                  {c.quantity} {c.uom}
                </td>
                <td className="px-6 py-3 text-right text-gray-700">
                  ${c.unit_cost.toFixed(2)}
                </td>
                <td className="px-6 py-3 text-right font-medium text-gray-900">
                  ${c.line_cost.toFixed(2)}
                </td>
              </tr>
            ))}

            {/* Total */}
            <tr className="bg-gray-100 font-semibold border-t">
              <td colSpan={3} className="px-6 py-4 text-right text-gray-800">
                Total Cost / kg
              </td>
              <td className="px-6 py-4 text-right text-[#0e5439] text-lg">
                ${totalCost.toFixed(2)}
              </td>
            </tr>

            {/* Placeholder */}
            <tr className="bg-white italic border-t">
              <td colSpan={3} className="px-6 py-4 text-right text-gray-500">
                Packaging + Labor
              </td>
              <td className="px-6 py-4 text-right text-gray-400">
                – (placeholder)
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
