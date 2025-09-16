"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3">
          <Image
            src="/pureearth-logo.webp" // 👈 must be saved in /public
            alt="Pure Earth Labs Logo"
            width={80}
            height={80}
            priority
          />

        </Link>

        {/* Nav */}
        <nav className="ml-auto flex space-x-6">
          <NavLink href="/products" active={pathname.startsWith("/products")}>
            Catalog
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

function NavLink({
  href,
  children,
  active,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`font-medium px-2 transition ${
        active
          ? "text-[#0e5439] border-b-2 border-[#0e5439]"
          : "text-gray-700 hover:text-[#0e5439]"
      }`}
    >
      {children}
    </Link>
  );
}
