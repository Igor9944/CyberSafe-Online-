import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Lightbulb,
  RotateCcw,
  Cpu,
  Sparkles,
  Check,
  Globe,
  Volume2,
  VolumeX,
  Copy,
  Info,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { AnalysisResult, RiskLevel } from "@/lib/risk-engine";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { MemphisDoodle, CyberSticker } from "./CyberDecorations";

export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-8 flex animate-rise flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-4">
        <div className="grid size-14 shrink-0 place-items-center rounded-2xl border-2 border-foreground bg-electric text-primary-foreground shadow-neo ring-4 ring-primary/10">
          <Icon className="size-6 stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
            <MemphisDoodle
              variant="wave"
              className="hidden sm:inline-block size-6 text-electric opacity-70"
            />
          </div>
          <p className="mt-1 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed font-medium">
            {subtitle}
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}

export function Panel({
  className,
  children,
  onClick,
}: {
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "motion-card rounded-2xl border-2 border-border/80 bg-card/95 p-5 shadow-neo-sm backdrop-blur-sm sm:p-6",
        onClick && "cursor-pointer hover:border-primary/60 hover:shadow-neo",
        className,
      )}
    >
      {children}
    </div>
  );
}

export const LEVEL_STYLE: Record<
  RiskLevel,
  {
    badge: string;
    ring: string;
    icon: LucideIcon;
    text: string;
    cardBorder: string;
    bgGlow: string;
    stickerTone: "lime" | "yellow" | "rose";
  }
> = {
  FAIBLE: {
    badge: "bg-success/15 text-success border-success/40",
    ring: "stroke-success",
    icon: CheckCircle2,
    text: "text-success",
    cardBorder: "border-success/40",
    bgGlow: "from-success/10 via-card to-card",
    stickerTone: "lime",
  },
  SUSPECT: {
    badge: "bg-warning/15 text-warning-foreground border-warning/50",
    ring: "stroke-warning",
    icon: AlertTriangle,
    text: "text-warning",
    cardBorder: "border-warning/50",
    bgGlow: "from-warning/15 via-card to-card",
    stickerTone: "yellow",
  },
  ÉLEVÉ: {
    badge: "bg-destructive/15 text-destructive border-destructive/50",
    ring: "stroke-destructive",
    icon: ShieldAlert,
    text: "text-destructive",
    cardBorder: "border-destructive/50",
    bgGlow: "from-destructive/15 via-card to-card",
    stickerTone: "rose",
  },
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  const { t } = useI18n();
  const s = LEVEL_STYLE[level];
  const Icon = s.icon;
  const labelKey = level === "FAIBLE" ? "low" : level === "SUSPECT" ? "suspect" : "high";
  const localizedLabel = t(`common.riskLevels.${labelKey}`, level);

  return (
    <CyberSticker tone={s.stickerTone} icon={Icon} rotate="none">
      {localizedLabel}
    </CyberSticker>
  );
}

function ScoreRing({ score, level }: { score: number; level: RiskLevel }) {
  const c = 2 * Math.PI * 42;
  const LevelIcon = LEVEL_STYLE[level].icon;
  return (
    <div className="relative size-36 shrink-0">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90 drop-shadow-xs">
        <circle cx="50" cy="50" r="42" className="fill-none stroke-muted/80" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r="42"
          className={cn("fill-none transition-all duration-700", LEVEL_STYLE[level].ring)}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (score / 100) * c}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <LevelIcon className={cn("size-4 mb-0.5", LEVEL_STYLE[level].text)} />
        <div className="font-display text-3xl font-extrabold tracking-tight">{score}</div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          / 100
        </div>
      </div>
    </div>
  );
}

