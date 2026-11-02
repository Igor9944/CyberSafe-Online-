import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageSquareWarning, QrCode, AudioLines, ArrowRight, ShieldCheck, Activity, ShieldAlert, Lock, Eye, Brain, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, RiskBadge } from "@/components/cs/ui";
import { useHistory } from "@/lib/history";
import { useI18n } from "@/lib/i18n";
import brandBanner from "@/assets/cybersafeimage2.jpeg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CyberSafe Online — Protection anti-arnaque Mobile Money" },
      { name: "description", content: "Analysez SMS, QR codes et appels suspects pour vous protéger des fraudes Moov Money et T-Money au Togo." },
      { property: "og:title", content: "CyberSafe Online — Votre sécurité numérique" },
      { property: "og:description", content: "Détectez les arnaques Mobile Money avant qu'elles ne vous coûtent." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const history = useHistory();
  const { t, lang } = useI18n();
  const threats = history.filter((h) => h.level !== "FAIBLE").length;

  const SCANNERS = [
    {
      to: "/sms",
      icon: MessageSquareWarning,
      title: t("home.scanners.sms.title"),
      desc: t("home.scanners.sms.desc"),
      cta: t("home.scanners.sms.cta"),
    },
    {
      to: "/qr",
      icon: QrCode,
      title: t("home.scanners.qr.title"),
      desc: t("home.scanners.qr.desc"),
      cta: t("home.scanners.qr.cta"),
    },
    {
      to: "/audio",
      icon: AudioLines,
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
      {/* Hero Section */}
      <section className="relative animate-rise overflow-hidden rounded-3xl bg-hero text-night-foreground">
        <div className="absolute inset-0 grid-pattern" />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between p-7 sm:p-10 gap-8">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-night-foreground/15 bg-night-foreground/10 px-3 py-1 text-xs font-medium">
              <ShieldCheck className="size-3.5 text-electric" /> {t("home.welcome")}
            </span>
            <h1 className="mt-5 text-3xl font-extrabold leading-tight sm:text-5xl">
              {t("home.heroTitle")} <span className="text-electric">{t("home.heroHighlight")}</span>
            </h1>
            <p className="mt-4 text-night-muted sm:text-lg">
              {t("home.heroSubtitle")}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="lg">
                <Link to="/sms"><MessageSquareWarning /> {t("home.ctaSms")}</Link>
              </Button>
              <Button asChild variant="glass" size="lg">
                <Link to="/qr"><QrCode /> {t("home.ctaQr")}</Link>
              </Button>
              <Button asChild variant="glass" size="lg">
                <Link to="/audio"><AudioLines /> {t("home.ctaAudio")}</Link>
              </Button>
            </div>
          </div>

          <div className="hidden lg:flex shrink-0 w-80 xl:w-96 flex-col items-center justify-center">
            <div className="w-full rounded-2xl bg-white p-4 shadow-glow ring-1 ring-white/20 transition-all hover:scale-105 duration-300">
              <img
                src={brandBanner}
                alt="CyberSafe Online Logo Officiel"
                className="w-full h-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Activity} label={t("home.stats.analyses")} value={history.length} />
        <Stat icon={ShieldAlert} label={t("home.stats.threats")} value={threats} tone="text-destructive" />
        <Stat icon={ShieldCheck} label={t("home.stats.safe")} value={history.length - threats} tone="text-success" />
        <Stat icon={Lock} label={t("home.stats.storedData")} value={0} />
      </section>

      {/* Scanners Grid */}
      <section className="grid gap-5 md:grid-cols-3">
        {SCANNERS.map(({ to, icon: Icon, title, desc, cta }, i) => (
          <Link
            key={to}
            to={to}
            style={{ animationDelay: `${i * 80}ms` }}
            className="group animate-rise rounded-2xl border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow"
          >
            <div className="grid size-12 place-items-center rounded-2xl bg-electric text-primary-foreground shadow-glow">
              <Icon className="size-6" />
            </div>
            <h3 className="mt-5 text-lg font-bold">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
              {cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </section>

      {/* Recent Analyses and Tips */}
      <section className="grid gap-5 lg:grid-cols-5">
        <Panel className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">{t("home.recentAnalyses")}</h2>
            <span className="text-xs text-muted-foreground font-medium">Stockage local sécurisé</span>
          </div>
          {history.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed py-10 text-center">
              <History className="size-8 text-muted-foreground" />
              <p className="mt-3 font-medium">{t("home.noAnalyses")}</p>
              <p className="text-sm text-muted-foreground">{t("home.startFirst")}</p>
            </div>
          ) : (
            <ul className="divide-y">
              {history.slice(0, 5).map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">
                      {h.type} ·{" "}
                      <span className="font-normal text-muted-foreground">
                        {new Date(h.date).toLocaleString(localeMap[lang] || "fr-FR")}
                      </span>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{h.summary}</p>
                  </div>
                  <RiskBadge level={h.level} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel className="lg:col-span-2 border-sidebar-border bg-night text-night-foreground">
          <h2 className="text-lg font-bold">{t("home.dailyTipsTitle")}</h2>
          <ul className="mt-4 space-y-3">
            {[0, 1, 2, 3].map((idx) => {
              const tip = t(`home.tips.${idx}`);
              return (
                <li key={idx} className="flex gap-3 rounded-xl bg-night-foreground/5 p-3 text-sm">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-electric" /> {tip}
                </li>
              );
            })}
          </ul>
        </Panel>
      </section>

      {/* How it works */}
      <section>
        <h2 className="mb-4 text-xl font-bold">{t("home.howItWorks")}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: Eye, t: t("home.steps.step1.title"), d: t("home.steps.step1.desc") },
            { icon: Brain, t: t("home.steps.step2.title"), d: t("home.steps.step2.desc") },
            { icon: ShieldCheck, t: t("home.steps.step3.title"), d: t("home.steps.step3.desc") },
          ].map(({ icon: Icon, t: stepTitle, d }) => (
            <Panel key={stepTitle}>
              <Icon className="size-6 text-primary" />
              <h3 className="mt-3 font-bold">{stepTitle}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </Panel>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone = "text-primary" }: { icon: typeof Activity; label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-card">
      <Icon className={`size-5 ${tone}`} />
      <div className="mt-3 font-display text-3xl font-bold">{value}</div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
    </div>
  );
}
