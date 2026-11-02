import { createFileRoute } from "@tanstack/react-router";
import { Settings, Globe, Cpu, Check, ShieldCheck, Database } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/cs/ui";
import { CyberSticker } from "@/components/cs/CyberDecorations";
import { useI18n, LANGUAGES, type Language } from "@/lib/i18n";

export const Route = createFileRoute("/parametres")({
  head: () => ({
    meta: [
      { title: "Paramètres — CyberSafe Online" },
      { name: "description", content: "Paramètres de langue, sécurité et intégration IA CyberSafe." },
    ],
  }),
  component: SettingsPage,
});

export function SettingsPage() {
  const { t, lang, setLang } = useI18n();

  const handleSelectLang = (l: Language) => {
    setLang(l);
    toast.success(t("settings.savedSuccess"));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Settings}
        title={t("settings.title")}
        subtitle={t("settings.subtitle")}
      >
        <div className="flex flex-wrap items-center gap-2">
          <CyberSticker tone="cyan" icon={Globe} rotate="none">
            3 Langues Disponibles
          </CyberSticker>
          <CyberSticker tone="lime" icon={ShieldCheck} rotate="none">
            {t("home.stats.localHistory")}
          </CyberSticker>
        </div>
      </PageHeader>

      <Panel className="space-y-4 border-2 shadow-neo-sm">
        <div className="flex items-center gap-3">
          <Globe className="size-5 text-primary stroke-[2.2]" />
          <div>
            <h3 className="font-black text-base">{t("settings.languageSection")}</h3>
            <p className="text-xs text-muted-foreground font-medium">{t("settings.languageHelp")}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 pt-2">
          {(Object.keys(LANGUAGES) as Language[]).map((k) => {
            const item = LANGUAGES[k];
            const active = k === lang;
            return (
              <button
                key={k}
                onClick={() => handleSelectLang(k)}
                className={`flex items-center justify-between rounded-xl border-2 p-4 text-left transition cursor-pointer ${
                  active
                    ? "border-foreground bg-primary/15 shadow-neo-sm"
                    : "border-border/80 bg-card hover:border-primary/60 hover:bg-accent hover:shadow-neo-sm"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl" role="img" aria-hidden="true">
                    {item.flag}
                  </span>
                  <div>
                    <div className="font-black text-sm text-foreground">{item.native}</div>
                    <div className="text-xs text-muted-foreground font-medium">{item.label}</div>
                  </div>
                </div>
                {active && (
                  <div className="grid size-6 place-items-center rounded-full border-2 border-foreground bg-primary text-primary-foreground shadow-neo-sm">
                    <Check className="size-3.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel className="space-y-4 border-2 shadow-neo-sm">
        <div className="flex items-center gap-3">
          <Cpu className="size-5 text-electric stroke-[2.2]" />
          <div>
            <h3 className="font-black text-base">{t("settings.gemmaSection")}</h3>
            <p className="text-xs text-muted-foreground font-medium">{t("settings.gemmaHelp")}</p>
          </div>
        </div>

        <div className="rounded-xl border-2 border-border/80 bg-muted/40 p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-semibold">Modèle d'analyse :</span>
            <span className="font-mono font-black text-foreground">gemma-4-26b-a4b-it (Multilingue)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-semibold">Langues gérées :</span>
            <span className="font-black text-primary">Français, English, Eʋegbe (Éwé)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-semibold">Support Code-Switching :</span>
            <span className="font-black text-success">Activé</span>
          </div>
        </div>
      </Panel>

      <Panel className="space-y-3 border-2 shadow-neo-sm">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-5 text-success stroke-[2.2]" />
          <div>
            <h3 className="font-black text-base">{t("settings.verificationSection")}</h3>
            <p className="text-xs text-muted-foreground font-medium">{t("settings.verificationDesc")}</p>
          </div>
        </div>
        <div className="rounded-xl border-2 border-success/40 bg-success/10 p-3 text-xs text-success-foreground flex items-center gap-2 font-semibold">
          <ShieldCheck className="size-4 shrink-0 text-success" />
          <span>{t("common.humanVerificationBadge")} — Spécification Section 17 validée.</span>
        </div>
      </Panel>

      <Panel className="space-y-2 border-2 shadow-neo-sm">
        <div className="flex items-center gap-2 font-black text-sm">
          <Database className="size-4 text-muted-foreground" />
          {t("settings.privacyTitle")}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed font-medium">
          {t("settings.privacyDescription")}
        </p>
      </Panel>
    </div>
  );
}