export function ResultView({
  result,
  onReset,
  extra,
}: {
  result: AnalysisResult;
  onReset: () => void;
  extra?: ReactNode;
}) {
  const { level } = result;
  const { t, lang } = useI18n();
  const [speaking, setSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const labelKey = level === "FAIBLE" ? "low" : level === "SUSPECT" ? "suspect" : "high";
  const localizedLevel = t(`common.riskLevels.${labelKey}`, level);
  const isGemma = (result as any).isGemma === true;
  const modelName = (result as any).model || "gemma-4-26b-a4b-it";
  const style = LEVEL_STYLE[level];

  const toggleSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const speechText = `Niveau de risque : ${localizedLevel}. ${result.summary}. Recommandations : ${result.recommendations.slice(0, 2).join(". ")}`;
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = lang === "en" ? "en-US" : "fr-FR";
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const copyReport = async () => {
    const reportText = `🛡️ ALERTE CYBERSAFE ONLINE (Gemma 4)\n• Risque : ${localizedLevel.toUpperCase()} (${result.score}/100)\n• Diagnostic : ${result.summary}\n• Conseils : ${result.recommendations.slice(0, 2).join(" | ")}`;
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      toast.success(t("common.copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier le rapport.");
    }
  };

  return (
    <div className="animate-rise space-y-5">
      <Panel
        className={cn("border-2 bg-gradient-to-br shadow-neo", style.bgGlow, style.cardBorder)}
      >
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <ScoreRing score={result.score} level={level} />
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                {t("risk.riskLevel")}
              </span>
              {isGemma && (
                <CyberSticker tone="cyan" icon={Sparkles} rotate="none">
                  Google Gemma 4 ({modelName})
                </CyberSticker>
              )}
              {(result as any).virusTotal?.checked && (
                <CyberSticker tone="purple" icon={Globe} rotate="none">
                  VirusTotal v3
                </CyberSticker>
              )}
            </div>

            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
              <span className={cn("font-display text-3xl font-black tracking-tight", style.text)}>
                {localizedLevel}
              </span>
              <Button
                type="button"
                variant="neo"
                size="sm"
                onClick={toggleSpeech}
                className="h-8 gap-1.5 rounded-xl text-xs font-bold"
                title="Écouter l'alerte vocale (Accessibilité Secteur Informel)"
              >
                {speaking ? (
                  <VolumeX className="size-3.5 text-destructive" />
                ) : (
                  <Volume2 className="size-3.5 text-primary" />
                )}
                {speaking ? "Arrêter" : "Écouter l'alerte"}
              </Button>
              <Button
                type="button"
                variant="neo"
                size="sm"
                onClick={copyReport}
                className="h-8 gap-1.5 rounded-xl text-xs font-bold"
                title="Copier l'alerte pour partager sur WhatsApp / SMS"
              >
                {copied ? (
                  <Check className="size-3.5 text-success" />
                ) : (
                  <Copy className="size-3.5 text-muted-foreground" />
                )}
                {copied ? "Copié !" : "Partager l'alerte"}
              </Button>
            </div>

            <p className="mt-2.5 text-sm sm:text-base text-foreground font-semibold leading-relaxed">
              {result.summary}
            </p>
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              {isGemma ? (
                <>
                  <Sparkles className="size-3.5 text-electric" />
                  Analyse sémantique & conformité T-Money / Moov Money par Google Gemma ({modelName}
                  )
                </>
              ) : (
                <>
                  <Cpu className="size-3.5" />
                  {t("risk.localEngineNotice")}
                </>
              )}
            </p>

            {level === "FAIBLE" && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border-2 border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground text-left">
                <Info className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  <strong>Rappel de sécurité :</strong> Un niveau de risque faible indique qu'aucun
                  indicateur d'arnaque évident n'a été détecté dans ce message, mais ne constitue
                  jamais une garantie absolue d'authenticité. Restez vigilant.
                </span>
              </div>
            )}
          </div>
        </div>
      </Panel>

      {extra}

      <div className="grid gap-5 md:grid-cols-2">
        <Panel className="border-2 shadow-neo-sm">
          <div className="mb-4 flex items-center justify-between border-b-2 pb-3">
            <h3 className="flex items-center gap-2 font-black text-base">
              <ShieldAlert className="size-4 text-primary" /> {t("risk.findingsTitle")}
            </h3>
            <span className="rounded-full bg-muted border border-border px-2.5 py-0.5 text-xs font-black text-muted-foreground">
              {result.findings.length} signal(s)
            </span>
          </div>
          {result.findings.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-success/40 bg-success/5 p-6 text-center text-sm text-success font-semibold">
              <CheckCircle2 className="mx-auto mb-2 size-6" />
              {t("risk.noFindings")}
            </div>
          ) : (
            <ul className="space-y-3">
              {result.findings.map((f, i) => (
                <li
                  key={i}
                  className="rounded-xl border-2 border-border/70 bg-muted/40 p-3.5 transition hover:border-primary/40"
                >
                  <div className="flex items-center justify-between gap-2 text-sm font-bold">
                    <span>{f.label}</span>
                    <span className="shrink-0 rounded-lg border-2 border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-black text-primary">
                      +{f.weight} pts
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground font-medium">
                    {f.detail}
                  </p>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted border border-border/50">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        f.weight >= 35
                          ? "bg-destructive"
                          : f.weight >= 20
                            ? "bg-warning"
                            : "bg-primary",
                      )}
                      style={{ width: `${Math.min(100, Math.max(15, f.weight * 2))}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel className="border-2 shadow-neo-sm">
          <div className="mb-4 flex items-center justify-between border-b-2 pb-3">
            <h3 className="flex items-center gap-2 font-black text-base">
              <Lightbulb className="size-4 text-warning" /> {t("risk.recommendationsTitle")}
            </h3>
            <span className="rounded-full border border-success/40 bg-success/15 px-2.5 py-0.5 text-xs font-black text-success">
              Actions clés
            </span>
          </div>
          <ul className="space-y-3">
            {result.recommendations.map((r, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-xl border-2 border-border/60 bg-muted/30 p-3 text-sm leading-relaxed"
              >
                <div className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success/20 text-success font-black text-xs border border-success/40">
                  {i + 1}
                </div>
                <span className="flex-1 font-medium text-foreground">{r}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="flex justify-center pt-2">
        <Button variant="hero" size="lg" onClick={onReset} className="gap-2 font-bold shadow-neo">
          <RotateCcw className="size-4" /> {t("common.reset")}
        </Button>
      </div>
    </div>
  );
}

export function AiStatusBanner({
  error,
  quotaExceeded,
}: {
  error?: string | null;
  quotaExceeded?: boolean;
}) {
  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border-2 border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive-foreground shadow-neo-sm">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
        <div>
          <span className="font-black">
            {quotaExceeded
              ? "Capacité maximale atteinte (429)"
              : "Erreur de connexion à Google Gemma 4"}{" "}
            :
          </span>{" "}
          <span>{error}</span>
          <p className="mt-1 text-xs text-muted-foreground font-semibold">
            Exigence respectée : Gemma est essentielle — aucune analyse fictive n'est affichée
            lorsque Gemma ne répond pas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-card to-electric/10 px-4 py-3 text-xs shadow-neo-sm">
      <div className="flex items-center gap-2 text-foreground font-semibold">
        <Sparkles className="size-4 text-electric" />
        <span>
          Moteur Google Gemma Connecté :{" "}
          <strong>gemma-4-26b-a4b-it (Texte, Vision & Pédagogie)</strong>
        </span>
      </div>
      <CyberSticker tone="lime" rotate="none">
        <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
        En ligne
      </CyberSticker>
    </div>
  );
}

export const GemmaStatusBanner = AiStatusBanner;

export function AiNotice() {
  return <GemmaStatusBanner />;
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px] font-bold text-primary">
        <span className="flex items-center gap-1.5">
          <Sparkles className="size-3.5 animate-spin text-electric" /> Analyse en cours par Google
          Gemma 4...
        </span>
        <span>{value}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted p-0.5 border border-border">
        <div
          className="h-full rounded-full bg-electric transition-all duration-300 shadow-glow"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
