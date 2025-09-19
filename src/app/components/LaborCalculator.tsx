"use client";

import React from "react";

interface LaborCalculatorProps {
  costPerTouch: number;
  setCostPerTouch: (value: number) => void;
  touchPoints: number;
  setTouchPoints: (value: number) => void;
}

export default function LaborCalculator({
  costPerTouch,
  setCostPerTouch,
  touchPoints,
  setTouchPoints,
}: LaborCalculatorProps) {
  return (
    <div className="mt-8 bg-white rounded-xl shadow p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Labor Calculator
      </h3>

      {/* Touch Details */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-gray-500">Cost Per Touch ($)</p>
          <input
            type="number"
            step="0.01"
            min={0}
            value={costPerTouch}
            onChange={(e) => setCostPerTouch(Number(e.target.value) || 0)}
            className="w-32 border rounded px-2 py-1 text-sm font-mono"
          />
        </div>
        <div>
          <p className="text-gray-500">Touch Points</p>
          <input
            type="number"
            min={0}
            value={touchPoints}
            onChange={(e) => setTouchPoints(Number(e.target.value) || 0)}
            className="w-32 border rounded px-2 py-1 text-sm font-mono"
          />
        </div>
      </div>
    </div>
  );
}
