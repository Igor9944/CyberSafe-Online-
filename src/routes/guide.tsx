import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneCall, Smartphone, ShieldCheck, AlertTriangle, ArrowRight } from "lucide-react";
import { PageHeader, Panel } from "@/components/cs/ui";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/guide")({
  head: () => ({
    meta: [
      { title: "Guide d'enregistrement d'appel — CyberSafe Online" },
      { name: "description", content: "Comment enregistrer un appel suspect légalement et en toute sécurité au Togo." },
    ],
  }),
  component: GuidePage,
});

function GuidePage() {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={PhoneCall}
        title={t("guide.title")}
        subtitle={t("guide.subtitle")}
      />

      <div className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
        <p className="text-foreground">{t("guide.legalNotice")}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel className="space-y-4">
          <div className="flex items-center gap-3 font-semibold text-lg">
            <Smartphone className="size-5 text-primary" />
            <h3>{t("guide.androidTitle")}</h3>
          </div>
          <ol className="space-y-3 pl-4 list-decimal text-sm text-muted-foreground">
            {[0, 1, 2].map((idx) => (
              <li key={idx} className="leading-relaxed">
                {t(`guide.androidSteps.${idx}`)}
              </li>
            ))}
          </ol>
        </Panel>

        <Panel className="space-y-4">
          <div className="flex items-center gap-3 font-semibold text-lg">
            <Smartphone className="size-5 text-primary" />
            <h3>{t("guide.iosTitle")}</h3>
          </div>
          <ol className="space-y-3 pl-4 list-decimal text-sm text-muted-foreground">
            {[0, 1, 2].map((idx) => (
              <li key={idx} className="leading-relaxed">
                {t(`guide.iosSteps.${idx}`)}
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <Panel className="bg-night text-night-foreground border-sidebar-border">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <ShieldCheck className="size-5 text-electric" />
          {t("guide.whatNext")}
        </h3>
        <p className="mt-2 text-sm text-night-muted">
          {t("guide.whatNextDesc")}
        </p>
        <div className="mt-4">
          <Button asChild variant="hero">
            <Link to="/audio">
              {t("home.ctaSms").replace("SMS", "Audio")} <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </Panel>
    </div>
  );
}
