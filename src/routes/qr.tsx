import { createFileRoute } from "@tanstack/react-router";
import {
  QrCode,
  Camera,
  Upload,
  Link2,
  FileText,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Square,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import jsQR from "jsqr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  GemmaStatusBanner,
  PageHeader,
  Panel,
  ProgressBar,
  ResultView,
} from "@/components/cs/ui";
import { VirusTotalCard } from "@/components/cs/VirusTotalCard";
import { CyberSticker } from "@/components/cs/CyberDecorations";
import { saveAnalysis } from "@/lib/history";
import { DEMO_QR_ITEMS, type DemoQrItem } from "@/lib/demo";
import { useI18n } from "@/lib/i18n";
import {
  analyzeWithGemmaApi,
  GemmaApiError,
  type CombinedSmsAnalysisResult,
} from "@/lib/gemma-client";

export const Route = createFileRoute("/qr")({
  head: () => ({
    meta: [
      { title: "Scanner QR Code — CyberSafe Online" },
      {
        name: "description",
        content:
          "Décodez et analysez un QR Code Mobile Money avec l'IA CyberSafe sans ouvrir les liens piégés.",
      },
      { property: "og:title", content: "Scanner QR Code — CyberSafe Online" },
      {
        property: "og:description",
        content:
          "Détection des domaines piégés, faux QR marchands et phishing QR Code au Togo.",
      },
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
      reject(new Error("Image illisible"));
    };
    img.src = url;
  });
}

function QrPage() {
  const { t, lang } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [busy, setBusy] = useState(false);
  const [content, setContent] = useState("");
  const [manualText, setManualText] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<CombinedSmsAnalysisResult | null>(null);
  const [apiError, setApiError] = useState<{ message: string; quota: boolean } | null>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "manual">("upload");
  const [cameraPermission, setCameraPermission] = useState<"granted" | "denied" | "prompt">("prompt");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<"idle" | "active" | "denied">("idle");
  const [detectedQr, setDetectedQr] = useState<string | null>(null);
  const [qrScanned, setQrScanned] = useState(false);
  const scanFrame = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const finish = async (c: string, imageSrc?: string) => {
    const cleanContent = c.trim();
    if (!cleanContent) {
      toast.error("Veuillez fournir un contenu QR Code à analyser.");
      return;
    }

    setContent(cleanContent);
    if (imageSrc) {
      setPreviewUrl(imageSrc);
    }
    setApiError(null);
    setBusy(true);

    try {
      const isUrl =
        /^https?:\/\//i.test(cleanContent) ||
        /[a-z0-9-]+\.(com|org|net|tg|top|xyz|link|io|info|biz|site|online)/i.test(cleanContent);
      const res = await analyzeWithGemmaApi(cleanContent, "qr", lang, [], {
        checkVirusTotal: isUrl,
      });
      const detectedLink =
        cleanContent.startsWith("http://") || cleanContent.startsWith("https://")
          ? [cleanContent]
          : [];

      res.extracted = {
        amounts: res.extracted?.amounts || [],
        phones: res.extracted?.phones || [],
        links: res.extracted?.links?.length ? res.extracted.links : detectedLink,
      };

      saveAnalysis("QR", res);
      setResult(res);
      toast.success("Analyse QR Code terminée avec succès par l'IA CyberSafe !");
    } catch (err: any) {
      console.error(err);
      const isQuota = err instanceof GemmaApiError ? err.quotaExceeded : false;
      const msg = err.message || "Erreur lors de l'analyse avec l'IA CyberSafe.";
      setApiError({ message: msg, quota: isQuota });
      toast.error(isQuota ? "Capacité d'analyse maximale atteinte" : "Erreur d'analyse");
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (f?: File) => {
    if (!f) return;
    if (!TYPES.includes(f.type)) {
      toast.error("Format d'image non supporté (PNG, JPG, WEBP).");
      return;
    }
    if (f.size > MAX) {
      toast.error(t("qr.tooLarge"));
      return;
    }

    const objectUrl = URL.createObjectURL(f);
    setPreviewUrl(objectUrl);
    setBusy(true);
    toast.loading("Décodage du QR Code...", { id: "qr-decode" });

    try {
      const text = await decode(f);
      toast.dismiss("qr-decode");
      if (!text) {
        toast.error(t("qr.notDetected"));
        setBusy(false);
        return;
      }
      toast.success("QR Code décodé avec succès !");
      await finish(text, objectUrl);
    } catch (e: any) {
      toast.dismiss("qr-decode");
      toast.error(e?.message || t("qr.readError"));
      setBusy(false);
    }
  };

  const handleDemoSelect = (item: DemoQrItem) => {
    setPreviewUrl(null);
    setManualText(item.content);
    finish(item.content);
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
      setCameraPermission("granted");
      setDetectedQr(null);
      setQrScanned(false);
      startContinuousScan();
      toast.success(t("qr.cameraPermission"));
    } catch (err: any) {
      console.error("Camera permission error:", err);
      setCameraPermission("denied");
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        toast.error(t("qr.cameraDenied"));
      } else {
        toast.error(t("qr.cameraError"));
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    if (scanFrame.current) {
      cancelAnimationFrame(scanFrame.current);
      scanFrame.current = 0;
    }
    setDetectedQr(null);
    setQrScanned(false);
    toast.info(t("qr.cameraStopped"));
  };

  const startContinuousScan = () => {
    if (!videoRef.current) return;

    // Préparer un canvas réutilisable (créé une seule fois)
    const scanCanvas = document.createElement("canvas");
    const scanCtx = scanCanvas.getContext("2d");

    // Limite le scan à 10fps (100ms) au lieu de 60fps
    const MIN_SCAN_INTERVAL = 100;
    let lastScanTime = 0;

    const loop = async () => {
      if (!isCameraActive || cameraPermission !== "granted") return;

      const video = videoRef.current;
      if (!video || !video.readyState) return;

      // Mise à jour du temps pour limiter la fréquence de scan
      const now = performance.now();
      if (now - lastScanTime < MIN_SCAN_INTERVAL) {
        scanFrame.current = window.requestAnimationFrame(loop);
        return;
      }
      lastScanTime = now;

      // Downscale la vidéo pour la détection (640x480 au lieu du max 1920x1080)
      const targetWidth = 640;
      const targetHeight = 480;
      if (scanCanvas.width !== targetWidth || scanCanvas.height !== targetHeight) {
        scanCanvas.width = targetWidth;
        scanCanvas.height = targetHeight;
      }
      if (!scanCtx) return;

      // Redimensionner et dessiner
      const scaleX = targetWidth / video.videoWidth;
      const scaleY = targetHeight / video.videoHeight;
      scanCtx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight, 0, 0, targetWidth, targetHeight);

      const imageData = scanCtx.getImageData(0, 0, targetWidth, targetHeight);

      const qrCode = jsQR(imageData.data, targetWidth, targetHeight);
      if (qrCode && qrCode.data) {
        const content = qrCode.data.trim();
        if (content && content !== detectedQr) {
          setDetectedQr(content);
          setQrScanned(true);
          if (!busy) {
            captureAndUploadQrFrame(video, scanCanvas, content);
          }
        }
      }

      scanFrame.current = window.requestAnimationFrame(loop);
    };

    scanFrame.current = window.requestAnimationFrame(loop);
  };

  const captureAndUploadQrFrame = async (video: HTMLVideoElement, canvas: HTMLCanvasElement, content: string) => {
    try {
      // Capture la frame actuelle sur le canvas
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convertir le canvas en blob PNG
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b as Blob), "image/png");
      });

      // Créer un File à partir du blob
      const file = new File([blob], "qr-scanner-capture.png", { type: "image/png" });

      // Réinitialiser le scan et arrêter la caméra
      setDetectedQr(null);
      setQrScanned(false);
      setIsCameraActive(false);
      if (scanFrame.current) {
        cancelAnimationFrame(scanFrame.current);
        scanFrame.current = 0;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      // Uploader le fichier comme si l'utilisateur l'avait pris
      await onFile(file);

      // Réactiver la détection manuelle via la touche espace ou le bouton
      toast.success(t("qr.capturedAndUploaded"));
    } catch (err: any) {
      console.error("Capturing QR frame failed:", err);
      toast.error(t("qr.captureError"));
    }
  };

  return (
    <>
      <PageHeader
        icon={QrCode}
        title={t("qr.title")}
        subtitle={t("qr.subtitle")}
      >
        <div className="flex flex-wrap items-center gap-2">
          <CyberSticker tone="yellow" icon={QrCode} rotate="none">
            Anti-Quishing Togo
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
            setContent("");
            setManualText("");
            setPreviewUrl(null);
            setApiError(null);
          }}
          extra={
            <div className="space-y-5">
              <Panel className="space-y-4 border-2 shadow-neo-sm">
                <div className="flex items-center justify-between border-b-2 pb-3">
                  <h3 className="font-black text-sm sm:text-base flex items-center gap-2">
                    <Link2 className="size-4 text-primary" />
                    Contenu brut déchiffré du QR Code
                  </h3>
                  <CyberSticker tone="lime" rotate="none">
                    Déchiffrement Sandbox
                  </CyberSticker>
                </div>
                <div className="rounded-xl border-2 border-border/80 bg-muted/60 p-4 font-mono text-xs sm:text-sm break-all font-semibold">
                  {content}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <ShieldCheck className="size-4 text-success" />
                  <span>
                    Ce QR Code a été analysé en bac à sable sécurisé sans navigation web directe.
                  </span>
                </div>
              </Panel>

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
        <div className="space-y-6">
          <div className="flex gap-2 border-b-2 border-border/70 pb-3">
            <button
              onClick={() => setActiveTab("upload")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition cursor-pointer ${
                activeTab === "upload"
                  ? "border-2 border-foreground bg-primary text-primary-foreground shadow-neo-sm"
                  : "border-2 border-transparent bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              <Upload className="size-4" /> Importer une image QR
            </button>
            <button
              onClick={() => setActiveTab("manual")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition cursor-pointer ${
                activeTab === "manual"
                  ? "border-2 border-foreground bg-primary text-primary-foreground shadow-neo-sm"
                  : "border-2 border-transparent bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              <FileText className="size-4" /> Saisie manuelle d'URL / Décodé
            </button>
          </div>

          {activeTab === "upload" ? (
            <Panel className="space-y-4 border-2 shadow-neo-sm">
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="hero"
                  disabled={busy}
                  onClick={() => {
                    if (cameraPermission === "prompt") requestCameraPermission();
                    else cameraInputRef.current?.click();
                  }}
                  className="border-2 border-white/20 font-bold shadow-neo"
                >
                  <Camera className="size-4" />
                  {t("qr.takePhoto")}
                </Button>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept={TYPES.join(",")}
                  capture="environment"
                  className="hidden"
                  aria-label={t("qr.takePhoto")}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    void onFile(file);
                  }}
                />
                {isCameraActive && cameraPermission === "granted" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={stopCamera}
                    className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                  >
                    <Square className="size-4 fill-current" />
                    {t("qr.stopCamera")}
                  </Button>
                )}
              </div>
              
              {/* Aperçu en direct de la caméra */}
              {isCameraActive && (
                <div className="relative rounded-xl border-2 border-primary/40 bg-black p-3 overflow-hidden">
                  <video
                    ref={videoRef}
                    className="size-full object-cover"
                    muted
                    playsInline
                    style={{ height: 200 }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-2 w-32 h-32">
                      <div className="border-b border-white/50" />
                      <div className="border-r border-white/50" />
                      <div className="border-b border-white/50" />
                      <div className="border-r border-white/50" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 flex justify-center">
                    <span className="bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                      {t("qr.livePreview")}
                    </span>
                  </div>
                  {cameraPermission === "denied" && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <p className="text-white text-sm text-center p-4">
                        {t("qr.cameraDenied")}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              <button
                type="button"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  onFile(e.dataTransfer.files[0]);
                }}
                className="group flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/40 bg-accent/30 px-6 py-12 text-center transition hover:border-primary hover:bg-accent/60 cursor-pointer"
              >
                {previewUrl ? (
                  <div className="space-y-3">
                    <div className="mx-auto size-28 overflow-hidden rounded-xl border-2 border-foreground bg-white p-2 shadow-neo-sm">
                      <img
                        src={previewUrl}
                        alt="QR Code Preview"
                        className="size-full object-contain"
                      />
                    </div>
                    <div className="text-xs font-bold text-primary flex items-center justify-center gap-1.5">
                      <RefreshCw className="size-3.5 animate-spin text-electric" /> Décodage et analyse en cours...
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid size-16 place-items-center rounded-2xl border-2 border-foreground/80 bg-electric text-primary-foreground shadow-neo group-hover:scale-105 transition-transform">
                      <Upload className="size-7 stroke-[2.2]" />
                    </div>
                    <div className="mt-4 text-base sm:text-lg font-black tracking-tight">
                      {t("qr.dropzone")}
                    </div>
                    <div className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-sm font-medium">
                      Glissez votre capture d'écran de QR Code ou cliquez pour parcourir (PNG, JPG, WEBP jusqu'à 5 Mo).
                    </div>
                  </>
                )}
              </button>
              <input
                ref={inputRef}
                type="file"
                accept={TYPES.join(",")}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  void onFile(file);
                }}
              />

              {busy && (
                <div className="space-y-2 py-2">
                  <div className="flex justify-between text-xs font-bold text-muted-foreground">
                    <span>Inspection sécurisée par Gemma 4 & VirusTotal...</span>
                    <span>75%</span>
                  </div>
                  <ProgressBar value={75} />
                </div>
              )}
            </Panel>
          ) : (
            <Panel className="space-y-4 border-2 shadow-neo-sm">
              <label className="block text-sm font-black">
                Contenu du QR Code à analyser :
              </label>
              <div className="flex gap-2">
                <Input
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Ex : http://tmoney-gift.top/claim ou TMONEY:PAY:..."
                  className="rounded-xl font-mono text-sm border-2 font-medium"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") finish(manualText);
                  }}
                />
                <Button
                  variant="hero"
                  disabled={busy || !manualText.trim()}
                  onClick={() => finish(manualText)}
                  className="shadow-neo border-2 border-white/20 font-bold"
                >
                  <ArrowRight className="size-4" /> Analyser
                </Button>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Collez l'URL ou le texte brut issu d'un lecteur QR pour une analyse instantanée sans ouvrir le navigateur.
              </p>
            </Panel>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black flex items-center gap-2">
                <Sparkles className="size-4 text-electric" />
                Exemples de démonstration rapide (1 clic) :
              </h3>
              <span className="text-xs text-muted-foreground font-medium">
                Cas réels T-Money & Moov Money Togo
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {DEMO_QR_ITEMS.map((item, idx) => {
                const isScam = item.tag === "scam";
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleDemoSelect(item)}
                    disabled={busy}
                    className="flex flex-col text-left rounded-xl border-2 border-border/80 bg-card p-3.5 transition hover:border-primary/60 hover:shadow-neo-sm hover:-translate-y-0.5 cursor-pointer active:translate-y-0.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-xs sm:text-sm text-foreground">
                        {item.label}
                      </span>
                      <CyberSticker tone={isScam ? "rose" : "lime"} rotate="none">
                        {isScam ? "ARNAQUE" : "LÉGITIME"}
                      </CyberSticker>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-1 font-medium">
                      {item.description}
                    </p>
                    <code className="mt-2 block truncate rounded-lg border border-border/60 bg-muted/60 px-2 py-1 font-mono text-[11px] text-foreground font-bold">
                      {item.content}
                    </code>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2">
            <GemmaStatusBanner />
          </div>
        </div>
      )}
    </>
  );
}
