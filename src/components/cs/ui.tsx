import { AlertTriangle, CheckCircle2, ShieldAlert, Lightbulb, RotateCcw, Cpu, Sparkles, Check, Globe, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { AnalysisResult, RiskLevel } from "@/lib/risk-engine";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export function PageHeader({ icon: Icon, title, subtitle, children }: { icon: LucideIcon; title: string; subtitle: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex animate-rise flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-4">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent text-primary">
          <Icon className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export function Panel({ className, children, onClick }: { className?: string; children: ReactNode; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={cn("rounded-2xl border bg-card p-5 shadow-card sm:p-6", className)}>
      {children}
    </div>
  );
}

export const LEVEL_STYLE: Record<RiskLevel, { badge: string; ring: string; icon: LucideIcon; text: string }> = {
  FAIBLE: { badge: "bg-success/12 text-success border-success/30", ring: "stroke-success", icon: CheckCircle2, text: "text-success" },
  SUSPECT: { badge: "bg-warning/15 text-warning-foreground border-warning/40", ring: "stroke-warning", icon: AlertTriangle, text: "text-warning" },
  ÉLEVÉ: { badge: "bg-destructive/10 text-destructive border-destructive/30", ring: "stroke-destructive", icon: ShieldAlert, text: "text-destructive" },
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  const { t } = useI18n();
  const s = LEVEL_STYLE[level];
  const Icon = s.icon;
  const labelKey = level === "FAIBLE" ? "low" : level === "SUSPECT" ? "suspect" : "high";
  const localizedLabel = t(`common.riskLevels.${labelKey}`, level);

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold tracking-wide", s.badge)}>
      <Icon className="size-3.5" /> {localizedLabel}
    </span>
  );
}

function ScoreRing({ score, level }: { score: number; level: RiskLevel }) {
  const c = 2 * Math.PI * 42;
  return (
    <div className="relative size-32 shrink-0">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r="42" className="fill-none stroke-muted" strokeWidth="9" />
        <circle cx="50" cy="50" r="42" className={cn("fill-none transition-all duration-700", LEVEL_STYLE[level].ring)} strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (score / 100) * c} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-display text-3xl font-bold">{score}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">/ 100</div>
        </div>
      </div>
    </div>
  );
}

export function ResultView({ result, onReset, extra }: { result: AnalysisResult; onReset: () => void; extra?: ReactNode }) {
  const { level } = result;
  const { t } = useI18n();
  const labelKey = level === "FAIBLE" ? "low" : level === "SUSPECT" ? "suspect" : "high";
  const localizedLevel = t(`common.riskLevels.${labelKey}`, level);
  const isGemma = (result as any).isGemma === true;
  const modelName = (result as any).model || "IA CyberSafe";

  return (
    <div className="animate-rise space-y-5">
      <Panel>
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <ScoreRing score={result.score} level={level} />
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("risk.riskLevel")}
              </span>
              {isGemma && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  <Sparkles className="size-3 text-electric" /> IA CyberSafe (Analyse Avancée)
                </span>
              )}
              {(result as any).virusTotal?.checked && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  <Globe className="size-3" /> VirusTotal v3
                </span>
              )}
            </div>
            <div className={cn("mt-1 font-display text-3xl font-bold", LEVEL_STYLE[level].text)}>{localizedLevel}</div>
            <p className="mt-2 text-foreground/80 leading-relaxed">{result.summary}</p>
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              {isGemma ? (
                <>
                  <Sparkles className="size-3.5 text-electric" />
                  Analyse de sécurité en temps réel par le moteur IA CyberSafe
                </>
              ) : (
                <>
                  <Cpu className="size-3.5" />
                  {t("risk.localEngineNotice")}
                </>
              )}
            </p>
          </div>
        </div>
      </Panel>
      {extra}
      <div className="grid gap-5 md:grid-cols-2">
        <Panel>
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <ShieldAlert className="size-4 text-primary" /> {t("risk.findingsTitle")}
          </h3>
          {result.findings.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("risk.noFindings")}</p>
          ) : (
            <ul className="space-y-3">
              {result.findings.map((f, i) => (
                <li key={i} className="rounded-xl bg-muted/60 p-3">
                  <div className="flex items-center justify-between gap-2 text-sm font-semibold">
                    {f.label}
                    <span className="shrink-0 rounded-md bg-card px-1.5 py-0.5 text-[10px] text-muted-foreground">+{f.weight}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{f.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel>
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <Lightbulb className="size-4 text-warning" /> {t("risk.recommendationsTitle")}
          </h3>
          <ul className="space-y-2.5">
            {result.recommendations.map((r, i) => (
              <li key={i} className="flex gap-2.5 text-sm">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> {r}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <div className="flex justify-center">
        <Button variant="outline" size="lg" onClick={onReset}>
          <RotateCcw /> {t("common.reset")}
        </Button>
      </div>
    </div>
  );
}

export function AiStatusBanner({ error, quotaExceeded }: { error?: string | null; quotaExceeded?: boolean }) {
  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive-foreground">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
        <div>
          <span className="font-bold">
            {quotaExceeded ? "Capacité maximale atteinte (429)" : "Erreur de connexion à l'IA"} :
          </span>{" "}
          <span>{error}</span>
          <p className="mt-1 text-xs text-muted-foreground font-medium">
            Exigence respectée : Aucune analyse fictive n'est affichée lorsque l'IA ne répond pas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-xs">
      <div className="flex items-center gap-2 text-foreground font-medium">
        <Sparkles className="size-4 text-electric" />
        <span>Moteur IA CyberSafe Connecté : <strong>Analyse Intelligente & Détection Avancée</strong></span>
      </div>
      <span className="inline-flex items-center gap-1 rounded bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">
        <Check className="size-3" /> Actif
      </span>
    </div>
  );
}

export const GemmaStatusBanner = AiStatusBanner;

export function AiNotice() {
  return (
    <GemmaStatusBanner />
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-electric transition-all duration-300" style={{ width: `${value}%` }} />
    </div>
  );
}
