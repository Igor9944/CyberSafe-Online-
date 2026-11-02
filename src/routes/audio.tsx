import { createFileRoute, Link } from "@tanstack/react-router";
import { AudioLines, Upload, ScanSearch, Sparkles, FileAudio, ShieldCheck } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GemmaStatusBanner, PageHeader, Panel, ProgressBar, ResultView } from "@/components/cs/ui";
import { saveAnalysis } from "@/lib/history";
import { MULTILINGUAL_TRANSCRIPTS } from "@/lib/demo";
import { useI18n } from "@/lib/i18n";
import { analyzeWithGemmaApi, GemmaApiError, type GemmaApiAnalysisResult } from "@/lib/gemma-client";

export const Route = createFileRoute("/audio")({
  head: () => ({
    meta: [
      { title: "Scanner Audio — CyberSafe Online" },
      { name: "description", content: "Analyse des appels suspects par l'IA CyberSafe : faux agents, pressions et demandes de code." },
      { property: "og:title", content: "Scanner Audio — CyberSafe Online" },
      { property: "og:description", content: "Détectez les appels frauduleux Mobile Money avec le moteur IA CyberSafe." },
    ],
  }),
  component: AudioPage,
});

const TYPES = ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/x-m4a", "audio/ogg", "audio/webm"];

function AudioPage() {
  const { t, lang } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GemmaApiAnalysisResult | null>(null);
  const [apiError, setApiError] = useState<{ message: string; quota: boolean } | null>(null);

  const demoTranscript = MULTILINGUAL_TRANSCRIPTS[lang] || MULTILINGUAL_TRANSCRIPTS.fr;

  const onFile = (f?: File) => {
    if (!f) return;
    if (!TYPES.includes(f.type)) return toast.error("Format non pris en charge (MP3, WAV, M4A, OGG).");
    if (f.size > 20 * 1024 * 1024) return toast.error("Fichier trop lourd (20 Mo maximum).");
    setFile(f);
    toast.info(t("audio.sttNotice"));
  };

  const run = async () => {
    const trimmed = text.trim();
    if (trimmed.length < 15) return toast.error(t("audio.placeholder"));

    setLoading(true);
    setApiError(null);

    try {
      const res = await analyzeWithGemmaApi(trimmed, "audio", lang);
      saveAnalysis("Audio", res);
      setTranscript(trimmed);
      setResult(res);
      toast.success("Analyse de l'appel par l'IA CyberSafe réussie");
    } catch (err: any) {
      console.error(err);
      const isQuota = err instanceof GemmaApiError ? err.quotaExceeded : false;
      const msg = err.message || "Erreur lors de l'analyse avec l'IA CyberSafe.";
      setApiError({ message: msg, quota: isQuota });
      toast.error(isQuota ? "Quota API IA CyberSafe dépassé" : "Erreur IA CyberSafe");
    } finally {
      setLoading(false);
    }
  };

  if (result)
    return (
      <>
        <PageHeader
          icon={AudioLines}
          title={t("audio.resultTitle")}
          subtitle={t("audio.resultSubtitle")}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" /> IA CyberSafe Active
          </span>
        </PageHeader>
        <ResultView
          result={result}
          onReset={() => {
            setResult(null);
            setText("");
            setFile(null);
            setApiError(null);
          }}
          extra={
            <Panel>
              <h3 className="mb-2 font-semibold">{t("audio.analyzedTranscript")}</h3>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{transcript}</p>
            </Panel>
          }
        />
      </>
    );

  return (
    <>
      <PageHeader
        icon={AudioLines}
        title={t("audio.title")}
        subtitle={t("audio.subtitle")}
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" /> IA CyberSafe Connectée
          </span>
          <Button asChild variant="outline">
            <Link to="/guide">{t("audio.guideBtn")}</Link>
          </Button>
        </div>
      </PageHeader>

      {apiError && (
        <div className="mb-6">
          <GemmaStatusBanner error={apiError.message} quotaExceeded={apiError.quota} />
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel className="space-y-4">
          <h3 className="font-semibold">{t("audio.fileSection")}</h3>
          <button
            onClick={() => input.current?.click()}
            className="flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-primary/30 bg-accent/40 p-5 text-left transition hover:border-primary"
          >
            <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-electric text-primary-foreground">
              <Upload className="size-5" />
            </div>
            <div>
              <div className="font-semibold">
                {file ? file.name : t("audio.chooseFile")}
              </div>
              <div className="text-xs text-muted-foreground">
                {file ? `${(file.size / 1024 / 1024).toFixed(1)} Mo` : t("audio.fileHint")}
              </div>
            </div>
          </button>
          <input
            ref={input}
            type="file"
            accept={TYPES.join(",")}
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          {file && <audio controls src={URL.createObjectURL(file)} className="w-full" />}
          <div className="flex items-start gap-2 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
            <FileAudio className="mt-0.5 size-4 shrink-0" />
            {t("audio.sttNotice")}
          </div>
        </Panel>

        <Panel className="space-y-4">
          <h3 className="font-semibold">{t("audio.transcriptSection")}</h3>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={7}
            maxLength={4000}
            placeholder={t("audio.placeholder")}
            className="resize-none rounded-xl"
          />
          {loading && (
            <div className="py-2">
              <ProgressBar value={80} />
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <Button variant="hero" size="lg" onClick={run} disabled={loading}>
              <ScanSearch /> {t("audio.analyzeBtn")} (IA CyberSafe)
            </Button>
            <Button variant="outline" onClick={() => setText(demoTranscript)}>
              <Sparkles /> {t("audio.demoBtn")}
            </Button>
          </div>
        </Panel>
      </div>
      <div className="mt-5 space-y-3">
        <GemmaStatusBanner />
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 text-success" />
          {t("audio.privacyNotice")}
        </p>
      </div>
    </>
  );
}
