"use client";

import React from "react";

export default function LoadingSpinner(): React.ReactElement {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="w-12 h-12 border-4 border-[#0e5439] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
