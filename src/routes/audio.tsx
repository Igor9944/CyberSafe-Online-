import { createFileRoute } from "@tanstack/react-router";
import {
  AudioLines,
  Upload,
  Mic,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Volume2,
  VolumeX,
  FileAudio,
  Square,
  ScanSearch,
  AlertTriangle,
} from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GemmaStatusBanner, PageHeader, Panel, ProgressBar, ResultView } from "@/components/cs/ui";
import { CyberSticker } from "@/components/cs/CyberDecorations";
import { saveAnalysis } from "@/lib/history";
import { DEMO_AUDIO_SCENARIOS, type DemoAudioScenario } from "@/lib/demo";
import { useI18n } from "@/lib/i18n";
import {
  analyzeWithGemmaApi,
  GemmaApiError,
  type GemmaApiAnalysisResult,
} from "@/lib/gemma-client";

export const Route = createFileRoute("/audio")({
  head: () => ({
    meta: [
      { title: "Scanner Audio — CyberSafe Online" },
      {
        name: "description",
        content:
          "Enregistrez ou importez un extrait d'appel téléphonique frauduleux pour le faire analyser par Google Gemma 4 au Togo.",
      },
      { property: "og:title", content: "Scanner Audio — CyberSafe Online" },
      {
        property: "og:description",
        content:
          "Détection des arnaques aux faux agents Moov Money / T-Money et ingénierie sociale.",
      },
    ],
  }),
  component: AudioPage,
});

const TYPES = ["audio/mpeg", "audio/wav", "audio/mp4", "audio/ogg", "audio/webm", "audio/x-m4a"];

