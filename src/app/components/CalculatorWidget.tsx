// src/app/components/CalculatorWidget.tsx
"use client";

import React, { useState } from "react";

export default function CalculatorWidget() {
  const [display, setDisplay] = useState<string>("");

  const sanitize = (expr: string): string => {
    return expr.replace(/\b0+(\d)/g, "0$1"); // prevent multiple leading zeros
  };

  const handleClick = (value: string) => {
    if (value === "Clear") {
      setDisplay("");
      return;
    }

    if (value === "=") {
      if (!display.trim()) return;
      try {
        // eslint-disable-next-line no-eval
        setDisplay(eval(display).toString());
      } catch {
        setDisplay("");
      }
      return;
    }

    // ✅ append safely
    let newDisplay = display + value;

    // ✅ sanitize leading zeros
    newDisplay = sanitize(newDisplay);

    // ✅ prevent multiple decimals in the same number
    const parts = newDisplay.split(/[\+\-\*\/]/); // split by operators
    const lastPart = parts[parts.length - 1];
    if ((value === "." && lastPart.includes("."))) {
      return; // ignore extra decimal
    }

    setDisplay(newDisplay);
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
