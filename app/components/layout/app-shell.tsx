import clsx from "clsx";
import { useEffect, useId, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { NavLink } from "react-router";

import { IconClose, IconMenu } from "./icons";

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  end?: boolean;
}

export interface AppShellProps {
  navItems: NavItem[];
  userName: string;
  roleLabel: string;
  logoutForm: ReactNode;
  children: ReactNode;
}

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function navLinkClasses({ isActive }: { isActive: boolean }) {
  return clsx(
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
    isActive
      ? "bg-brand-50 font-medium text-brand-700"
      : "text-ink-muted hover:bg-surface-muted hover:text-ink",
  );
}

function Brand() {
  return (
    <div className="flex flex-col justify-center">
      <span className="text-brand-700 text-lg leading-tight font-semibold">Mibers</span>
      <span className="text-ink-muted text-xs">Creativos</span>
    </div>
  );
}

interface NavLinksProps {
  navItems: NavItem[];
  ariaLabel: string;
  onNavigate?: () => void;
}

function NavLinks({ navItems, ariaLabel, onNavigate }: NavLinksProps) {
  return (
    <nav aria-label={ariaLabel} className="flex-1 overflow-y-auto px-3 py-4">
      <ul className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <NavLink to={item.to} end={item.end} className={navLinkClasses} onClick={onNavigate}>
                <Icon className="size-5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

interface UserBlockProps {
  userName: string;
  roleLabel: string;
  logoutForm: ReactNode;
}

function UserBlock({ userName, roleLabel, logoutForm }: UserBlockProps) {
  return (
    <div className="border-line border-t p-4">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="bg-brand-100 text-brand-700 flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
        >
          {initialsFor(userName)}
        </span>
        <div className="min-w-0">
          <p className="text-ink truncate text-sm font-medium">{userName}</p>
          <p className="text-ink-muted truncate text-xs">{roleLabel}</p>
        </div>
      </div>
      <div className="mt-3">{logoutForm}</div>
    </div>
  );
}

export function AppShell({ navItems, userName, roleLabel, logoutForm, children }: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <div className="bg-canvas min-h-dvh">
      <a
        href="#contenido"
        className="bg-surface text-brand-700 sr-only rounded-lg px-4 py-2 text-sm font-medium shadow-lg focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60]"
      >
        Saltar al contenido
      </a>

      <aside className="bg-surface border-line fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r lg:flex">
        <div className="flex h-16 items-center px-4">
          <Brand />
        </div>
        <NavLinks navItems={navItems} ariaLabel="Navegación principal" />
        <UserBlock userName={userName} roleLabel={roleLabel} logoutForm={logoutForm} />
      </aside>

      <header className="bg-surface border-line fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b px-4 lg:hidden">
        <button
          type="button"
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          onClick={() => setMenuOpen(true)}
          className="text-ink hover:bg-surface-muted -ml-1 inline-flex size-10 items-center justify-center rounded-lg"
        >
          <IconMenu className="size-5" />
        </button>
        <Brand />
      </header>

      {menuOpen && (
        <div className="lg:hidden">
          <div aria-hidden="true" onClick={closeMenu} className="bg-ink/40 fixed inset-0 z-40" />
          <div
            id={menuId}
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
            className="bg-surface fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] flex-col shadow-xl"
          >
            <div className="border-line flex h-14 items-center justify-between border-b px-4">
              <Brand />
              <button
                type="button"
                aria-label="Cerrar menú"
                onClick={closeMenu}
                autoFocus
                className="text-ink hover:bg-surface-muted inline-flex size-10 items-center justify-center rounded-lg"
              >
                <IconClose className="size-5" />
              </button>
            </div>
            <NavLinks navItems={navItems} ariaLabel="Navegación móvil" onNavigate={closeMenu} />
            <UserBlock userName={userName} roleLabel={roleLabel} logoutForm={logoutForm} />
          </div>
        </div>
      )}

      <main id="contenido" className="pt-14 lg:pt-0 lg:pl-64">
        <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
