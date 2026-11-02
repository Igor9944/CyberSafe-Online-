import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, MessageSquareWarning, QrCode, AudioLines, PhoneCall, Bot,
  Info, Menu, X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { useI18n, LanguageSelector, SecurityVerificationNotice } from "@/lib/i18n";

export interface NavItemConfig {
  to: string;
  key: string;
  icon: any;
}

export const NAV_ITEMS: NavItemConfig[] = [
  { to: "/", key: "dashboard", icon: LayoutDashboard },
  { to: "/sms", key: "sms", icon: MessageSquareWarning },
  { to: "/qr", key: "qr", icon: QrCode },
  { to: "/audio", key: "audio", icon: AudioLines },
  { to: "/guide", key: "guide", icon: PhoneCall },
  { to: "/assistant", key: "assistant", icon: Bot },
  { to: "/a-propos", key: "about", icon: Info },
];

const MOBILE_KEYS = ["dashboard", "sms", "qr", "audio", "assistant"];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useI18n();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ to, key, icon: Icon }) => {
        const active = to === "/" ? path === "/" : path.startsWith(to);
        const label = t(`nav.${key}`);
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-[18px] shrink-0" />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useI18n();

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-sidebar p-4 text-night-foreground lg:flex">
        <div className="flex items-center justify-between px-2 py-3">
          <Logo />
        </div>
        <div className="mt-2 px-2 pb-2">
          <LanguageSelector />
        </div>
        <div className="mt-4 flex-1 overflow-y-auto">
          <NavList />
        </div>
        <div className="mt-3 space-y-2">
          <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/60 p-3 text-xs text-night-muted">
            « {t("common.tagline")} »
          </div>
        </div>
      </aside>

      {/* Mobile Header with Language Selector and Menu */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-2.5 text-night-foreground lg:hidden">
        <Logo />
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <button
            aria-label={t("nav.openMenu")}
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-night-foreground hover:bg-sidebar-accent"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-night/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col animate-in slide-in-from-left bg-sidebar p-4 text-night-foreground">
            <div className="mb-4 flex items-center justify-between px-2 py-2">
              <Logo />
              <button
                aria-label={t("nav.closeMenu")}
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 hover:bg-sidebar-accent"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="mb-4 px-2">
              <LanguageSelector />
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavList onNavigate={() => setOpen(false)} />
            </div>
            <div className="mt-4 rounded-xl border border-sidebar-border bg-sidebar-accent/60 p-3 text-xs text-night-muted">
              « {t("common.tagline")} »
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="pb-24 lg:pb-10 lg:pl-64">
        {/* Top desktop header bar showing language badge & security review info */}
        <div className="hidden border-b bg-card/60 px-6 py-2.5 backdrop-blur lg:flex lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t("common.slogan")}</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector />
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <div className="mb-6">
            <SecurityVerificationNotice />
          </div>
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-card/95 backdrop-blur lg:hidden">
        {NAV_ITEMS.filter((item) => MOBILE_KEYS.includes(item.key)).map(({ to, key, icon: Icon }) => {
          const active = to === "/" ? path === "/" : path.startsWith(to);
          const rawLabel = t(`nav.${key}`);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors",
                active ? "text-primary font-semibold" : "text-muted-foreground",
              )}
            >
              <Icon className="size-4" />
              <span className="truncate max-w-[64px] text-center">
                {rawLabel.replace("Scanner ", "").replace("Tableau de bord", "Accueil")}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
