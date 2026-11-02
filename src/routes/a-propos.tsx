import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Info,
  Globe2,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  Cpu,
  ArrowRight,
  Shield,
  Layers,
} from "lucide-react";
import { PageHeader, Panel } from "@/components/cs/ui";
import { CyberSticker } from "@/components/cs/CyberDecorations";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/a-propos")({
  head: () => ({
    meta: [
      { title: "À propos — CyberSafe Online" },
      {
        name: "description",
        content:
          "Présentation de la plateforme CyberSafe Online — Architecture anti-fraude, protection citoyenne et éthique de l'IA en Afrique de l'Ouest.",
      },
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
        title="À Propos de CyberSafe Online"
        subtitle="Plateforme SaaS citoyenne de prévention des fraudes et d'éducation à la cybersécurité en Afrique de l'Ouest."
      >
        <div className="flex flex-wrap items-center gap-2">
          <CyberSticker tone="lime" icon={Sparkles} rotate="none">
            CyberSafe Online
          </CyberSticker>
          <CyberSticker tone="cyan" rotate="none">
            Protection Citoyenne 2026
          </CyberSticker>
        </div>
      </PageHeader>

      <Panel className="overflow-hidden border-2 border-border/80 bg-card p-6 shadow-neo-sm">
        <div className="space-y-3">
          <CyberSticker tone="cyan" rotate="none">
            Équipe « Les Bugs Busters »
          </CyberSticker>
          <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight">
            Sécurité Mobile Money & Apprentissage Intelligent
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed font-medium">
            « Détecter les menaces, comprendre les risques et apprendre sans limites ». CyberSafe
            Online unit la puissance multimodale de{" "}
            <strong>Google Gemma 4 (gemma-4-26b-a4b-it)</strong> et la réputation technique mondiale
            de l'API VirusTotal v3 pour protéger les citoyens togolais (vendeuses de marché,
            étudiants, zémidjans) contre les escroqueries quotidiennes.
          </p>
          <div className="pt-2 flex flex-wrap gap-2.5">
            <Button
              asChild
              variant="hero"
              size="sm"
              className="shadow-neo border-2 border-white/20 font-bold"
            >
              <Link to="/sms">
                Tester le Scanner SMS <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="neo" size="sm" className="font-bold">
              <Link to="/assistant">Extension « Apprendre » (Commandes /)</Link>
            </Button>
          </div>
        </div>
      </Panel>

      <Panel className="space-y-4 border-2 shadow-neo-sm">
        <div className="flex items-center justify-between border-b-2 border-border/80 pb-3">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black flex items-center gap-2 text-foreground">
              <Shield className="size-5 text-primary stroke-[2.2]" />
              Piliers Fondamentaux de la Plateforme SaaS CyberSafe
            </h3>
            <p className="text-xs text-muted-foreground font-medium">
              Une solution technologique pérenne dédiée à la sécurité numérique citoyenne et à
              l'éducation anti-fraude
            </p>
          </div>
          <CyberSticker tone="lime" rotate="none">
            Impact Citoyen & Pérennité
          </CyberSticker>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border-2 border-border/80 bg-muted/30 p-4 space-y-2 shadow-neo-sm">
            <div className="flex items-center justify-between">
              <span className="font-black text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
                <ShieldCheck className="size-4" />
                1. Mission & Protection Citoyenne
              </span>
              <CheckCircle2 className="size-4 text-success" />
            </div>
            <h4 className="font-black text-sm">Autonomie face aux arnaques financières</h4>
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              Démocratiser l'accès aux outils de cyberdéfense pour tous les usagers : commerçants,
              étudiants, transporteurs et familles. CyberSafe Online transforme la vigilance
              quotidienne en réflexe simple et accessible sans barrière technique ni jargon
              complexe.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-border/80 bg-muted/30 p-4 space-y-2 shadow-neo-sm">
            <div className="flex items-center justify-between">
              <span className="font-black text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Layers className="size-4" />
                2. Architecture Anti-Fraude Multi-Niveaux
              </span>
              <CheckCircle2 className="size-4 text-success" />
            </div>
            <h4 className="font-black text-sm">Détection heuristique, IA et réputation mondiale</h4>
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              Analyse en profondeur combinant l'intelligence multimodale de Google Gemma 4 pour la
              contextualisation locale, l'inspection syntaxique rigoureuse des formats d'opérateurs
              (T-Money, Moov Money) et l'API VirusTotal v3 pour l'évaluation globale des menaces.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-border/80 bg-muted/30 p-4 space-y-2 shadow-neo-sm">
            <div className="flex items-center justify-between">
              <span className="font-black text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Globe2 className="size-4" />
                3. Ancrage au Togo & Afrique de l'Ouest
              </span>
              <CheckCircle2 className="size-4 text-success" />
            </div>
            <h4 className="font-black text-sm">Adaptation culturelle et multilinguisme inclusif</h4>
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              Prise en compte directe des schémas d'arnaques observés sur le terrain (faux dépôts
              par erreur, fausses tontines, fraudes aux concours). Synthèse vocale et alertes
              compréhensibles en langues locales, notamment l'Éwé (Eʋegbe) et le Français.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-border/80 bg-muted/30 p-4 space-y-2 shadow-neo-sm">
            <div className="flex items-center justify-between">
              <span className="font-black text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Lock className="size-4" />
                4. Éthique, Confidentialité & IA Transparente
              </span>
              <CheckCircle2 className="size-4 text-success" />
            </div>
            <h4 className="font-black text-sm">Protection stricte des données personnelles</h4>
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              Traitement confidentiel avec anonymisation des coordonnées et des numéros de
              téléphone. Les verdicts de détection sont systématiquement accompagnés d'explications
              pédagogiques claires pour sensibiliser durablement chaque citoyen.
            </p>
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 md:grid-cols-3">
        <Panel className="space-y-3 border-2 shadow-neo-sm">
          <div className="grid size-10 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary shadow-neo-sm">
            <ShieldCheck className="size-5 stroke-[2.2]" />
          </div>
          <h3 className="text-base font-black">{t("about.missionTitle")}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">
            {t("about.missionDesc")}
          </p>
        </Panel>

        <Panel className="space-y-3 border-2 shadow-neo-sm">
          <div className="grid size-10 place-items-center rounded-xl border border-electric/40 bg-electric/20 text-electric shadow-neo-sm">
            <Globe2 className="size-5 stroke-[2.2]" />
          </div>
          <h3 className="text-base font-black">{t("about.multilingualTitle")}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">
            Français, Anglais et Éwé (Eʋegbe) avec adaptation culturelle et terminologique des
            services togolais.
          </p>
        </Panel>

        <Panel className="space-y-3 border-2 shadow-neo-sm">
          <div className="grid size-10 place-items-center rounded-xl border border-success/40 bg-success/15 text-success shadow-neo-sm">
            <Lock className="size-5 stroke-[2.2]" />
          </div>
          <h3 className="text-base font-black">{t("about.safetyTitle")}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">
            {t("about.safetyDesc")}
          </p>
        </Panel>
      </div>

      <Panel className="bg-night text-night-foreground border-2 border-sidebar-border space-y-4 shadow-neo-sm">
        <div className="flex items-center gap-2">
          <Cpu className="size-5 text-electric stroke-[2.2]" />
          <h3 className="text-base sm:text-lg font-black text-electric">
            Stack Technique & Moteurs d'Intelligence Artificielle
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-night-muted font-medium">
          Architecture moderne, légère, réactive et déployable instantanément :
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-1">
            <span className="font-bold text-white">Google Gemma 4</span>
            <p className="text-night-muted font-medium">
              gemma-4-26b-a4b-it via @google/genai SDK avec consigne système stricte.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-1">
            <span className="font-bold text-white">VirusTotal v3 API</span>
            <p className="text-night-muted font-medium">
              Analyse de réputation mondiale de liens URL sans exposition de l'utilisateur.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-1">
            <span className="font-bold text-white">React 19 & Vite</span>
            <p className="text-night-muted font-medium">
              TanStack Router type-safe, Tailwind CSS v4, Lucide Icons, Sonner toasts.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-1">
            <span className="font-bold text-white">Web Speech API</span>
            <p className="text-night-muted font-medium">
              Synthèse vocale d'alertes en français et éwé + reconnaissance vocale intégrée.
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}
