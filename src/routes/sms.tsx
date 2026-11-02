import { createFileRoute } from "@tanstack/react-router";
import { MessageSquareWarning, ScanSearch, ImageUp, Link2, User, Banknote, Phone, Sparkles, Globe, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GemmaStatusBanner, PageHeader, Panel, ProgressBar, ResultView } from "@/components/cs/ui";
import { VirusTotalCard } from "@/components/cs/VirusTotalCard";
import { saveAnalysis } from "@/lib/history";
import { MULTILINGUAL_DEMO_SMS } from "@/lib/demo";
import { useI18n } from "@/lib/i18n";
import {
  analyzeWithGemmaApi,
  GemmaApiError,
  type CombinedSmsAnalysisResult,
} from "@/lib/gemma-client";

export const Route = createFileRoute("/sms")({
  head: () => ({
    meta: [
      { title: "Scanner SMS — CyberSafe Online" },
      { name: "description", content: "Analyse croisée IA CyberSafe & VirusTotal v3 : détection d'arnaques SMS Mobile Money et réputation technique des liens." },
      { property: "og:title", content: "Scanner SMS — CyberSafe Online" },
      { property: "og:description", content: "Analyse combinée avec le moteur officiel IA CyberSafe et VirusTotal API v3." },
    ],
  }),
  component: SmsPage,
});

