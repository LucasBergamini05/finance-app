"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Transações" },
  { href: "/categories", label: "Categorias" },
  { href: "/cards", label: "Cartões" },
  { href: "/settings", label: "Dados" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <header className="border-b bg-background">
      <div className="mx-auto max-w-3xl px-4 flex items-center gap-1 h-12">
        <span className="font-semibold text-sm mr-4">Finanças</span>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`px-3 py-1.5 rounded-md text-xs md:text-sm transition-colors ${
              pathname === l.href
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
