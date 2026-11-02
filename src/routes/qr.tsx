import { createFileRoute } from "@tanstack/react-router";
import { QrCode, Upload, Link2, FileText, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import jsQR from "jsqr";
import { Button } from "@/components/ui/button";
import { GemmaStatusBanner, PageHeader, Panel, ProgressBar, ResultView } from "@/components/cs/ui";
import { saveAnalysis } from "@/lib/history";
import { DEMO_QR_CONTENT } from "@/lib/demo";
import { useI18n } from "@/lib/i18n";
import { analyzeWithGemmaApi, GemmaApiError, type GemmaApiAnalysisResult } from "@/lib/gemma-client";

export const Route = createFileRoute("/qr")({
  head: () => ({
    meta: [
      { title: "Scanner QR Code — CyberSafe Online" },
      { name: "description", content: "Décodez et analysez un QR Code avec l'IA CyberSafe sans ouvrir les liens piégés." },
      { property: "og:title", content: "Scanner QR Code — CyberSafe Online" },
      { property: "og:description", content: "Détection des domaines piégés et phishing QR Code au Togo." },
    ],
  }),
  component: QrPage,
});

const MAX = 5 * 1024 * 1024;
const TYPES = ["image/png", "image/jpeg", "image/webp"];

function decode(file: File): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = img.width * scale;
      c.height = img.height * scale;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const data = ctx.getImageData(0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(jsQR(data.data, c.width, c.height)?.data ?? null);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("bad image"));
    };
    img.src = url;
  });
}

function QrPage() {
  const { t, lang } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [content, setContent] = useState("");
  const [result, setResult] = useState<GemmaApiAnalysisResult | null>(null);
  const [apiError, setApiError] = useState<{ message: string; quota: boolean } | null>(null);

  const finish = async (c: string) => {
    setContent(c);
    setApiError(null);
    setBusy(true);

    try {
      const res = await analyzeWithGemmaApi(c, "qr", lang);
      const detectedLink = c.startsWith("http") ? [c] : [];
      res.extracted = {
        amounts: [],
        phones: [],
        links: detectedLink,
      };

      saveAnalysis("QR", res);
      setResult(res);
      toast.success("Analyse IA terminée avec succès");
    } catch (err: any) {
      console.error(err);
      const isQuota = err instanceof GemmaApiError ? err.quotaExceeded : false;
      const msg = err.message || "Erreur de communication avec l'IA.";
      setApiError({ message: msg, quota: isQuota });
      toast.error(isQuota ? "Capacité d'analyse maximale atteinte" : "Erreur d'analyse");
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (f?: File) => {
    if (!f) return;
    if (!TYPES.includes(f.type)) return toast.error(t("qr.formatError"));
    if (f.size > MAX) return toast.error(t("qr.sizeError"));
    setBusy(true);
    try {
      const c = await decode(f);
      if (!c) {
        toast.error(t("qr.noQrFound"));
        setBusy(false);
      } else {
        toast.success(t("qr.decoded"));
        await finish(c);
      }
    } catch {
      toast.error(t("qr.noQrFound"));
      setBusy(false);
    } finally {
      if (input.current) input.current.value = "";
    }
  };

  return (
    <>
      <PageHeader
        icon={QrCode}
        title={t("qr.title")}
        subtitle={t("qr.subtitle")}
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="size-3.5 text-electric" /> IA CyberSafe Connectée
        </span>
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
            setContent("");
            setApiError(null);
          }}
          extra={
            <Panel>
              <h3 className="mb-3 font-semibold">{t("qr.analyzedTitle")}</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-muted/60 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <FileText className="size-3.5" /> {t("qr.contentExtracted")}
                  </div>
                  <code className="mt-1 block break-all text-sm font-mono">{content}</code>
                </div>
                <div className="rounded-xl bg-muted/60 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Link2 className="size-3.5" /> {t("qr.urlDetected")}
                  </div>
                  <code className="mt-1 block break-all text-sm font-mono">
                    {result.extracted.links[0] ?? content}
                  </code>
                </div>
              </div>
            </Panel>
          }
        />
      ) : (
        <Panel>
          <button
            onClick={() => input.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFile(e.dataTransfer.files[0]);
            }}
            className="flex w-full flex-col items-center rounded-2xl border-2 border-dashed border-primary/30 bg-accent/40 px-6 py-14 text-center transition hover:border-primary hover:bg-accent"
          >
            <div className="grid size-16 place-items-center rounded-2xl bg-electric text-primary-foreground shadow-glow">
              <Upload className="size-7" />
            </div>
            <div className="mt-4 text-lg font-bold">{t("qr.dropzone")}</div>
            <div className="text-sm text-muted-foreground">{t("qr.dropzoneHint")}</div>
          </button>
          <input
            ref={input}
            type="file"
            accept={TYPES.join(",")}
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          {busy && (
            <div className="mt-4">
              <ProgressBar value={70} />
            </div>
          )}
          <div className="mt-5 flex justify-center">
            <Button variant="outline" onClick={() => finish(DEMO_QR_CONTENT)}>
              <Sparkles /> {t("qr.demoTitle")} (IA Démo)
            </Button>
          </div>
          <div className="mt-4">
            <GemmaStatusBanner />
          </div>
        </Panel>
      )}
    </>
  );
}
