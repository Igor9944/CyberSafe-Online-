import { createFileRoute, Link } from "@tanstack/react-router";
import { History, Trash2, Search, Download, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, Panel, RiskBadge } from "@/components/cs/ui";
import { CyberSticker } from "@/components/cs/CyberDecorations";
import { useHistory, clearHistory, type ScanType } from "@/lib/history";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/historique")({
  head: () => ({
    meta: [
      { title: "Historique des analyses — CyberSafe Online" },
      {
        name: "description",
        content:
          "Consultez l'historique complet de vos vérifications de SMS, QR codes et appels audio Mobile Money.",
      },
    ],
  }),
  component: HistoriquePage,
});

export function HistoriquePage() {
  const { t, lang } = useI18n();
  const history = useHistory();
  const [filter, setFilter] = useState<"ALL" | ScanType>("ALL");
  const [search, setSearch] = useState("");

  const filtered = history
    .filter((h) => (filter === "ALL" ? true : h.type === filter))
    .filter((h) => {
      if (!search.trim()) return true;
      const term = search.toLowerCase();
      return (
        h.summary.toLowerCase().includes(term) ||
        h.type.toLowerCase().includes(term) ||
        h.findings.some(
          (f) =>
            f.label.toLowerCase().includes(term) ||
            (f.detail ? f.detail.toLowerCase().includes(term) : false),
        )
      );
    });

  const handleClear = () => {
    if (window.confirm("Êtes-vous sûr de vouloir vider tout l'historique d'analyse ?")) {
      clearHistory();
      toast.success(t("history.deleted"));
    }
  };

  const exportToJson = () => {
    if (history.length === 0) {
      toast.info("Aucun historique à exporter.");
      return;
    }
    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `cybersafe-historique-${new Date().toISOString().slice(0, 10)}.json`,
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Historique exporté au format JSON !");
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
        subtitle="Retrouvez l'ensemble des analyses effectuées localement sur votre appareil sans fuite de données."
      >
        <div className="flex flex-wrap items-center gap-2">
          <CyberSticker tone="lime" rotate="none">
            100% Stockage Local
          </CyberSticker>
          {history.length > 0 && (
            <>
              <Button variant="neo" size="sm" onClick={exportToJson} className="gap-1.5 font-bold">
                <Download className="size-4" /> Exporter JSON
              </Button>
              <Button
                variant="neo"
                size="sm"
                onClick={handleClear}
                className="text-destructive hover:bg-destructive/10 gap-1.5 font-bold"
              >
                <Trash2 className="size-4" /> {t("history.clearAll")}
              </Button>
            </>
          )}
        </div>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {(["ALL", "SMS", "QR", "Audio"] as const).map((k) => (
            <Button
              key={k}
              variant={filter === k ? "neo" : "outline"}
              size="sm"
              onClick={() => setFilter(k)}
              className="text-xs font-bold"
            >
              {k === "ALL" ? t("history.filterAll") : k}
            </Button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par mot-clé..."
            className="pl-9 h-9 text-xs rounded-xl border-2 font-medium"
          />
        </div>
      </div>

      <Panel className="border-2 shadow-neo-sm">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="grid size-14 place-items-center rounded-2xl border-2 border-foreground/70 bg-muted/60 text-muted-foreground mb-3 shadow-neo-sm">
              <History className="size-7 stroke-[2.2]" />
            </div>
            <h4 className="text-base font-black">{t("history.empty")}</h4>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm font-medium">
              {search.trim()
                ? "Aucune analyse ne correspond à votre recherche."
                : "Vos vérifications de SMS, QR codes et appels analysés apparaîtront ici avec leur niveau de risque."}
            </p>
            <div className="mt-5">
              <Button
                asChild
                variant="hero"
                size="sm"
                className="font-bold shadow-neo border-2 border-white/20"
              >
                <Link to="/sms">
                  <Sparkles className="size-4" /> Lancer un scan SMS
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <ul className="divide-y-2 divide-border/60">
            {filtered.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/30 px-3 rounded-xl transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-primary font-black">
                      {item.type}
                    </span>
                    <span className="text-muted-foreground font-medium">
                      · {new Date(item.date).toLocaleString(localeMap[lang] || "fr-FR")}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-foreground leading-snug">
                    {item.summary}
                  </p>
                  {item.findings.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.findings.map((f, i) => (
                        <span
                          key={i}
                          className="rounded-md border border-border bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground"
                        >
                          {f.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="shrink-0 flex items-center gap-2 pt-1 sm:pt-0">
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
