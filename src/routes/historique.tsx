import { createFileRoute } from "@tanstack/react-router";
import { History, Trash2, ShieldAlert, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, RiskBadge } from "@/components/cs/ui";
import { useHistory, clearHistory, type ScanType } from "@/lib/history";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/historique")({
  head: () => ({
    meta: [
      { title: "Historique des analyses — CyberSafe Online" },
      { name: "description", content: "Consultez l'historique de vos vérifications de SMS, QR codes et appels audio." },
    ],
  }),
  component: HistoriquePage,
});

export function HistoriquePage() {
  const { t, lang } = useI18n();
  const history = useHistory();
  const [filter, setFilter] = useState<"ALL" | ScanType>("ALL");

  const filtered = filter === "ALL" ? history : history.filter((h) => h.type === filter);

  const handleClear = () => {
    if (window.confirm(t("history.confirmClear"))) {
      clearHistory();
      toast.success(t("history.deleted"));
    }
  };

  const localeMap = {
    fr: "fr-FR",
    en: "en-US",
    ee: "fr-TG",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={History}
        title={t("history.title")}
        subtitle={t("history.subtitle")}
      >
        {history.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClear} className="text-destructive hover:bg-destructive/10">
            <Trash2 className="size-4" /> {t("history.clearAll")}
          </Button>
        )}
      </PageHeader>

      <div className="flex gap-2">
        {(["ALL", "SMS", "QR", "Audio"] as const).map((k) => (
          <Button
            key={k}
            variant={filter === k ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(k)}
          >
            {k === "ALL" ? t("history.filterAll") : k}
          </Button>
        ))}
      </div>

      <Panel>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <History className="size-10 text-muted-foreground opacity-50" />
            <h4 className="mt-4 text-base font-semibold">{t("history.empty")}</h4>
            <p className="mt-1 text-xs text-muted-foreground">{t("history.emptyDesc")}</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((item) => (
              <li key={item.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <span>{item.type}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      · {new Date(item.date).toLocaleString(localeMap[lang] || "fr-FR")}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-foreground/85 leading-snug">{item.summary}</p>
                  {item.findings.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.findings.map((f, i) => (
                        <span key={i} className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {f.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="shrink-0 pt-2 sm:pt-0">
                  <RiskBadge level={item.level} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
