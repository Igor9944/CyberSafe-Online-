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
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window === "undefined") return "fr";
    const saved = localStorage.getItem("cybersafe_lang") as Language;
    return saved && (saved === "fr" || saved === "en" || saved === "ee") ? saved : "fr";
  });

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
        // Fallback to French if not found in current language
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
  const current = LANGUAGES[lang];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size="sm"
          className="gap-2 rounded-xl border-sidebar-border bg-sidebar-accent/50 text-xs font-semibold text-night-foreground hover:bg-sidebar-accent hover:text-white"
          aria-label="Sélecteur de langue / Language selector"
        >
          <span className="text-base" role="img" aria-hidden="true">{current.flag}</span>
          <span className="hidden sm:inline">{current.native}</span>
          <Globe className="size-3.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 rounded-xl border border-border bg-popover p-1 shadow-lg">
        {(Object.keys(LANGUAGES) as Language[]).map((k) => {
          const item = LANGUAGES[k];
          const active = k === lang;
          return (
            <DropdownMenuItem
              key={k}
              onClick={() => setLang(k)}
              className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium hover:bg-accent"
            >
              <span className="flex items-center gap-2">
                <span className="text-base" role="img" aria-hidden="true">{item.flag}</span>
                <span>{item.native}</span>
              </span>
              {active && <Check className="size-3.5 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SecurityVerificationNotice() {
  const { t, isEwe } = useI18n();
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
      <div>
        <p className="font-semibold text-foreground">
          {t("common.humanVerificationBadge")}
        </p>
        <p className="mt-0.5">
          {t("common.humanVerificationWarning")}
        </p>
      </div>
    </div>
  );
}
