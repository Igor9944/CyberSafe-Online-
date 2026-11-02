import { createFileRoute } from "@tanstack/react-router";
import {
  MessageSquareWarning,
  ScanSearch,
  ImageUp,
  Link2,
  User,
  Banknote,
  Phone,
  Sparkles,
  Globe,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  X,
  FileText,
  Edit,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GemmaStatusBanner, PageHeader, Panel, ProgressBar, ResultView } from "@/components/cs/ui";
import { VirusTotalCard } from "@/components/cs/VirusTotalCard";
import { CyberSticker } from "@/components/cs/CyberDecorations";
import { saveAnalysis } from "@/lib/history";
import { MULTILINGUAL_DEMO_SMS } from "@/lib/demo";
import { useI18n } from "@/lib/i18n";
import {
  analyzeWithGemmaApi,
  extractSmsImageApi,
  GemmaApiError,
  type CombinedSmsAnalysisResult,
} from "@/lib/gemma-client";
import { extractTextWithLocalOcr } from "@/lib/ocr";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sms")({
  head: () => ({
    meta: [
      { title: "Scanner SMS & Capture — CyberSafe Online" },
      { name: "description", content: "Analyse par Google Gemma 4 & VirusTotal v3 : détection d'arnaques SMS Mobile Money (T-Money / Moov Money) par texte ou capture d'écran." },
      { property: "og:title", content: "Scanner SMS & Capture — CyberSafe Online" },
      { property: "og:description", content: "Vérifiez en quelques secondes si un SMS T-Money ou Moov Money est authentique ou frauduleux." },
    ],
  }),
  component: SmsPage,
});

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function SmsPage() {
  const { t, lang } = useI18n();
  const [text, setText] = useState("");
  const [screenshot, setScreenshot] = useState<{
    name: string;
    base64: string;
    mimeType: string;
    previewUrl: string;
  } | null>(null);
  const [vtConsent, setVtConsent] = useState(true);
  const [progress, setProgress] = useState<number | null>(null);
  const [result, setResult] = useState<CombinedSmsAnalysisResult | null>(null);
  const [apiError, setApiError] = useState<{ message: string; quota: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const demoList = MULTILINGUAL_DEMO_SMS[lang] || MULTILINGUAL_DEMO_SMS.fr;

  const handleScreenshotSelect = (file?: File) => {
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Format d'image non supporté. Utilisez PNG, JPG ou WEBP.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Capture d'écran trop lourde (5 Mo maximum).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = String(ev.target?.result || "");
      setScreenshot({
        name: file.name,
        base64: dataUrl,
        mimeType: file.type,
        previewUrl: dataUrl,
      });
      toast.success(`Capture d'écran "${file.name}" prête pour l'analyse Gemma Vision !`);
    };
    reader.readAsDataURL(file);
  };

  const [extractingOcr, setExtractingOcr] = useState(false);

  const handleExtractOcr = async () => {
    if (!screenshot) return;
    setExtractingOcr(true);
    toast.loading("Lecture OCR de la capture d'écran SMS...", { id: "ocr-extract" });

    try {
      let extractedText = "";
      try {
        const extracted = await extractSmsImageApi(screenshot.base64, screenshot.mimeType, lang);
        if (extracted.text) {
          extractedText = extracted.text;
        }
      } catch (apiErr) {
        console.warn("API vision indisponible, basculement vers Tesseract OCR local:", apiErr);
      }

      if (!extractedText) {
        try {
          const localRes = await extractTextWithLocalOcr(screenshot.base64, lang === "en" ? "eng" : "fra");
          if (localRes.text) {
            extractedText = localRes.text;
          }
        } catch (localErr) {
          console.warn("Échec Tesseract local:", localErr);
        }
      }

      toast.dismiss("ocr-extract");
      if (extractedText) {
        setText(extractedText);
        toast.success("Texte du SMS transcrit dans l'éditeur ! Vous pouvez maintenant le relire et le corriger avant analyse.");
      } else {
        toast.info("Aucun texte lisible détecté sur la capture.");
      }
    } catch (err: any) {
      toast.dismiss("ocr-extract");
      toast.error(err.message || "Erreur lors de l'extraction OCR.");
    } finally {
      setExtractingOcr(false);
    }
  };

  const run = async () => {
    const trimmed = text.trim();
    if (!screenshot && trimmed.length < 10) {
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
      const pTimer = setInterval(() => {
        setProgress((prev) => (prev && prev < 85 ? prev + 15 : prev));
      }, 300);

      const res = await analyzeWithGemmaApi(
        trimmed,
        "sms",
        lang,
        [],
        screenshot
          ? {
              checkVirusTotal: vtConsent,
              imageBase64: screenshot.base64,
              imageMimeType: screenshot.mimeType,
            }
          : { checkVirusTotal: vtConsent },
      );
      clearInterval(pTimer);
      setProgress(100);

      const fullSourceText = `${trimmed} ${res.extractedMeta?.transcribedText || ""}`.trim();

      const regexAmounts = Array.from(
        new Set(fullSourceText.match(/\d[\d\s.,]*\s?(?:F\s?CFA|FCFA|XOF|F)\b/gi) ?? []),
      ).map((a) => a.trim());
      const gemmaAmounts = res.extractedMeta?.amounts ?? [];
      const amounts = Array.from(new Set([...gemmaAmounts, ...regexAmounts])).filter(Boolean);

      const regexPhones = Array.from(
        new Set(fullSourceText.match(/(?:\+?228[\s-]?)?\b\d{2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}\b/g) ?? []),
      );
      const gemmaPhones = res.extractedMeta?.phones ?? [];
      const phones = Array.from(new Set([...gemmaPhones, ...regexPhones])).filter(Boolean);

      const links = Array.from(
        new Set(
          fullSourceText.match(
            /\b((?:https?:\/\/|www\.)[^\s<>"']+|[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|net|org|tg|xyz|top|click|live|icu|buzz|info|online|site|ly|co|me|io|gq|tk|ml)(?:\/[^\s<>"']*)?)/gi,
          ) ?? [],
        ),
      );

      const senderMatch = fullSourceText.match(
        /^(?:de|from|tso|exp[ée]diteur|ame\s*si\s*[dɖ]oe)\s*:\s*([^\n—–-]+)/im,
      );
      const resolvedSender =
        res.extractedMeta?.sender ||
        senderMatch?.[1]?.trim() ||
        ( /tmoney|t-money|yas/i.test(fullSourceText)
          ? "T-Money (Mentionné)"
          : /moov|flooz/i.test(fullSourceText)
            ? "Moov Money (Mentionné)"
            : phones[0] || "Expéditeur non certifié" );

      res.extracted = {
        sender: resolvedSender,
        amounts,
        phones,
        links,
      };

      saveAnalysis("SMS", res);
      setResult(res);
      toast.success("Analyse Gemma 4 & vérification de conformité terminées");
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
          <CyberSticker tone="cyan" icon={Sparkles} rotate="none">
            Google Gemma 4 (Texte & Vision)
          </CyberSticker>
          <CyberSticker tone="purple" icon={Globe} rotate="none">
            VirusTotal v3 Actif
          </CyberSticker>
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
            setScreenshot(null);
            setApiError(null);
          }}
          extra={
            <div className="space-y-5">
              <Extracted
                r={result}
                onEditText={(t) => {
                  setText(t);
                  setResult(null);
                  toast.info("Texte transcrit injecté dans l'éditeur. Vous pouvez le corriger et relancer l'analyse.");
                }}
              />
              {result.virusTotal && (
                <VirusTotalCard
                  virusTotal={result.virusTotal}
                  {...(result.gemmaRisk ? { gemmaRisk: result.gemmaRisk } : {})}
                  {...(result.technicalRisk ? { technicalRisk: result.technicalRisk } : {})}
                />
              )}
            </div>
          }
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          <Panel className="lg:col-span-2 space-y-4 border-2 shadow-neo-sm">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="sms" className="text-sm font-black">
                {t("sms.label")} (ou téléversez une capture d'écran)
              </label>
              <span className="text-[11px] font-bold text-primary">
                T-Money · Moov Money · SMS & WhatsApp
              </span>
            </div>

            <Textarea
              id="sms"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={2000}
              rows={7}
              placeholder={t("sms.placeholder")}
              className="resize-none rounded-xl text-base border-2 font-medium"
            />

            {screenshot && (
              <div className="space-y-3 rounded-xl border-2 border-slate-900 bg-[#E0F2FE]/70 p-3.5 animate-rise shadow-neo-sm dark:bg-sky-950/40 dark:border-sky-500/40">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={screenshot.previewUrl}
                      alt="Aperçu capture SMS"
                      className="size-14 shrink-0 rounded-lg object-cover border-2 border-slate-900 shadow-sm"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-black text-foreground truncate">
                        📸 Capture d'écran : {screenshot.name}
                      </div>
                      <p className="text-[11px] text-muted-foreground font-medium">
                        Gemma 4 Vision lira la capture et vérifiera la syntaxe officielle T-Money / Moov Money.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setScreenshot(null)}
                    className="shrink-0 text-destructive hover:text-destructive"
                  >
                    <X className="size-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
                  <span className="text-muted-foreground text-[11px] font-medium">
                    Vérifiez ou complétez le texte avant l'analyse :
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="neo"
                    disabled={extractingOcr}
                    onClick={handleExtractOcr}
                    className="text-xs gap-1.5 h-7 px-3 font-bold"
                  >
                    <FileText className="size-3.5" />
                    {extractingOcr ? "Lecture OCR..." : "Extraire le texte dans l'éditeur"}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-success" />
                {t("sms.warningPin")}
              </span>
              <span>{text.length}/2000</span>
            </div>

            <div className="flex items-start gap-3 rounded-xl border-2 border-border/80 bg-muted/40 p-3.5 text-xs">
              <input
                type="checkbox"
                id="vt-consent"
                checked={vtConsent}
                onChange={(e) => setVtConsent(e.target.checked)}
                className="mt-0.5 size-4 rounded accent-primary cursor-pointer"
              />
              <label htmlFor="vt-consent" className="cursor-pointer space-y-0.5">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Globe className="size-3.5 text-primary" /> Vérification technique des liens avec VirusTotal v3
                </span>
                <span className="block text-muted-foreground text-[11px] leading-relaxed font-medium">
                  {t("sms.privacyDisclosure")}
                </span>
              </label>
            </div>

            {progress !== null && <ProgressBar value={progress} />}

            <div className="flex flex-wrap gap-3">
              <Button variant="hero" size="lg" onClick={run} disabled={progress !== null} className="shadow-neo border-2 border-white/20 font-bold">
                <ScanSearch /> {screenshot ? "Analyser la capture avec Gemma 4" : t("sms.analyzeBtn")}
              </Button>

              <Button
                type="button"
                variant="neo"
                size="lg"
                onClick={() => fileInputRef.current?.click()}
                disabled={progress !== null}
                className="font-bold"
              >
                <ImageUp className="text-primary" /> {t("sms.ocrBtn")} (PNG / JPG)
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(",")}
                className="hidden"
                onChange={(e) => {
                  handleScreenshotSelect(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
            <GemmaStatusBanner />
          </Panel>

          <Panel className="border-2 shadow-neo-sm">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-black text-sm">{t("sms.demoTitle")}</h3>
              <CyberSticker tone="lime" rotate="none">
                Démo Live 3 min
              </CyberSticker>
            </div>
            <p className="mb-4 text-xs text-muted-foreground font-medium">
              {t("sms.demoSubtitle")} Cliquez sur un exemple légitime ou frauduleux :
            </p>
            <div className="space-y-2">
              {demoList.map((d) => (
                <button
                  key={d.label}
                  onClick={() => {
                    setScreenshot(null);
                    setText(d.text);
                  }}
                  className="w-full rounded-xl border-2 border-border/80 bg-muted/40 p-3 text-left transition hover:border-primary/60 hover:bg-accent hover:shadow-neo-sm active:translate-y-0.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-black">{d.label}</div>
                    {d.tag && (
                      <span
                        className={cn(
                          "shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider",
                          d.tag === "legit"
                            ? "bg-success/15 text-success border-success/40"
                            : "bg-destructive/15 text-destructive border-destructive/40",
                        )}
                      >
                        {d.tag === "legit" ? "Légitime" : "Frauduleux"}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 line-clamp-2 text-xs text-muted-foreground font-medium">{d.text}</div>
                </button>
              ))}
            </div>
          </Panel>
        </div>
      )}
    </>
  );
}

function Extracted({
  r,
  onEditText,
}: {
  r: CombinedSmsAnalysisResult;
  onEditText?: (t: string) => void;
}) {
  const { t } = useI18n();
  const meta = r.extractedMeta;
  const conformity = meta?.syntaxConformity || (r.level === "FAIBLE" ? "CONFORME" : r.level === "ÉLEVÉ" ? "NON_CONFORME" : "SUSPECT");
  const operator = meta?.operator || "T-Money / Moov Money";
  const syntaxDetail =
    meta?.syntaxDetail ||
    (conformity === "CONFORME"
      ? "La structure du message (expéditeur officiel, montant, nouveau solde et référence de transaction sans lien externe) respecte les formats officiels T-Money / Moov Money."
      : "Ce message ne respecte pas la syntaxe officielle des notifications T-Money / Moov Money (absence de solde/référence officielle, ou présence d'une demande inhabituelle / lien / numéro privé).");

  const rows = [
    { icon: User, k: t("sms.sender"), v: r.extracted.sender ? [r.extracted.sender] : [] },
    { icon: Banknote, k: t("sms.amounts"), v: r.extracted.amounts },
    { icon: Link2, k: t("sms.links"), v: r.extracted.links },
    { icon: Phone, k: t("sms.phones"), v: r.extracted.phones },
  ];

  return (
    <Panel className="space-y-4 border-2 shadow-neo-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 pb-3">
        <div>
          <h3 className="font-black text-sm sm:text-base flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            {t("sms.extractedTitle")} & Conformité Format Officiel ({operator})
          </h3>
          <p className="text-xs text-muted-foreground font-medium">
            Vérification par Google Gemma 4 de l'expéditeur, du montant et de la syntaxe officielle T-Money / Moov Money
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full border-2 px-3 py-1 text-xs font-black shadow-neo-sm",
            conformity === "CONFORME"
              ? "border-success bg-success/20 text-success"
              : conformity === "NON_CONFORME"
                ? "border-destructive bg-destructive/20 text-destructive"
                : "border-warning bg-warning/20 text-warning-foreground",
          )}
        >
          {conformity === "CONFORME" ? (
            <CheckCircle2 className="size-3.5" />
          ) : conformity === "NON_CONFORME" ? (
            <ShieldAlert className="size-3.5" />
          ) : (
            <AlertTriangle className="size-3.5" />
          )}
          {conformity === "CONFORME"
            ? "FORMAT OFFICIEL CONFORME"
            : conformity === "NON_CONFORME"
              ? "NON CONFORME AU FORMAT OFFICIEL"
              : "SYNTAXE SUSPECTE À VÉRIFIER"}
        </span>
      </div>

      <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-3.5 text-xs leading-relaxed text-foreground">
        <span className="font-black text-primary">Diagnostic syntaxique ({operator}) : </span>
        <span className="font-medium">{syntaxDetail}</span>
      </div>

      {meta?.transcribedText && (
        <div className="rounded-xl border-2 border-slate-900 bg-muted/40 p-3.5 text-xs space-y-2 shadow-neo-sm dark:border-white/30">
          <div className="flex items-center justify-between gap-2">
            <div className="font-black text-foreground flex items-center gap-1.5">
              <FileText className="size-3.5 text-electric" /> Texte extrait de la capture d'écran par Gemma 4 Vision :
            </div>
            {onEditText && (
              <Button
                type="button"
                variant="neo"
                size="sm"
                onClick={() => onEditText(meta.transcribedText!)}
                className="text-[11px] h-7 px-2.5 gap-1 font-bold"
              >
                <Edit className="size-3" /> Corriger dans l'éditeur
              </Button>
            )}
          </div>
          <p className="font-mono text-foreground whitespace-pre-wrap bg-background/70 p-2.5 rounded-lg border-2 border-border/80">{meta.transcribedText}</p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map(({ icon: Icon, k, v }) => (
          <div key={k} className="rounded-xl border-2 border-border/60 bg-muted/60 p-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              <Icon className="size-3.5" /> {k}
            </div>
            <div className="mt-1 break-all text-sm font-semibold">
              {v && v.length ? v.join(", ") : "Aucun"}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
