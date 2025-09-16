import Header from "./components/Header";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="bg-gray-50 min-h-screen flex flex-col">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="bg-[#0e5439] text-white relative">
        <div className="max-w-7xl mx-auto px-6 py-24 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
            Bill of Materials Dashboard
          </h1>
          <p className="text-lg md:text-xl text-green-100 max-w-2xl mx-auto mb-10">
            Manage formulations, analyze costs, and explore ingredients with
            clarity — all in one elegant interface.
          </p>

          <Link
            href="/products"
            className="inline-block px-8 py-4 rounded-lg bg-white text-[#0e5439] font-semibold shadow hover:bg-gray-100 transition"
          >
            View Product Catalog
          </Link>
        </div>

        {/* Decorative Wave */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="w-full h-20 fill-gray-50"
          >
            <path d="M0,0V46.29c47.79,22,103.59,29.1,158,17,70-15,136-57,207-58,72-1,142,39,213,58s144,18,218-6,132-64,204-69c54-4,106,12,160,29V0Z" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 grid gap-12 md:grid-cols-3 text-center">
        <div className="bg-white rounded-xl shadow p-8 hover:shadow-lg transition">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">
            📊 Cost Analysis
          </h3>
          <p className="text-gray-600">
            See real-time cost breakdowns per formulation, with insights into
            line items and total cost/kg.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-8 hover:shadow-lg transition">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">
            🧪 Ingredient Tracking
          </h3>
          <p className="text-gray-600">
            Drill down into ingredient-level data with unit costs, quantities,
            and sourcing details.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-8 hover:shadow-lg transition">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">
            📑 Export & Share
          </h3>
          <p className="text-gray-600">
            Export BOMs into shareable PDFs for clients and internal teams —
            polished and presentation-ready.
          </p>
        </div>
      </section>
    </main>
  );
}
