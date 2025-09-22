"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import type { Component } from "../types"; // ✅ use your existing type

interface IngredientSearchProps {
  onSelect: (ingredient: Component) => void;
  onClose: () => void;
}

export default function IngredientSearch({
  onSelect,
  onClose,
}: IngredientSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [allIngredients, setAllIngredients] = useState<Component[]>([]);
  const [filteredIngredients, setFilteredIngredients] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const res = await fetch("https://bom-api.fly.dev/ingredients");
        if (res.ok) {
          const data = await res.json();

          // 🔹 Normalize API response so it matches Component type
          const normalized: Component[] = data.map((ing: any) => ({
            name: ing.name,
            quantity: 0,
            uom: ing.uom || "kg",
            has_cost: true,
            unit_cost: ing.unit_cost ?? ing.cost ?? 0,
            line_cost: 0,
            sku: ing.sku,
            barcode: ing.barcode,
            vendor: ing.vendor,
            description: ing.description,
            category: ing.category,
            storage_type: ing.storage_type,
            inci: ing.inci,
            remarks: ing.remarks,
          }));

          setAllIngredients(normalized);
          setFilteredIngredients(normalized.slice(0, 20));
        }
      } catch (error) {
        console.error("Failed to fetch ingredients:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchIngredients();
  }, []);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = allIngredients.filter((ing) =>
        ing.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredIngredients(filtered.slice(0, 50));
    } else {
      setFilteredIngredients(allIngredients.slice(0, 20));
    }
  }, [searchTerm, allIngredients]);

  const handleSelect = (ingredient: Component) => {
    onSelect(ingredient);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Add Ingredient</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ingredients..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0e5439]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Loading ingredients...
            </div>
          ) : filteredIngredients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No ingredients found
            </div>
          ) : (
            <div className="space-y-2">
              {filteredIngredients.map((ingredient, index) => (
                <button
                  key={index}
                  onClick={() => handleSelect(ingredient)}
                  className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 hover:border-[#0e5439] transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {ingredient.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {ingredient.vendor && `${ingredient.vendor} • `}
                        {ingredient.category}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-[#0e5439]">
                        ${ingredient.unit_cost.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {ingredient.uom || "unit"}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
