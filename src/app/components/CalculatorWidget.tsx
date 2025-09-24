// src/app/components/CalculatorWidget.tsx
"use client";

import React, { useState } from "react";

export default function CalculatorWidget() {
  const [display, setDisplay] = useState<string>("");

  const handleClick = (value: string) => {
    if (value === "Clear") {
      setDisplay("");
    } else if (value === "=") {
      try {
        // ⚠️ Using eval only for simplicity — consider math.js for safety
        // eslint-disable-next-line no-eval
        setDisplay(eval(display).toString());
      } catch {
        setDisplay("Error");
      }
    } else {
      setDisplay(display + value);
    }
  };

  const buttons = [
    "7", "8", "9", "/",
    "4", "5", "6", "*",
    "1", "2", "3", "-",
    "0", ".", "Clear", "+",
    "=",
  ];

  return (
    <div className="bg-white border rounded-lg shadow p-4 w-full max-w-xs">
      <h3 className="text-lg font-semibold mb-2">Calculator</h3>
      <input
        type="text"
        value={display}
        readOnly
        className="w-full border rounded px-2 py-1 mb-3 text-right font-mono"
      />
      <div className="grid grid-cols-4 gap-2">
        {buttons.map((btn) => (
          <button
            key={btn}
            onClick={() => handleClick(btn)}
            className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 font-mono"
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
}
