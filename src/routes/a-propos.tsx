import { createFileRoute } from "@tanstack/react-router";
import { Info, Globe2, ShieldCheck, CheckCircle2, Lock, Sparkles } from "lucide-react";
import { PageHeader, Panel } from "@/components/cs/ui";
import { useI18n } from "@/lib/i18n";
import brandBanner from "@/assets/cybersafeimage2.jpeg";

export const Route = createFileRoute("/a-propos")({
  head: () => ({
    meta: [
      { title: "À propos — CyberSafe Online" },
      { name: "description", content: "Présentation de la plateforme CyberSafe Online et des exigences multilingues pour le Togo." },
    ],
  }),
  component: AboutPage,
});

export function AboutPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Info}
        title={t("about.title")}
        subtitle={t("about.subtitle")}
      />

      {/* Bannière Identité Officielle CyberSafe Online */}
      <Panel className="overflow-hidden border-primary/20 bg-card p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-full md:w-1/2 overflow-hidden rounded-2xl bg-white p-4 shadow-glow ring-1 ring-white/20">
            <img
              src={brandBanner}
              alt="CyberSafe Online — Sécurité & Apprentissage Intelligent"
              className="w-full h-auto object-contain"
            />
          </div>
          <div className="w-full md:w-1/2 space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5 text-electric" /> Identité Officielle
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-display">
              Sécurité & Apprentissage Intelligent
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              « Détecter les menaces, comprendre les risques et apprendre sans limites ». CyberSafe Online unit l'intelligence artificielle avancée (IA CyberSafe) et la réputation technique mondiale (VirusTotal API v3) pour protéger les citoyens togolais contre les escroqueries numériques.
            </p>
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 md:grid-cols-3">
        <Panel className="space-y-3">
          <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </div>
          <h3 className="text-lg font-bold">{t("about.missionTitle")}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("about.missionDesc")}
          </p>
        </Panel>

        <Panel className="space-y-3">
          <div className="grid size-10 place-items-center rounded-xl bg-electric/20 text-electric">
            <Globe2 className="size-5" />
          </div>
          <h3 className="text-lg font-bold">{t("about.multilingualTitle")}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("about.multilingualDesc")}
          </p>
        </Panel>

        <Panel className="space-y-3">
          <div className="grid size-10 place-items-center rounded-xl bg-success/15 text-success">
            <Lock className="size-5" />
          </div>
          <h3 className="text-lg font-bold">{t("about.safetyTitle")}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("about.safetyDesc")}
          </p>
        </Panel>
      </div>

      <Panel className="bg-night text-night-foreground border-sidebar-border space-y-4">
        <h3 className="text-lg font-bold text-electric">
          Spécification CyberSafe Online : Section 17 Système Multilingue
        </h3>
        <p className="text-sm text-night-muted">
          Synthèse des exigences intégrées dès l'architecture :
        </p>
        <div className="grid gap-3 sm:grid-cols-2 text-xs">
          <div className="rounded-xl bg-night-foreground/5 p-3 space-y-1">
            <span className="font-semibold text-night-foreground flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-success" />
              Trois langues officielles intégrées
            </span>
            <p className="text-night-muted">
              Français (par défaut), Anglais et Éwé (Eʋegbe) avec sélecteur visible dans l'en-tête.
            </p>
          </div>
          <div className="rounded-xl bg-night-foreground/5 p-3 space-y-1">
            <span className="font-semibold text-night-foreground flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-success" />
              Adaptation locale au Togo
            </span>
            <p className="text-night-muted">
              Prise en compte des terminologies locales Mobile Money (T-Money, Moov Money, Flooz).
            </p>
          </div>
          <div className="rounded-xl bg-night-foreground/5 p-3 space-y-1">
            <span className="font-semibold text-night-foreground flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-success" />
              IA CyberSafe multilingue
            </span>
            <p className="text-night-muted">
              L'IA CyberSafe analyse les SMS et audios dans les 3 langues et répond dans la langue de l'utilisateur.
            </p>
          </div>
          <div className="rounded-xl bg-night-foreground/5 p-3 space-y-1">
            <span className="font-semibold text-night-foreground flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-success" />
              Vérification humaine de sécurité
            </span>
            <p className="text-night-muted">
              Relecture humaine stricte des messages de prévention sur les PIN, OTP et transferts.
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}
