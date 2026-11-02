import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import fr from "@/locales/fr.json";
import en from "@/locales/en.json";
import ee from "@/locales/ee.json";
import { Globe, Check, ShieldCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export type Language = "fr" | "en" | "ee";

export interface LanguageOption {
  code: Language;
  label: string;
  flag: string;
  native: string;
  direction?: "ltr" | "rtl";
}

export const LANGUAGES: Record<Language, LanguageOption> = {
  fr: { code: "fr", label: "Français", flag: "🇫🇷", native: "Français" },
  en: { code: "en", label: "English", flag: "🇬🇧", native: "English" },
  ee: { code: "ee", label: "Eʋegbe", flag: "🇹🇬", native: "Eʋegbe" },
};

const translations: Record<Language, any> = { fr, en, ee };

interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (path: string, fallback?: string) => string;
  isEwe: boolean;
}

const I18nContext = createContext<I18nContextValue>({
  lang: "fr",
  setLang: () => {},
  t: (p) => p,
  isEwe: false,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("fr");

  useEffect(() => {
    const saved = localStorage.getItem("cybersafe_lang");
    if (saved === "fr" || saved === "en" || saved === "ee") {
      setLangState(saved);
    }
  }, []);

  const setLang = (next: Language) => {
    setLangState(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("cybersafe_lang", next);
      document.documentElement.lang = next;
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const t = (path: string, fallback?: string): string => {
    const keys = path.split(".");
    let current = translations[lang];
    for (const k of keys) {
      if (current && typeof current === "object" && k in current) {
        current = current[k];
      } else {
        let fallbackVal = translations["fr"];
        for (const fk of keys) {
          if (fallbackVal && typeof fallbackVal === "object" && fk in fallbackVal) {
            fallbackVal = fallbackVal[fk];
          } else {
            fallbackVal = null;
            break;
          }
        }
        return (typeof fallbackVal === "string" ? fallbackVal : fallback ?? path);
      }
    }
    return typeof current === "string" ? current : fallback ?? path;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t, isEwe: lang === "ee" }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function LanguageSelector({ variant = "outline" }: { variant?: "outline" | "ghost" | "default" }) {
  const { lang, setLang } = useI18n();

  return (
    <div
      role="group"
      aria-label="Sélecteur de langue / Language selector"
      className="inline-flex items-center gap-0.5 rounded-xl border border-border/70 bg-muted/60 p-1 backdrop-blur-sm"
    >
      {(Object.keys(LANGUAGES) as Language[]).map((k) => {
        const item = LANGUAGES[k];
        const active = k === lang;
        return (
          <button
            key={k}
            type="button"
            onClick={() => setLang(k)}
            title={item.native}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            }`}
          >
            <span className="text-sm leading-none" role="img" aria-hidden="true">
              {item.flag}
            </span>
            <span className="uppercase tracking-wider text-[11px]">
              {k === "ee" ? "Éwé" : k.toUpperCase()}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function SecurityVerificationNotice() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/8 via-card to-electric/8 px-4 py-3 text-xs shadow-xs">
      <div className="flex items-start sm:items-center gap-2.5">
        <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
          <ShieldCheck className="size-4" />
        </div>
        <div>
          <span className="font-bold text-foreground">
            {t("common.humanVerificationBadge")}
          </span>
          <span className="hidden md:inline text-muted-foreground"> — </span>
          <span className="block md:inline text-muted-foreground">
            {t("common.humanVerificationWarning")}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
        <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
          T-Money : *145#
        </span>
        <span className="rounded-lg border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
          Moov : *155#
        </span>
      </div>
    </div>
  );
}
