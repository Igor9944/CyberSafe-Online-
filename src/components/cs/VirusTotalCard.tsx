import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Globe,
  UploadCloud,
  CheckCircle2,
  Lock,
  Info,
  Clock,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/cs/ui";
import { CyberSticker } from "@/components/cs/CyberDecorations";
import {
  submitUrlToVirusTotalApi,
  type VirusTotalAnalysisResult,
  type VirusTotalUrlReport,
} from "@/lib/gemma-client";

interface VirusTotalCardProps {
  virusTotal?: VirusTotalAnalysisResult | undefined;
  gemmaRisk?: "FAIBLE" | "SUSPECT" | "ÉLEVÉ" | undefined;
  technicalRisk?: ("FAIBLE" | "SUSPECT" | "ÉLEVÉ" | "NON_RÉPERTORIÉ" | "INDISPONIBLE" | "AUCUN_LIEN") | undefined;
}

export function VirusTotalCard({
  virusTotal,
  gemmaRisk,
  technicalRisk,
}: VirusTotalCardProps) {
  if (!virusTotal) return null;

  return (
    <Panel className="space-y-5 border-2 border-primary/30 bg-card shadow-neo-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b-2 pb-4">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl border-2 border-foreground bg-primary/10 text-primary shadow-neo-sm">
            <Globe className="size-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base">Réputation technique des liens</h3>
              <CyberSticker tone="purple" rotate="none">
                VirusTotal API v3
              </CyberSticker>
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              Vérification multi-moteurs indépendante croisée avec l'analyse IA CyberSafe
            </p>
          </div>
        </div>

        <div className="shrink-0">
          {virusTotal.unavailable ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-warning/50 bg-warning/15 px-3 py-1 text-xs font-bold text-warning-foreground">
              <AlertTriangle className="size-3.5" /> Vérification VirusTotal indisponible
            </span>
          ) : !virusTotal.hasUrls ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-muted bg-muted/60 px-3 py-1 text-xs font-bold text-muted-foreground">
              <Info className="size-3.5" /> Aucun lien dans le SMS
            </span>
          ) : virusTotal.summary.maliciousUrls > 0 ? (
            <CyberSticker tone="rose" icon={ShieldAlert} rotate="none">
              {virusTotal.summary.maliciousUrls} URL malveillante(s)
            </CyberSticker>
          ) : virusTotal.summary.suspiciousUrls > 0 ? (
            <CyberSticker tone="yellow" icon={AlertTriangle} rotate="none">
              URL suspecte détectée
            </CyberSticker>
          ) : virusTotal.summary.notFoundUrls > 0 ? (
            <CyberSticker tone="cyan" icon={Info} rotate="none">
              Nouveau lien non répertorié
            </CyberSticker>
          ) : (
            <CyberSticker tone="lime" icon={CheckCircle2} rotate="none">
              Aucune détection malveillante
            </CyberSticker>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border-2 border-border/80 bg-muted/40 p-3.5 shadow-neo-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-primary">
            <Sparkles className="size-3.5 text-electric" />
            <span>Rôle 1 : Analyse contextuelle (IA CyberSafe)</span>
          </div>
          <div className="mt-1 text-sm font-semibold">
            Évaluation sémantique :{" "}
            <span className="font-black text-foreground">{gemmaRisk || "Analysé"}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground font-medium">
            Examine l'intention, le ton d'urgence, les demandes de PIN/OTP et le scénario d'escroquerie.
          </p>
        </div>

        <div className="rounded-xl border-2 border-border/80 bg-muted/40 p-3.5 shadow-neo-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-primary">
            <Globe className="size-3.5 text-primary" />
            <span>Rôle 2 : Réputation technique (VirusTotal v3)</span>
          </div>
          <div className="mt-1 text-sm font-semibold">
            Réputation des liens :{" "}
            <span className="font-black text-foreground">{technicalRisk || "Vérifié"}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground font-medium">
            Interroge les listes mondiales d'antivirus et bases de phishing reconnues.
          </p>
        </div>
      </div>

      {!virusTotal.hasUrls && (
        <div className="rounded-xl border-2 border-dashed bg-muted/20 p-4 text-center text-xs text-muted-foreground font-medium">
          Ce SMS ne contient aucun lien hypertexte ou nom de domaine web. L'analyse du risque repose exclusivement sur le contenu contextuel analysé par l'IA CyberSafe.
        </div>
      )}

      {virusTotal.urls.length > 0 && (
        <div className="space-y-4">
          <div className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Détail des liens analysés ({virusTotal.urls.length})
          </div>

          <div className="space-y-3">
            {virusTotal.urls.map((u, idx) => (
              <UrlReportItem key={idx} report={u} />
            ))}
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 rounded-xl border-2 border-warning/40 bg-warning/10 p-4 text-xs text-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-warning" />
        <div className="space-y-1">
          <span className="font-black text-warning-foreground">
            Règle de sécurité essentielle :
          </span>
          <p className="leading-relaxed font-medium">
            {virusTotal.caution} Les escrocs créent souvent de nouveaux noms de domaine quelques minutes avant de diffuser des SMS frauduleux (Moov Money, T-Money, etc.), avant même que les moteurs antivirus n'aient eu le temps de les classifier.
          </p>
        </div>
      </div>
    </Panel>
  );
}

function UrlReportItem({ report }: { report: VirusTotalUrlReport }) {
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const handleManualSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await submitUrlToVirusTotalApi(report.url);
      if (res.success) {
        setSubmittedId(res.id || "ok");
        toast.success("Demande d'analyse envoyée à VirusTotal !");
      } else {
        toast.error(res.error || "Échec de l'envoi");
      }
    } catch {
      toast.error("Impossible de joindre le serveur.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border-2 border-border/80 bg-muted/30 p-4 space-y-3 shadow-neo-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm truncate">{report.domain}</span>
            {report.status === "analyzed" && (
              <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-black text-primary">
                Rapport officiel VT
              </span>
            )}
          </div>
          <div className="mt-0.5 break-all font-mono text-xs text-muted-foreground select-all font-semibold">
            {report.url}
          </div>
        </div>

        <div className="shrink-0">
          <StatusBadge status={report.status} stats={report.stats} />
        </div>
      </div>

      {report.status === "analyzed" && report.stats && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 pt-2">
          <div className="rounded-xl border-2 border-destructive/40 bg-card p-3 shadow-neo-sm">
            <div className="text-[10px] font-black text-destructive uppercase">
              Malveillants
            </div>
            <div className="mt-1 font-display text-xl font-black text-destructive">
              {report.stats.malicious}
            </div>
            <div className="text-[10px] text-muted-foreground font-medium">moteurs alertent</div>
          </div>

          <div className="rounded-xl border-2 border-success/40 bg-card p-3 shadow-neo-sm">
            <div className="text-[10px] font-black text-success uppercase">
              Sans détection
            </div>
            <div className="mt-1 font-display text-xl font-black text-success">
              {report.stats.harmless + report.stats.undetected}
            </div>
            <div className="text-[10px] text-muted-foreground font-medium">moteurs neutres/sûrs</div>
          </div>

          <div className="rounded-xl border-2 border-warning/50 bg-card p-3 shadow-neo-sm">
            <div className="text-[10px] font-black text-warning-foreground uppercase">
              Non concluants
            </div>
            <div className="mt-1 font-display text-xl font-black text-warning-foreground">
              {report.stats.suspicious + report.stats.timeout}
            </div>
            <div className="text-[10px] text-muted-foreground font-medium">suspects / délais</div>
          </div>

          <div className="rounded-xl border-2 border-border/80 bg-card p-3 shadow-neo-sm">
            <div className="text-[10px] font-black text-muted-foreground uppercase">
              Score Réputation
            </div>
            <div className="mt-1 font-display text-xl font-black">
              {report.reputation ?? 0}
            </div>
            <div className="text-[10px] text-muted-foreground font-medium">
              {report.lastAnalysisDate
                ? new Date(report.lastAnalysisDate * 1000).toLocaleDateString("fr-FR")
                : "Récent"}
            </div>
          </div>
        </div>
      )}

      {report.status === "not_found" && (
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-3 text-xs space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-primary">
              Cette URL n'est pas encore enregistrée dans VirusTotal.
            </span>
            {submittedId ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-success/20 px-2 py-0.5 text-[10px] font-black text-success border border-success/40">
                <CheckCircle2 className="size-3" /> Analyse en file d'attente
              </span>
            ) : (
              <Button
                variant="neo"
                size="sm"
                className="h-7 text-xs gap-1.5 font-bold"
                onClick={handleManualSubmit}
                disabled={submitting}
              >
                <UploadCloud className="size-3.5" />
                {submitting ? "Envoi..." : "Demander l'analyse"}
              </Button>
            )}
          </div>
          <p className="text-muted-foreground font-medium">
            L'absence de rapport préalable est fréquente pour les liens de phishing récents conçus pour cibler les utilisateurs togolais.
          </p>
        </div>
      )}

      {report.status === "skipped_sensitive" && (
        <div className="rounded-xl border-2 border-muted bg-muted/60 p-3 text-xs flex items-center gap-2 text-muted-foreground font-medium">
          <Lock className="size-4 shrink-0 text-primary" />
          <span>
            {report.message || "Paramètres privés détectés. Lien exclu de l'analyse externe."}
          </span>
        </div>
      )}

      {report.status === "quota_exceeded" && (
        <div className="rounded-xl border-2 border-warning/40 bg-warning/10 p-3 text-xs flex items-center gap-2 text-warning-foreground font-medium">
          <Clock className="size-4 shrink-0" />
          <span>
            Limite de requêtes publiques VirusTotal atteinte. L'analyse sémantique locale prévaut.
          </span>
        </div>
      )}

      {report.status === "unavailable" && (
        <div className="rounded-xl border-2 border-muted bg-muted/60 p-3 text-xs text-muted-foreground font-medium">
          Vérification VirusTotal indisponible ({report.error || "Réseau hors portée"}).
        </div>
      )}
    </div>
  );
}

function StatusBadge({
  status,
  stats,
}: {
  status: VirusTotalUrlReport["status"];
  stats?: VirusTotalUrlReport["stats"];
}) {
  if (status === "analyzed" && stats) {
    if (stats.malicious > 0) {
      return (
        <CyberSticker tone="rose" icon={ShieldAlert} rotate="none">
          {stats.malicious} alerte(s)
        </CyberSticker>
      );
    }
    if (stats.suspicious > 0) {
      return (
        <CyberSticker tone="yellow" icon={AlertTriangle} rotate="none">
          Suspect
        </CyberSticker>
      );
    }
    return (
      <CyberSticker tone="lime" icon={ShieldCheck} rotate="none">
        Inoffensif
      </CyberSticker>
    );
  }

  if (status === "not_found") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-black text-primary">
        Non répertorié
      </span>
    );
  }

  if (status === "skipped_sensitive") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-muted bg-muted px-2 py-0.5 text-xs font-black text-muted-foreground">
        Confidentiel
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-muted bg-muted px-2 py-0.5 text-xs font-black text-muted-foreground">
      Indisponible
    </span>
  );
}
