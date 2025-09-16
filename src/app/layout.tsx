import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BOM Cost Dashboard",
  description: "Analyze BOM cost and ingredients with elegance.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-gray-50 antialiased">
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
