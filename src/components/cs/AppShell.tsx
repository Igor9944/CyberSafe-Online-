import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  MessageSquareWarning,
  QrCode,
  AudioLines,
  PhoneCall,
  Bot,
  Info,
  Menu,
  X,
  History,
  Settings,
  Sun,
  Moon,
  Sparkles,
  GraduationCap,
  Compass,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { PwaInstallButton } from "./PwaInstallButton";
import { OnboardingTour } from "./OnboardingTour";
import { WavyCyberGrid, CyberSticker } from "./CyberDecorations";
import { cn } from "@/lib/utils";
import { useI18n, LanguageSelector, SecurityVerificationNotice } from "@/lib/i18n";

export interface NavItemConfig {
  to: string;
  key: string;
  icon: LucideIcon;
  badge?: string;
  badgeTone?: "lime" | "cyan" | "purple" | "yellow";
}

export const NAV_ITEMS: NavItemConfig[] = [
  { to: "/", key: "dashboard", icon: LayoutDashboard },
  { to: "/sms", key: "sms", icon: MessageSquareWarning, badge: "MVP", badgeTone: "lime" },
  { to: "/qr", key: "qr", icon: QrCode },
  { to: "/audio", key: "audio", icon: AudioLines },
  { to: "/assistant", key: "assistant", icon: Bot, badge: "Gemma 4", badgeTone: "cyan" },
  { to: "/apprendre", key: "student", icon: GraduationCap, badge: "Étudiant", badgeTone: "purple" },
  { to: "/historique", key: "history", icon: History },
  { to: "/guide", key: "guide", icon: PhoneCall },
  { to: "/a-propos", key: "about", icon: Info },
  { to: "/parametres", key: "settings", icon: Settings },
];

const MOBILE_KEYS = ["dashboard", "sms", "assistant", "student", "qr"];

