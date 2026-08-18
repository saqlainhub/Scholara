"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";

type PortalShellProps = {
  sidebar: ReactNode;
  children: ReactNode;
  portalName: string;
};

export default function PortalShell({
  sidebar,
  children,
  portalName,
}: PortalShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  return (
    <div className="min-h-screen bg-(--navy-950)">
      {/* =====================================================
          MOBILE TOP BAR
      ====================================================== */}

      <header
        className="
          sticky
          top-0
          z-40
          flex
          h-16
          items-center
          justify-between
          border-b
          border-(--border)
          bg-(--navy-900)
          px-4
          md:hidden
        "
      >
        {/* =================================================
            SCHOLARA LOGO
        ================================================== */}

        <div className="flex min-w-0 items-center">
          <Image
            src="/logo.png"
            alt="Scholara"
            width={160}
            height={52}
            priority
            className="
              h-auto
              w-45
              max-w-[160px]
              object-contain
              object-left
              -m-2
            "
          />
        </div>

        {/* =================================================
            MOBILE MENU BUTTON
        ================================================== */}

        <button
          type="button"
          aria-label={
            mobileMenuOpen
              ? "Close navigation"
              : "Open navigation"
          }
          aria-expanded={mobileMenuOpen}
          onClick={() =>
            setMobileMenuOpen((open) => !open)
          }
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            border
            border-(--border)
            bg-(--navy-800)
            text-(--text-primary)
            transition-all
            duration-200
            hover:border-(--gold-500)
            hover:text-(--gold-500)
            active:scale-95
          "
        >
          {mobileMenuOpen ? (
            <X
              size={21}
              strokeWidth={1.8}
            />
          ) : (
            <Menu
              size={21}
              strokeWidth={1.8}
            />
          )}
        </button>
      </header>

      {/* =====================================================
          MOBILE BACKDROP
      ====================================================== */}

      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() =>
            setMobileMenuOpen(false)
          }
          className="
            fixed
            inset-0
            z-40
            bg-black/60
            md:hidden
          "
        />
      )}

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <div
        className={`
          fixed
          inset-y-0
          left-0
          z-50
          w-72
          transform
          transition-transform
          duration-300
          ease-in-out
          md:translate-x-0
          ${
            mobileMenuOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
        onClick={(event) => {
          const target =
            event.target as HTMLElement;

          const link =
            target.closest("a");

          if (link) {
            setMobileMenuOpen(false);
          }
        }}
      >
        {sidebar}
      </div>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <main
        className="
          min-h-[calc(100vh-4rem)]
          md:ml-72
          md:min-h-screen
        "
      >
        {children}
      </main>
    </div>
  );
}