function AudioPage() {
  const { t, lang } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GemmaApiAnalysisResult | null>(null);
  const [apiError, setApiError] = useState<{ message: string; quota: boolean } | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recognizerRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognizerRef.current) {
        try {
          recognizerRef.current.stop();
        } catch {}
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const onFile = (f?: File) => {
    if (!f) return;
    if (!TYPES.includes(f.type)) {
      toast.error("Format non pris en charge (MP3, WAV, M4A, OGG, WEBM).");
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (20 Mo maximum).");
      return;
    }
    setFile(f);
    setAudioUrl(URL.createObjectURL(f));
    toast.info("Audio chargé. Vous pouvez ajuster ou compléter la transcription avant l'analyse.");
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mr.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognizer = new SpeechRecognition();
          recognizerRef.current = recognizer;
          recognizer.lang = lang === "ee" ? "fr-TG" : lang === "en" ? "en-US" : "fr-FR";
          recognizer.continuous = true;
          recognizer.interimResults = true;

          recognizer.onresult = (event: any) => {
            let current = "";
            for (let i = 0; i < event.results.length; i++) {
              current += event.results[i][0].transcript + " ";
            }
            setText(current.trim());
          };

          recognizer.onerror = (e: any) => {
            console.warn("SpeechRecognition error:", e);
          };

          recognizer.start();
        } catch (e) {
          console.warn("SpeechRecognition init failed:", e);
        }
      }

      toast.info("Enregistrement en direct activé. Parlez ou lisez le scénario...");
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'accéder au microphone.");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (recognizerRef.current) {
      try {
        recognizerRef.current.stop();
      } catch {}
      recognizerRef.current = null;
    }
    setIsRecording(false);
    toast.success("Enregistrement audio terminé !");
  };

  const speakText = (dialogueText: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.info("La synthèse vocale n'est pas supportée sur ce navigateur.");
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(dialogueText);
    utterance.lang = lang === "en" ? "en-US" : "fr-FR";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
    toast.info("Lecture audio du dialogue en cours...");
  };

  const selectScenario = (item: DemoAudioScenario) => {
    setText(item.transcript);
    setAudioUrl(null);
    setFile(null);
    speakText(item.transcript);
  };

  const runAnalysis = async () => {
    const trimmed = text.trim();
    if (trimmed.length < 15) {
      toast.error(
        "Le texte retranscrit est trop court pour une analyse fiable (minimum 15 caractères).",
      );
      return;
    }

    setApiError(null);
    setLoading(true);
    toast.loading("Gemma 4 analyse les techniques d'ingénierie sociale...", {
      id: "audio-analysis",
    });

    try {
      const res = await analyzeWithGemmaApi(trimmed, "audio", lang);
      toast.dismiss("audio-analysis");

      saveAnalysis("Audio", res);
      setTranscript(trimmed);
      setResult(res);
      toast.success("Analyse de l'appel terminée par Google Gemma 4 !");
    } catch (err: any) {
      toast.dismiss("audio-analysis");
      console.error(err);
      const isQuota = err instanceof GemmaApiError ? err.quotaExceeded : false;
      const msg = err.message || "Erreur lors de l'analyse avec l'IA CyberSafe.";
      setApiError({ message: msg, quota: isQuota });
      toast.error(isQuota ? "Capacité d'analyse maximale atteinte" : "Erreur d'analyse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader icon={AudioLines} title={t("audio.title")} subtitle={t("audio.subtitle")}>
        <div className="flex flex-wrap items-center gap-2">
          <CyberSticker tone="rose" icon={AudioLines} rotate="none">
            Anti-Vishing Vocal
          </CyberSticker>
          <CyberSticker tone="cyan" icon={Sparkles} rotate="none">
            Gemma 4 Audio Cognitive
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
            setTranscript("");
            setAudioUrl(null);
            setFile(null);
            setApiError(null);
          }}
          extra={
            <Panel className="space-y-4 border-2 shadow-neo-sm">
              <div className="flex items-center justify-between border-b-2 pb-3">
                <h3 className="font-black text-sm sm:text-base flex items-center gap-2">
                  <FileAudio className="size-4 text-primary" />
                  Transcription intégrale de l'appel suspect
                </h3>
                <CyberSticker tone="lime" rotate="none">
                  Transcription Validée
                </CyberSticker>
              </div>
              <div className="rounded-xl border-2 border-border/80 bg-muted/40 p-4">
                <p className="whitespace-pre-wrap font-mono text-xs sm:text-sm text-foreground leading-relaxed font-semibold">
                  {transcript}
                </p>
              </div>
            </Panel>
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel className="space-y-4 border-2 shadow-neo-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm flex items-center gap-2">
                  <AudioLines className="size-4 text-primary" /> 1. Source Audio de l'Appel
                </h3>
                <span className="text-xs text-muted-foreground font-bold">Direct ou Fichier</span>
              </div>

              <div className="rounded-2xl border-2 border-border/80 bg-accent/20 p-4 shadow-neo-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`grid size-11 place-items-center rounded-xl border-2 border-foreground transition ${
                        isRecording
                          ? "bg-destructive text-destructive-foreground animate-pulse shadow-neo-sm"
                          : "bg-primary text-primary-foreground shadow-neo-sm"
                      }`}
                    >
                      <Mic className="size-5" />
                    </div>
                    <div>
                      <div className="text-sm font-black">
                        {isRecording ? "Enregistrement en cours..." : "Enregistrer un appel"}
                      </div>
                      <div className="text-xs text-muted-foreground font-medium">
                        {isRecording
                          ? `Durée : ${Math.floor(recordingSeconds / 60)
                              .toString()
                              .padStart(2, "0")}:${(recordingSeconds % 60)
                              .toString()
                              .padStart(2, "0")}`
                          : "Simulez votre appel avec le micro"}
                      </div>
                    </div>
                  </div>

                  {isRecording ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={stopRecording}
                      className="border-2 font-bold shadow-neo-sm"
                    >
                      <Square className="size-3.5 fill-current" /> Terminer
                    </Button>
                  ) : (
                    <Button
                      variant="hero"
                      size="sm"
                      onClick={startRecording}
                      className="border-2 border-white/20 font-bold shadow-neo-sm"
                    >
                      <Mic className="size-3.5" /> Démarrer
                    </Button>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-primary/40 bg-accent/30 p-4 text-left transition hover:border-primary hover:bg-accent/60 cursor-pointer"
              >
                <div className="grid size-10 shrink-0 place-items-center rounded-xl border-2 border-foreground/70 bg-electric text-primary-foreground shadow-neo-sm">
                  <Upload className="size-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs sm:text-sm font-black">
                    {file ? file.name : "Importer un enregistrement (MP3, WAV, M4A)"}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-medium">
                    {file
                      ? `${(file.size / 1024 / 1024).toFixed(1)} Mo`
                      : "Fichiers audio jusqu'à 20 Mo"}
                  </div>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={TYPES.join(",")}
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0])}
              />

              {audioUrl && (
                <div className="space-y-2 rounded-xl bg-muted/50 p-3 border-2 border-border/70">
                  <div className="text-xs font-bold text-muted-foreground">
                    Lecteur de l'appel :
                  </div>
                  <audio controls src={audioUrl} className="w-full h-8" />
                </div>
              )}

              <div className="flex items-start gap-2 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground font-medium">
                <FileAudio className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  L'audio est traité localement pour préserver la confidentialité. La transcription
                  est envoyée à Gemma 4 pour analyse sémantique.
                </span>
              </div>

              <div className="flex items-start gap-2 rounded-xl border-2 border-primary/20 bg-primary/5 p-3 text-[11px] text-muted-foreground font-medium">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
                <span>
                  <strong>Précision sur la langue Éwé :</strong> Le moteur Web Speech API du
                  navigateur supporte le français (`fr-TG`) et l'anglais. Pour l'Éwé (`Eʋegbe`),
                  nous recommandons les scénarios de démonstration ci-dessous ou la saisie/retouche
                  manuelle, les navigateurs n'intégrant pas encore de modèle ASR natif pour l'Éwé.
                </span>
              </div>
            </Panel>

            <Panel className="space-y-4 border-2 shadow-neo-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm flex items-center gap-2">
                  <Sparkles className="size-4 text-electric" /> 2. Transcription du Dialogue
                </h3>
                {text && (
                  <Button
                    variant="neo"
                    size="sm"
                    onClick={() => speakText(text)}
                    className="h-7 text-xs font-bold"
                  >
                    {isPlayingAudio ? (
                      <>
                        <VolumeX className="size-3 text-destructive" /> Stop
                      </>
                    ) : (
                      <>
                        <Volume2 className="size-3 text-primary" /> Simuler la voix
                      </>
                    )}
                  </Button>
                )}
              </div>

              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={7}
                maxLength={4000}
                placeholder="Entrez ou ajustez les propos tenus par l'interlocuteur suspect (ex: « Bonjour, je suis agent Moov Money, tapez *155*4*1# et donnez votre PIN... »)"
                className="resize-none rounded-xl font-mono text-xs leading-relaxed border-2 font-medium"
              />

              {loading && (
                <div className="space-y-2 py-1">
                  <div className="flex justify-between text-xs font-bold text-muted-foreground">
                    <span>Analyse cognitive par Gemma 4 en cours...</span>
                    <span>80%</span>
                  </div>
                  <ProgressBar value={80} />
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="hero"
                  size="lg"
                  onClick={runAnalysis}
                  disabled={loading || text.trim().length < 15}
                  className="flex-1 shadow-neo border-2 border-white/20 font-bold"
                >
                  <ScanSearch className="size-4" /> Analyser avec Gemma 4
                </Button>
                {text && (
                  <Button
                    variant="neo"
                    size="lg"
                    onClick={() => setText("")}
                    className="shrink-0 font-bold"
                  >
                    <RotateCcw className="size-4" /> Effacer
                  </Button>
                )}
              </div>
            </Panel>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black flex items-center gap-2">
                <Sparkles className="size-4 text-electric" />
                Scénarios d'appels réels au Togo (Prêts à tester en 1 clic) :
              </h3>
              <span className="text-xs text-muted-foreground font-bold">Testez instantanément</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {DEMO_AUDIO_SCENARIOS.map((item) => {
                const isScam = item.tag === "scam";
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectScenario(item)}
                    className="flex flex-col text-left rounded-xl border-2 border-border/80 bg-card p-3.5 transition hover:border-primary/60 hover:shadow-neo-sm hover:-translate-y-0.5 cursor-pointer active:translate-y-0.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-xs text-foreground truncate">
                        {item.title}
                      </span>
                      <CyberSticker tone={isScam ? "rose" : "lime"} rotate="none">
                        {isScam ? "ARNAQUE" : "LÉGITIME"}
                      </CyberSticker>
                    </div>
                    <div className="mt-1 text-[11px] font-mono text-muted-foreground font-bold">
                      Appelant : {item.caller}
                    </div>
                    <p className="mt-1.5 text-xs text-foreground/85 line-clamp-2 leading-snug font-medium">
                      "{item.transcript}"
                    </p>
                    <div className="mt-2 text-[11px] text-muted-foreground italic line-clamp-1 border-t border-border/40 pt-1.5">
                      {item.notes}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <GemmaStatusBanner />
            <p className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <ShieldCheck className="size-4 text-success shrink-0" />
              Données strictement anonymisées conformément aux règles de la compétition et aux
              directives de l'ANCy.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