function NavList({ onNavigate, ariaLabel }: { onNavigate?: () => void; ariaLabel?: string }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useI18n();

  return (
    <nav aria-label={ariaLabel ?? t("nav.mainNavigation")} className="flex flex-col gap-1.5">
      {NAV_ITEMS.map(({ to, key, icon: Icon, badge, badgeTone = "lime" }) => {
        const active = to === "/" ? path === "/" : path.startsWith(to);
        const label = t(`nav.${key}`);
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={cn(
              "group relative flex min-h-11 items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
              active
                ? "bg-electric text-primary-foreground shadow-glow border border-white/20"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border border-transparent",
            )}
          >
            <span className="flex items-center gap-3 min-w-0">
              <Icon
                className={cn(
                  "size-[18px] shrink-0 transition-transform group-hover:scale-110",
                  active && "text-white",
                )}
              />
              <span className="truncate">{label}</span>
            </span>
            {badge && (
              <span
                className={cn(
                  "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider border",
                  active
                    ? "bg-white/25 text-white border-white/40"
                    : badgeTone === "lime"
                      ? "bg-[#D9F99D] text-slate-950 border-slate-900 shadow-[1px_1px_0px_0px_#0f172a]"
                      : badgeTone === "cyan"
                        ? "bg-[#A5F3FC] text-slate-950 border-slate-900 shadow-[1px_1px_0px_0px_#0f172a]"
                        : "bg-[#E9D5FF] text-slate-950 border-slate-900 shadow-[1px_1px_0px_0px_#0f172a]",
                )}
              >
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeMenuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useI18n();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cybersafe_theme");
      const isDark = saved === "dark";
      setDark(isDark);
      document.documentElement.classList.toggle("dark", isDark);

      const tourCompleted = localStorage.getItem("cybersafe_tour_completed");
      if (tourCompleted !== "true") {
        setTourOpen(true);
      }
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    const menuButton = menuButtonRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeMenuButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = mobileMenuRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;

      const first = focusable.item(0);
      const last = focusable.item(focusable.length - 1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      menuButton?.focus();
    };
  }, [open]);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("cybersafe_theme", next ? "dark" : "light");
      document.documentElement.classList.toggle("dark", next);
    }
  };

  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden selection:bg-lime-300 selection:text-slate-950">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.08] dark:opacity-[0.14]">
        <WavyCyberGrid />
      </div>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r-2 border-sidebar-border bg-sidebar p-4 text-night-foreground lg:flex">
        <div className="flex items-center justify-between px-2 py-2.5">
          <Link
            to="/"
            className="font-display text-base font-black tracking-tight focus:outline-none"
          >
            CyberSafe <span className="text-electric">Online</span>
          </Link>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto pr-1">
          <div className="mb-2 px-3 text-[10px] font-black uppercase tracking-widest text-night-muted/80">
            Navigation & Outils IA
          </div>
          <NavList />
        </div>

        <div className="mt-3 space-y-2.5">
          <div className="relative overflow-hidden rounded-2xl border-2 border-slate-700 bg-gradient-to-br from-sidebar-accent to-sidebar p-3.5 text-xs shadow-neo-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-black text-white">
                <Sparkles className="size-3.5 text-electric" /> Google Gemma 4
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-400 border border-emerald-400/30">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" /> Actif
              </span>
            </div>
            <div className="mt-1 font-mono text-[10.5px] font-bold text-electric">
              gemma-4-26b-a4b-it
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-night-muted">
              Protection Mobile Money (T-Money / Moov Money) & Volet{" "}
              <code className="text-white font-semibold">/apprendre</code>
            </p>
          </div>

          <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/50 px-3 py-2 text-[11px] text-night-muted text-center font-medium">
            « {t("common.tagline")} »
          </div>

          <PwaInstallButton variant="card" />
        </div>
      </aside>

      <header
        inert={open}
        className="sticky top-0 z-30 flex items-center justify-between border-b-2 border-sidebar-border bg-sidebar/95 px-4 py-2.5 text-night-foreground backdrop-blur-md lg:hidden"
      >
        <Link to="/" className="font-display text-sm font-black tracking-tight">
          CyberSafe <span className="text-electric">Online</span>
        </Link>
        <div className="flex items-center gap-1.5">
          <PwaInstallButton variant="mobile-bar" />
          <button
            type="button"
            onClick={() => setTourOpen(true)}
            aria-label="Aide"
            title="Aide CyberSafe"
            className="grid size-8 place-items-center rounded-lg border border-sidebar-border bg-sidebar-accent/60 text-night-foreground hover:bg-sidebar-accent transition cursor-pointer"
          >
            <Compass className="size-4 text-electric" />
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Basculer le thème"
            className="grid size-8 place-items-center rounded-lg border border-sidebar-border bg-sidebar-accent/60 text-night-foreground hover:bg-sidebar-accent transition cursor-pointer"
          >
            {dark ? (
              <Sun className="size-4 text-amber-400" />
            ) : (
              <Moon className="size-4 text-electric" />
            )}
          </button>
          <button
            ref={menuButtonRef}
            type="button"
            aria-label={t("nav.openMenu")}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-night-foreground hover:bg-sidebar-accent transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={t("nav.closeMenu")}
            className="absolute inset-0 cursor-default bg-night/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div
            ref={mobileMenuRef}
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label={t("nav.mainNavigation")}
            className="absolute inset-y-0 left-0 flex w-72 flex-col overflow-hidden animate-in slide-in-from-left bg-sidebar p-4 text-night-foreground shadow-2xl border-r-2 border-sidebar-border motion-reduce:animate-none"
          >
            <div className="mb-4 flex items-center justify-between px-2 py-2">
              <Link to="/" className="font-display text-base font-black tracking-tight">
                CyberSafe <span className="text-electric">Online</span>
              </Link>
              <button
                ref={closeMenuButtonRef}
                type="button"
                aria-label={t("nav.closeMenu")}
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 hover:bg-sidebar-accent transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="mb-4 px-2">
              <LanguageSelector />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y pr-1">
              <NavList onNavigate={() => setOpen(false)} ariaLabel={t("nav.mainNavigation")} />
            </div>
            <div className="mt-3 shrink-0 border-t border-sidebar-border pt-3">
              <PwaInstallButton variant="card" compact />
              <div className="mt-3 rounded-xl border border-sidebar-border bg-sidebar-accent/60 p-3 text-xs text-night-muted">
                « {t("common.tagline")} »
              </div>
            </div>
          </div>
        </div>
      )}

      <main inert={open} className="relative z-10 pb-24 lg:pb-12 lg:pl-64">
        <div className="sticky top-0 z-20 hidden border-b-2 bg-card/85 px-6 py-2.5 backdrop-blur-xl lg:flex lg:items-center lg:justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <CyberSticker tone="lime" rotate="none">
              <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />
              Protection Active
            </CyberSticker>
            <span className="text-xs font-semibold text-muted-foreground ml-1">
              {t("common.slogan")}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <PwaInstallButton variant="header" />
            <button
              type="button"
              onClick={() => setTourOpen(true)}
              title="Visite guidée"
              aria-label="Visite guidée"
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-border/90 bg-card px-2.5 py-1.5 text-xs font-bold text-foreground transition hover:bg-accent cursor-pointer shadow-neo-sm active:translate-y-0.5 active:shadow-none"
            >
              <Compass className="size-3.5 text-electric" />
              <span>🧭 Visite guidée</span>
            </button>
            <LanguageSelector />
            <button
              type="button"
              onClick={toggleTheme}
              title={dark ? "Passer en mode clair" : "Passer en mode sombre"}
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-border/90 bg-card px-2.5 py-1.5 text-xs font-bold text-foreground transition hover:bg-accent cursor-pointer shadow-neo-sm active:translate-y-0.5 active:shadow-none"
            >
              {dark ? (
                <>
                  <Sun className="size-3.5 text-amber-400" />
                  <span>Clair</span>
                </>
              ) : (
                <>
                  <Moon className="size-3.5 text-primary" />
                  <span>Sombre</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="mb-6">
            <SecurityVerificationNotice />
          </div>
          {children}
        </div>
      </main>

      <nav
        inert={open}
        aria-label={t("nav.mobileNavigation")}
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t-2 border-border/80 bg-card/95 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-lg lg:hidden shadow-lg"
      >
        {NAV_ITEMS.filter((item) => MOBILE_KEYS.includes(item.key)).map(
          ({ to, key, icon: Icon }) => {
            const active = to === "/" ? path === "/" : path.startsWith(to);
            const rawLabel = t(`nav.${key}`);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "relative flex min-h-[48px] flex-col items-center justify-center gap-1 py-1.5 text-[10.5px] font-bold transition-colors duration-150 touch-manipulation active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric focus-visible:ring-inset",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active && (
                  <span className="absolute top-0 h-1 w-10 rounded-full bg-electric shadow-glow" />
                )}
                <Icon
                  className={cn(
                    "size-4 transition-transform",
                    active ? "text-electric scale-110" : "opacity-80",
                  )}
                />
                <span className="truncate max-w-[64px] text-center leading-none">
                  {rawLabel
                    .replace("Scanner ", "")
                    .replace("Tableau de bord", "Accueil")
                    .replace("Assistant CyberSafe", "Bot IA")}
                </span>
              </Link>
            );
          },
        )}
      </nav>

      <OnboardingTour open={tourOpen} onClose={() => setTourOpen(false)} />
    </div>
  );
}
