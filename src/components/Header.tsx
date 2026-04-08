"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[var(--color-sand)]/95 backdrop-blur-sm border-b border-[var(--color-stone)]/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <svg
            width="28"
            height="28"
            viewBox="0 0 40 40"
            fill="none"
            className="text-[var(--color-bark)] group-hover:text-[var(--color-ember)] transition-colors"
          >
            <path
              d="M20 4L36 36H4L20 4Z"
              fill="currentColor"
            />
          </svg>
          <span className="font-display text-xl text-[var(--color-bark)]">
            Teltplass
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <NavLink href="/kart" active={pathname === "/kart"}>
            Kart
          </NavLink>
          <NavLink href="/sok" active={pathname === "/sok"}>
            Søk
          </NavLink>
          <NavLink href="/ny" active={pathname === "/ny"}>
            Legg til
          </NavLink>
        </nav>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 text-[var(--color-bark)]"
          aria-label="Meny"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? (
              <path d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path d="M3 6h18M3 12h18M3 18h18" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-[var(--color-stone)]/15 bg-[var(--color-sand)]">
          <nav className="flex flex-col px-4 py-3 gap-1">
            <MobileLink href="/kart" onClick={() => setMenuOpen(false)}>Kart</MobileLink>
            <MobileLink href="/sok" onClick={() => setMenuOpen(false)}>Søk</MobileLink>
            <MobileLink href="/ny" onClick={() => setMenuOpen(false)}>Legg til teltplass</MobileLink>
          </nav>
        </div>
      )}
    </header>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`font-body text-sm font-medium transition-colors ${
        active
          ? "text-[var(--color-ember)]"
          : "text-[var(--color-bark)] hover:text-[var(--color-ember)]"
      }`}
    >
      {children}
    </Link>
  );
}

function MobileLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="font-body text-base py-2 px-3 rounded-lg text-[var(--color-bark)] hover:bg-[var(--color-stone)]/10 transition-colors"
    >
      {children}
    </Link>
  );
}