function SmsPage() {
  const { t, lang } = useI18n();
  const [text, setText] = useState("");
  const [vtConsent, setVtConsent] = useState(true);
  const [progress, setProgress] = useState<number | null>(null);
  const [result, setResult] = useState<CombinedSmsAnalysisResult | null>(null);
  const [apiError, setApiError] = useState<{ message: string; quota: boolean } | null>(null);

  const demoList = MULTILINGUAL_DEMO_SMS[lang] || MULTILINGUAL_DEMO_SMS.fr;

  const run = async () => {
    const trimmed = text.trim();
    if (trimmed.length < 10) {
      toast.error(t("sms.tooShort"));
      return;
    }
    if (trimmed.length > 2000) {
      toast.error(t("sms.tooLong"));
      return;
    }

    setApiError(null);
    setProgress(15);

    try {
      // Progression dynamique pendant l'analyse combinée
      const pTimer = setInterval(() => {
        setProgress((prev) => (prev && prev < 85 ? prev + 15 : prev));
      }, 300);

      const res = await analyzeWithGemmaApi(trimmed, "sms", lang, [], {
        checkVirusTotal: vtConsent,
      });
      clearInterval(pTimer);
      setProgress(100);

      // Extraire les liens, montants et numéros locaux pour l'affichage
      const amounts = Array.from(new Set(trimmed.match(/\d[\d\s.,]*\s?(?:F\s?CFA|FCFA|XOF|F)\b/gi) ?? [])).map((a) => a.trim());
      const phones = Array.from(new Set(trimmed.match(/(?:\+?228[\s-]?)?\b\d{2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}\b/g) ?? []));
      const links = Array.from(new Set(trimmed.match(/\b((?:https?:\/\/|www\.)[^\s<>"']+|[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|net|org|tg|xyz|top|click|live|icu|buzz|info|online|site|ly|co|me|io|gq|tk|ml)(?:\/[^\s<>"']*)?)/gi) ?? []));

      res.extracted = {
        amounts,
        phones,
        links,
      };

      saveAnalysis("SMS", res);
      setResult(res);
      toast.success("Analyse croisée IA CyberSafe & VirusTotal terminée");
    } catch (err: any) {
      console.error(err);
      const isQuota = err instanceof GemmaApiError ? err.quotaExceeded : false;
      const msg = err.message || "Erreur lors de l'analyse du SMS.";
      setApiError({ message: msg, quota: isQuota });
      toast.error(isQuota ? "Capacité d'analyse maximale atteinte" : "Erreur d'analyse");
    } finally {
      setProgress(null);
    }
  };

  return (
    <>
      <PageHeader
        icon={MessageSquareWarning}
        title={t("sms.title")}
        subtitle={t("sms.subtitle")}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5 text-electric" /> IA CyberSafe Connectée
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Globe className="size-3.5 text-primary" /> VirusTotal v3 Actif
          </span>
        </div>
      </PageHeader>

      {apiError && (
        <div className="mb-6">
          <GemmaStatusBanner error={apiError.message} quotaExceeded={apiError.quota} />
        </div>
      )}

      {result ? (
        <ResultView
          result={result}
          onReset={() => {
            setResult(null);
            setText("");
            setApiError(null);
          }}
          extra={
            <div className="space-y-5">
              {result.virusTotal && (
                <VirusTotalCard
                  virusTotal={result.virusTotal}
                  {...(result.gemmaRisk ? { gemmaRisk: result.gemmaRisk } : {})}
                  {...(result.technicalRisk ? { technicalRisk: result.technicalRisk } : {})}
                />
              )}
              <Extracted r={result} />
            </div>
          }
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          <Panel className="lg:col-span-2 space-y-4">
            <label htmlFor="sms" className="text-sm font-semibold">
              {t("sms.label")}
            </label>
            <Textarea
              id="sms"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={2000}
              rows={8}
              placeholder={t("sms.placeholder")}
              className="resize-none rounded-xl text-base"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{t("sms.warningPin")}</span>
              <span>{text.length}/2000</span>
            </div>

            {/* Notification et Consentement VirusTotal v3 conforme à la section 5 */}
            <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-muted/40 p-3.5 text-xs">
              <input
                type="checkbox"
                id="vt-consent"
                checked={vtConsent}
                onChange={(e) => setVtConsent(e.target.checked)}
                className="mt-0.5 size-4 rounded accent-primary cursor-pointer"
              />
              <label htmlFor="vt-consent" className="cursor-pointer space-y-0.5">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Globe className="size-3.5 text-primary" /> Vérification technique des liens avec VirusTotal v3
                </span>
                <span className="block text-muted-foreground text-[11px] leading-relaxed">
                  Confidentialité stricte : Seules les URLs extraites sont envoyées pour vérifier leur réputation technique auprès de plus de 70 moteurs antivirus mondiaux. Le corps du SMS ne quitte jamais la plateforme.
                </span>
              </label>
            </div>

            {progress !== null && <ProgressBar value={progress} />}
            <div className="flex flex-wrap gap-3">
              <Button variant="hero" size="lg" onClick={run} disabled={progress !== null}>
                <ScanSearch /> {t("sms.analyzeBtn")}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => toast.info(t("common.soon") + " : OCR")}
              >
                <ImageUp /> {t("sms.ocrBtn")}{" "}
                <span className="ml-1 rounded bg-muted px-1.5 text-[10px]">
                  {t("common.soon")}
                </span>
              </Button>
            </div>
            <GemmaStatusBanner />
          </Panel>

          <Panel>
            <h3 className="font-semibold">{t("sms.demoTitle")}</h3>
            <p className="mb-4 text-xs text-muted-foreground">{t("sms.demoSubtitle")}</p>
            <div className="space-y-2">
              {demoList.map((d) => (
                <button
                  key={d.label}
                  onClick={() => setText(d.text)}
                  className="w-full rounded-xl border bg-muted/40 p-3 text-left transition hover:border-primary/40 hover:bg-accent"
                >
                  <div className="text-sm font-semibold">{d.label}</div>
                  <div className="line-clamp-2 text-xs text-muted-foreground">{d.text}</div>
                </button>
              ))}
            </div>
          </Panel>
        </div>
      )}
    </>
  );
}

function Extracted({ r }: { r: CombinedSmsAnalysisResult }) {
  const { t } = useI18n();
  const rows = [
    { icon: User, k: t("sms.sender"), v: r.extracted.sender ? [r.extracted.sender] : [] },
    { icon: Banknote, k: t("sms.amounts"), v: r.extracted.amounts },
    { icon: Link2, k: t("sms.links"), v: r.extracted.links },
    { icon: Phone, k: t("sms.phones"), v: r.extracted.phones },
  ];
  return (
    <Panel>
      <h3 className="mb-4 font-semibold">{t("sms.extractedTitle")}</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map(({ icon: Icon, k, v }) => (
          <div key={k} className="rounded-xl bg-muted/60 p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Icon className="size-3.5" /> {k}
            </div>
            <div className="mt-1 break-all text-sm font-medium">
              {v && v.length ? v.join(", ") : "—"}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
