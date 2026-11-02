import { createFileRoute } from "@tanstack/react-router";
import { Settings, Globe, Cpu, Check, ShieldCheck, Database } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/cs/ui";
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
      />

      {/* Language Section */}
      <Panel className="space-y-4">
        <div className="flex items-center gap-3">
          <Globe className="size-5 text-primary" />
          <div>
            <h3 className="font-bold text-base">{t("settings.languageSection")}</h3>
            <p className="text-xs text-muted-foreground">{t("settings.languageHelp")}</p>
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
                className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${
                  active
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border bg-card hover:border-primary/40 hover:bg-accent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl" role="img" aria-hidden="true">
                    {item.flag}
                  </span>
                  <div>
                    <div className="font-bold text-sm text-foreground">{item.native}</div>
                    <div className="text-xs text-muted-foreground">{item.label}</div>
                  </div>
                </div>
                {active && (
                  <div className="grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Panel>

      {/* Gemma AI Section */}
      <Panel className="space-y-4">
        <div className="flex items-center gap-3">
          <Cpu className="size-5 text-electric" />
          <div>
            <h3 className="font-bold text-base">{t("settings.gemmaSection")}</h3>
            <p className="text-xs text-muted-foreground">{t("settings.gemmaHelp")}</p>
          </div>
        </div>

        <div className="rounded-xl border bg-muted/40 p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Modèle d'analyse :</span>
            <span className="font-mono font-semibold">IA CyberSafe (Multilingue)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Langues gérées :</span>
            <span className="font-semibold text-primary">Français, English, Eʋegbe (Éwé)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Support Code-Switching :</span>
            <span className="font-semibold text-success">Activé</span>
          </div>
        </div>
      </Panel>

      {/* Human Linguistic Verification Section */}
      <Panel className="space-y-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-5 text-success" />
          <div>
            <h3 className="font-bold text-base">{t("settings.verificationSection")}</h3>
            <p className="text-xs text-muted-foreground">{t("settings.verificationDesc")}</p>
          </div>
        </div>
        <div className="rounded-xl border border-success/30 bg-success/10 p-3 text-xs text-success-foreground flex items-center gap-2">
          <ShieldCheck className="size-4 shrink-0 text-success" />
          <span>{t("common.humanVerificationBadge")} — Spécification Section 17 validée.</span>
        </div>
      </Panel>

      {/* Privacy and Local Storage */}
      <Panel className="space-y-2">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <Database className="size-4 text-muted-foreground" />
          Stockage local et respect de la vie privée
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          La langue choisie ainsi que l'historique de vos analyses sont sauvegardés exclusivement dans votre navigateur (localStorage).
          Aucune donnée brute personnelle n'est envoyée ou conservée sur un serveur tiers.
        </p>
      </Panel>
    </div>
  );
}
