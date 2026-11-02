import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
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
    <Panel className="space-y-5 border-primary/20 bg-card">
      {/* En-tête de la carte VirusTotal */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Globe className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base">Réputation technique des liens</h3>
              <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                VirusTotal API v3
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Vérification multi-moteurs indépendante croisée avec l'analyse IA CyberSafe
            </p>
          </div>
        </div>

        {/* Badge d'état global VirusTotal */}
        <div className="shrink-0">
          {virusTotal.unavailable ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-xs font-semibold text-warning-foreground">
              <AlertTriangle className="size-3.5" /> Vérification VirusTotal indisponible
            </span>
          ) : !virusTotal.hasUrls ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-muted bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Info className="size-3.5" /> Aucun lien dans le SMS
            </span>
          ) : virusTotal.summary.maliciousUrls > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/15 px-3 py-1 text-xs font-bold text-destructive">
              <ShieldAlert className="size-3.5" /> {virusTotal.summary.maliciousUrls} URL malveillante(s)
            </span>
          ) : virusTotal.summary.suspiciousUrls > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/15 px-3 py-1 text-xs font-bold text-warning-foreground">
              <AlertTriangle className="size-3.5" /> URL suspecte détectée
            </span>
          ) : virusTotal.summary.notFoundUrls > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Info className="size-3.5" /> Nouveau lien non répertorié
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/15 px-3 py-1 text-xs font-bold text-success">
              <CheckCircle2 className="size-3.5" /> Aucune détection malveillante
            </span>
          )}
        </div>
      </div>

      {/* Distinction claire des rôles : IA CyberSafe vs VirusTotal */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border bg-muted/40 p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5 text-electric" />
            <span>Rôle 1 : Analyse contextuelle (IA CyberSafe)</span>
          </div>
          <div className="mt-1 text-sm font-medium">
            Évaluation sémantique :{" "}
            <span className="font-bold">{gemmaRisk || "Analysé"}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Examine l'intention, le ton d'urgence, les demandes de PIN/OTP et le scénario d'escroquerie.
          </p>
        </div>

        <div className="rounded-xl border bg-muted/40 p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <Globe className="size-3.5 text-primary" />
            <span>Rôle 2 : Réputation technique (VirusTotal v3)</span>
          </div>
          <div className="mt-1 text-sm font-medium">
            Réputation des liens :{" "}
            <span className="font-bold">{technicalRisk || "Vérifié"}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Interroge les listes mondiales d'antivirus et bases de phishing reconnues.
          </p>
        </div>
      </div>

      {/* Si aucune URL n'a été détectée dans le SMS */}
      {!virusTotal.hasUrls && (
        <div className="rounded-xl border border-dashed bg-muted/20 p-4 text-center text-xs text-muted-foreground">
          Ce SMS ne contient aucun lien hypertexte ou nom de domaine web. L'analyse du risque repose exclusivement sur le contenu contextuel analysé par l'IA CyberSafe.
        </div>
      )}

      {/* Liste des URLs analysées */}
      {virusTotal.urls.length > 0 && (
        <div className="space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Détail des liens analysés ({virusTotal.urls.length})
          </div>

          <div className="space-y-3">
            {virusTotal.urls.map((u, idx) => (
              <UrlReportItem key={idx} report={u} />
            ))}
          </div>
        </div>
      )}

      {/* Avertissement obligatoire exigé par la spécification */}
      <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4 text-xs text-foreground/90">
        <Info className="mt-0.5 size-4 shrink-0 text-warning" />
        <div className="space-y-1">
          <span className="font-semibold text-warning-foreground">
            Règle de sécurité essentielle :
          </span>
          <p className="leading-relaxed">
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
    <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate">{report.domain}</span>
            {report.status === "analyzed" && (
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                Rapport officiel VT
              </span>
            )}
          </div>
          {/* Ne jamais ouvrir automatiquement le lien : afficher uniquement comme texte non cliquable */}
          <div className="mt-0.5 break-all font-mono text-xs text-muted-foreground select-all">
            {report.url}
          </div>
        </div>

        <div className="shrink-0">
          <StatusBadge status={report.status} stats={report.stats} />
        </div>
      </div>

      {/* Résultats détaillés pour une URL analysée */}
      {report.status === "analyzed" && report.stats && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 pt-2">
          {/* Moteurs signalant comme malveillant */}
          <div className="rounded-lg bg-card p-2.5 border">
            <div className="text-[10px] font-semibold text-destructive uppercase">
              Malveillants
            </div>
            <div className="mt-1 font-display text-xl font-bold text-destructive">
              {report.stats.malicious}
            </div>
            <div className="text-[10px] text-muted-foreground">moteurs alertent</div>
          </div>

          {/* Moteurs sans détection (harmless + undetected) */}
          <div className="rounded-lg bg-card p-2.5 border">
            <div className="text-[10px] font-semibold text-success uppercase">
              Sans détection
            </div>
            <div className="mt-1 font-display text-xl font-bold text-success">
              {report.stats.harmless + report.stats.undetected}
            </div>
            <div className="text-[10px] text-muted-foreground">moteurs neutres/sûrs</div>
          </div>

          {/* Résultats non concluants (suspects / timeout) */}
          <div className="rounded-lg bg-card p-2.5 border">
            <div className="text-[10px] font-semibold text-warning-foreground uppercase">
              Non concluants
            </div>
            <div className="mt-1 font-display text-xl font-bold text-warning-foreground">
              {report.stats.suspicious + report.stats.timeout}
            </div>
            <div className="text-[10px] text-muted-foreground">suspects / délais</div>
          </div>

          {/* Réputation / Date */}
          <div className="rounded-lg bg-card p-2.5 border">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase">
              Score Réputation
            </div>
            <div className="mt-1 font-display text-xl font-bold">
              {report.reputation ?? 0}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {report.lastAnalysisDate
                ? new Date(report.lastAnalysisDate * 1000).toLocaleDateString("fr-FR")
                : "Récent"}
            </div>
          </div>
        </div>
      )}

      {/* URL non répertoriée dans VirusTotal */}
      {report.status === "not_found" && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-primary">
              Cette URL n'est pas encore enregistrée dans VirusTotal.
            </span>
            {submittedId ? (
              <span className="inline-flex items-center gap-1 rounded bg-success/20 px-2 py-0.5 text-[10px] font-bold text-success">
                <CheckCircle2 className="size-3" /> Analyse en file d'attente
              </span>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={handleManualSubmit}
                disabled={submitting}
              >
                <UploadCloud className="size-3.5" />
                {submitting ? "Envoi..." : "Demander l'analyse"}
              </Button>
            )}
          </div>
          <p className="text-muted-foreground">
            L'absence de rapport préalable est fréquente pour les liens de phishing récents conçus pour cibler les utilisateurs togolais.
          </p>
        </div>
      )}

      {/* URL avec paramètres sensibles / confidentiels non transmis */}
      {report.status === "skipped_sensitive" && (
        <div className="rounded-lg border border-muted bg-muted/60 p-3 text-xs flex items-center gap-2 text-muted-foreground">
          <Lock className="size-4 shrink-0 text-primary" />
          <span>
            {report.message || "Paramètres privés détectés. Lien exclu de l'analyse externe."}
          </span>
        </div>
      )}

      {/* Quota dépassé */}
      {report.status === "quota_exceeded" && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs flex items-center gap-2 text-warning-foreground">
          <Clock className="size-4 shrink-0" />
          <span>
            Limite de requêtes publiques VirusTotal atteinte. L'analyse sémantique locale prévaut.
          </span>
        </div>
      )}

      {/* Service indisponible */}
      {report.status === "unavailable" && (
        <div className="rounded-lg border border-muted bg-muted/60 p-3 text-xs text-muted-foreground">
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
        <span className="inline-flex items-center gap-1 rounded-md bg-destructive/15 px-2 py-0.5 text-xs font-bold text-destructive">
          <ShieldAlert className="size-3" /> {stats.malicious} alerte(s)
        </span>
      );
    }
    if (stats.suspicious > 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-warning/20 px-2 py-0.5 text-xs font-bold text-warning-foreground">
          <AlertTriangle className="size-3" /> Suspect
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">
        <ShieldCheck className="size-3" /> Inoffensif
      </span>
    );
  }

  if (status === "not_found") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
        Non répertorié
      </span>
    );
  }

  if (status === "skipped_sensitive") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        Confidentiel
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      Indisponible
    </span>
  );
}
