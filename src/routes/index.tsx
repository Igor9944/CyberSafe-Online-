import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  MessageSquareWarning,
  QrCode,
  AudioLines,
  ArrowRight,
  ShieldCheck,
  Activity,
  ShieldAlert,
  Lock,
  Eye,
  Brain,
  History,
  Bot,
  Sparkles,
  GraduationCap,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, RiskBadge } from "@/components/cs/ui";
import { PwaInstallButton } from "@/components/cs/PwaInstallButton";
import {
  WavyCyberGrid,
  TopographicContours,
  MemphisDoodle,
  CyberSticker,
  CyberGlyph,
  type StickerTone,
} from "@/components/cs/CyberDecorations";
import { useHistory } from "@/lib/history";
import { useI18n } from "@/lib/i18n";
import { PUBLIC_GEMMA_MODEL } from "@/lib/gemma-client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CyberSafe Online — Moov / T-Money Assistant & Fraude Scanner (Gemma 4)" },
      {
        name: "description",
        content:
          "Analysez SMS, captures d'écran, QR codes et appels suspects ou révisez vos cours avec Google Gemma 4 au Togo.",
      },
      { property: "og:title", content: "CyberSafe Online — Votre sécurité numérique avec Gemma 4" },
      {
        property: "og:description",
        content: "Détectez les arnaques Mobile Money (T-Money / Moov Money) en quelques secondes.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const history = useHistory();
  const { t, lang } = useI18n();
  const threats = history.filter((h) => h.level !== "FAIBLE").length;

  const [studentStats, setStudentStats] = useState({ courses: 0, quizzes: 0 });
  useEffect(() => {
    try {
      const c = localStorage.getItem("cybersafe_student_courses_v1");
      const q = localStorage.getItem("cybersafe_student_quiz_history_v1");
      const cCount = c ? JSON.parse(c).length : 0;
      const qCount = q ? JSON.parse(q).length : 0;
      setStudentStats({ courses: cCount, quizzes: qCount });
    } catch {}
  }, []);

  const SCANNERS: Array<{
    to: string;
    icon: typeof MessageSquareWarning;
    badge: string;
    badgeTone: StickerTone;
    title: string;
    desc: string;
    cta: string;
  }> = [
    {
      to: "/sms",
      icon: MessageSquareWarning,
      badge: "MVP · Texte & Capture",
      badgeTone: "lime",
      title: t("home.scanners.sms.title"),
      desc: t("home.scanners.sms.desc"),
      cta: t("home.scanners.sms.cta"),
    },
    {
      to: "/apprendre",
      icon: GraduationCap,
      badge: "Espace Étudiant",
      badgeTone: "purple",
      title: "Hub d'Étude & Quiz Gemma",
      desc: "Bibliothèque de cours (PDF, Word, PPTX), quiz QCM adaptatifs et flashcards 3D.",
      cta: "Accéder à l'Espace Étudiant",
    },
    {
      to: "/assistant",
      icon: Bot,
      badge: "Gemma RAG & /cmd",
      badgeTone: "cyan",
      title: "Bot & Volet « Apprendre »",
      desc: "Mode Scanner d'arnaques par défaut, ou révisez vos cours via /apprendre, /plan, /quiz et /resume avec citations.",
      cta: "Ouvrir l'Assistant",
    },
    {
      to: "/qr",
      icon: QrCode,
      badge: "Anti-Phishing & VT",
      badgeTone: "yellow",
      title: t("home.scanners.qr.title"),
      desc: "Décodez les QR codes et auditez les URL suspectes via VirusTotal v3 sans ouvrir les liens piégés.",
      cta: t("home.scanners.qr.cta"),
    },
    {
      to: "/audio",
      icon: AudioLines,
      badge: "Faux Agents",
      badgeTone: "rose",
      title: t("home.scanners.audio.title"),
      desc: t("home.scanners.audio.desc"),
      cta: t("home.scanners.audio.cta"),
    },
  ];

  const localeMap = {
    fr: "fr-FR",
    en: "en-US",
    ee: "fr-TG",
  };

  return (
    <div className="space-y-8">
      <section className="relative animate-rise overflow-hidden rounded-3xl border-2 border-slate-800 bg-hero text-night-foreground shadow-neo ring-1 ring-white/10">
        <WavyCyberGrid className="opacity-20 stroke-white" />
        <TopographicContours className="opacity-15 stroke-sky-400" />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between p-7 sm:p-10 gap-8">
          <div className="max-w-xl lg:max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <CyberSticker tone="white" icon={ShieldCheck} rotate="none">
                {t("home.welcome")}
              </CyberSticker>
              <CyberSticker tone="cyan" icon={Sparkles} rotate="none">
                Google Gemma ({PUBLIC_GEMMA_MODEL})
              </CyberSticker>
              <CyberSticker tone="lime" rotate="right">
                Plateforme SaaS 2026
              </CyberSticker>
            </div>

            <div className="relative mt-5">
              <h1 className="text-3xl font-black leading-tight sm:text-5xl tracking-tight">
                {t("home.heroTitle")}{" "}
                <span className="text-electric">{t("home.heroHighlight")}</span>
              </h1>
              <div className="absolute -top-3 -right-6 hidden sm:block">
                <MemphisDoodle variant="spark" className="size-6 text-amber-300 animate-pulse" />
              </div>
            </div>

            <p className="mt-4 text-night-muted sm:text-lg leading-relaxed font-medium">
              {t("home.heroSubtitle")}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-night-foreground/90 font-medium">
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                <CheckCircle2 className="size-3.5 text-emerald-400" /> Formats T-Money & Moov Money
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                <CheckCircle2 className="size-3.5 text-emerald-400" /> Français · English · Eʋegbe
                (Éwé)
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                <CheckCircle2 className="size-3.5 text-emerald-400" /> Volet /apprendre intégré
              </span>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                asChild
                variant="hero"
                size="lg"
                className="shadow-neo border-2 border-white/30 font-bold"
              >
                <Link to="/sms">
                  <MessageSquareWarning /> {t("home.ctaSms")} / Capture
                </Link>
              </Button>
              <Button
                asChild
                variant="glass"
                size="lg"
                className="border-2 font-bold hover:shadow-neo-sm"
              >
                <Link to="/apprendre">
                  <GraduationCap /> Espace Étudiant
                </Link>
              </Button>
              <Button
                asChild
                variant="glass"
                size="lg"
                className="border-2 font-bold hover:shadow-neo-sm"
              >
                <Link to="/assistant">
                  <Bot /> Bot Assistant
                </Link>
              </Button>
              <Button
                asChild
                variant="glass"
                size="lg"
                className="border-2 font-bold hover:shadow-neo-sm"
              >
                <Link to="/qr">
                  <QrCode /> {t("home.ctaQr")}
                </Link>
              </Button>
              <Button
                asChild
                variant="glass"
                size="lg"
                className="border-2 font-bold hover:shadow-neo-sm"
              >
                <Link to="/audio">
                  <AudioLines /> {t("home.ctaAudio")}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          icon={Activity}
          label={t("home.stats.analyses")}
          value={history.length}
          badge="Scans réels"
        />
        <Stat
          icon={ShieldAlert}
          label={t("home.stats.threats")}
          value={threats}
          tone="text-destructive"
          badge="Menaces"
        />
        <Stat
          icon={GraduationCap}
          label="Cours & Documents"
          value={studentStats.courses}
          tone="text-electric"
          badge="Espace Étudiant"
        />
        <Stat
          icon={Lock}
          label={t("home.stats.storedData")}
          value={history.length}
          badge={t("home.stats.localHistory")}
        />
      </section>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SCANNERS.map(({ to, icon: Icon, badge, badgeTone, title, desc, cta }, i) => (
          <Link
            key={to}
            to={to}
            style={{ animationDelay: `${i * 70}ms` }}
            className="motion-card group animate-rise flex flex-col justify-between rounded-2xl border-2 border-border/80 bg-card p-6 shadow-neo-sm hover:border-primary/60 hover:shadow-neo"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <CyberGlyph icon={Icon} size="md" variant="electric" />
                <CyberSticker tone={badgeTone} rotate="none" peel={i === 0}>
                  {badge}
                </CyberSticker>
              </div>
              <h3 className="mt-5 text-lg font-black tracking-tight">{title}</h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">
                {desc}
              </p>
            </div>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
              {cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-5">
        <Panel className="lg:col-span-3 border-2 shadow-neo-sm">
          <div className="mb-4 flex items-center justify-between border-b-2 pb-3">
            <div>
              <h2 className="text-lg font-black">{t("home.recentAnalyses")}</h2>
              <p className="text-xs text-muted-foreground font-medium">
                Historique conservé uniquement sur votre navigateur
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="text-xs font-bold border-2">
              <Link to="/historique">{t("common.viewAll")}</Link>
            </Button>
          </div>
          {history.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border-2 border-dashed py-10 text-center">
              <History className="size-8 text-muted-foreground" />
              <p className="mt-3 font-bold">{t("home.noAnalyses")}</p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                {t("home.startFirst")}
              </p>
              <Button asChild variant="hero" size="sm" className="mt-4 font-bold shadow-neo-sm">
                <Link to="/sms">Tester un SMS maintenant</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y-2">
              {history.slice(0, 5).map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="text-sm font-bold">
                      <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs text-primary mr-1.5 font-bold">
                        {h.type}
                      </span>
                      <span className="font-medium text-xs text-muted-foreground">
                        {new Date(h.date).toLocaleString(localeMap[lang] || "fr-FR")}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs sm:text-sm text-muted-foreground font-medium">
                      {h.summary}
                    </p>
                  </div>
                  <RiskBadge level={h.level} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel className="lg:col-span-2 border-2 border-sidebar-border bg-night text-night-foreground shadow-neo-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black">{t("home.dailyTipsTitle")}</h2>
            <CyberSticker tone="lime" rotate="none">
              Secteur Informel
            </CyberSticker>
          </div>
          <ul className="mt-4 space-y-3">
            {[0, 1, 2, 3].map((idx) => {
              const tip = t(`home.tips.${idx}`);
              return (
                <li
                  key={idx}
                  className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs sm:text-sm leading-relaxed font-medium"
                >
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-electric" /> {tip}
                </li>
              );
            })}
          </ul>
        </Panel>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black">{t("home.howItWorks")}</h2>
            <MemphisDoodle variant="zigzag" className="size-5 text-electric opacity-75" />
          </div>
          <MemphisDoodle variant="wave" className="size-6 text-primary opacity-60" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Eye,
              badge: "Étape 1",
              badgeTone: "lime" as StickerTone,
              t: t("home.steps.step1.title"),
              d: t("home.steps.step1.desc"),
            },
            {
              icon: Brain,
              badge: "Étape 2 · Gemma 4",
              badgeTone: "cyan" as StickerTone,
              t: t("home.steps.step2.title"),
              d: t("home.steps.step2.desc"),
            },
            {
              icon: ShieldCheck,
              badge: "Étape 3",
              badgeTone: "purple" as StickerTone,
              t: t("home.steps.step3.title"),
              d: t("home.steps.step3.desc"),
            },
          ].map(({ icon: Icon, badge, badgeTone, t: stepTitle, d }, idx) => (
            <Panel key={stepTitle} className="relative overflow-hidden border-2 shadow-neo-sm">
              <div className="flex items-center justify-between">
                <CyberGlyph icon={Icon} size="md" variant={idx === 1 ? "electric" : "dark"} />
                <CyberSticker tone={badgeTone} rotate="none" peel={idx === 0}>
                  {badge}
                </CyberSticker>
              </div>
              <h3 className="mt-4 font-black text-base">{stepTitle}</h3>
              <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed font-medium">
                {d}
              </p>
            </Panel>
          ))}
        </div>
      </section>

      <section className="pt-2">
        <PwaInstallButton variant="card" />
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone = "text-primary",
  badge,
}: {
  icon: typeof Activity;
  label: string;
  value: number;
  tone?: string;
  badge?: string;
}) {
  return (
    <div className="motion-card rounded-2xl border-2 border-border/80 bg-card p-5 shadow-neo-sm hover:border-primary/40 hover:shadow-neo">
      <div className="flex items-center justify-between">
        <div className="grid size-9 place-items-center rounded-xl border-2 border-foreground/30 bg-muted shadow-[1.5px_1.5px_0px_#0f172a] dark:shadow-[1.5px_1.5px_0px_rgba(255,255,255,0.2)]">
          <Icon className={`size-5 stroke-[2.4] ${tone}`} />
        </div>
        {badge && (
          <CyberSticker tone="white" rotate="none" className="text-[10px] py-0.5 px-2">
            {badge}
          </CyberSticker>
        )}
      </div>
      <div className="mt-3 font-display text-3xl font-black tracking-tight">{value}</div>
      <div className="mt-0.5 text-xs font-bold text-muted-foreground">{label}</div>
    </div>
  );
}
