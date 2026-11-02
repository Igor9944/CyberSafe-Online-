import { createFileRoute, Link } from "@tanstack/react-router";
import {
  PhoneCall,
  Smartphone,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  XCircle,
  FileText,
  Lock,
  Headphones,
} from "lucide-react";
import { PageHeader, Panel } from "@/components/cs/ui";
import { CyberSticker } from "@/components/cs/CyberDecorations";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/guide")({
  head: () => ({
    meta: [
      { title: "Guide de Sécurité & Syntaxe Officielle — CyberSafe Online" },
      {
        name: "description",
        content:
          "Guide officiel de conformité des SMS T-Money et Moov Money au Togo et conseils d'enregistrement d'appels.",
      },
    ],
  }),
  component: GuidePage,
});

function GuidePage() {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ShieldCheck}
        title="Guide de Sécurité Mobile Money & Détection"
        subtitle="Apprenez à reconnaître immédiatement les vrais SMS officiels T-Money / Moov Money et à vous prémunir contre les escroqueries au Togo."
      >
        <div className="flex flex-wrap items-center gap-2">
          <CyberSticker tone="lime" icon={ShieldCheck} rotate="none">
            Règles d'or Togo
          </CyberSticker>
          <CyberSticker tone="cyan" rotate="none">
            T-Money & Moov
          </CyberSticker>
        </div>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border-2 border-destructive/40 bg-destructive/10 p-4 space-y-2 shadow-neo-sm">
          <div className="flex items-center gap-2 font-black text-destructive text-sm">
            <Lock className="size-4" /> 1. Le PIN est Sacré
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed font-medium">
            Ni Togocom ni Moov Africa ne vous demanderont <strong>JAMAIS</strong> votre code PIN ou
            un code OTP reçu par SMS, même en cas de problème technique.
          </p>
        </div>

        <div className="rounded-2xl border-2 border-warning/50 bg-warning/10 p-4 space-y-2 shadow-neo-sm">
          <div className="flex items-center gap-2 font-black text-warning text-sm">
            <Smartphone className="size-4" /> 2. Faux Dépôt par Erreur
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed font-medium">
            Si quelqu'un prétend vous avoir envoyé de l'argent par erreur, vérifiez toujours votre
            vrai solde via <code className="font-bold">*145#</code> ou{" "}
            <code className="font-bold">*155#</code> avant de renvoyer quoi que ce soit.
          </p>
        </div>

        <div className="rounded-2xl border-2 border-primary/40 bg-primary/10 p-4 space-y-2 shadow-neo-sm">
          <div className="flex items-center gap-2 font-black text-primary text-sm">
            <CheckCircle2 className="size-4" /> 3. Nom d'Expéditeur
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed font-medium">
            Les vrais SMS proviennent de <strong>TMoney</strong> ou <strong>MoovMoney</strong>. Tout
            SMS reçu d'un numéro à 8 chiffres (+228 9X...) prétendant être un dépôt est un faux !
          </p>
        </div>

        <div className="rounded-2xl border-2 border-electric/40 bg-electric/10 p-4 space-y-2 shadow-neo-sm">
          <div className="flex items-center gap-2 font-black text-electric text-sm">
            <AlertTriangle className="size-4" /> 4. Zéro Lien Web
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed font-medium">
            Les notifications officielles de transfert n'intègrent aucun lien Internet cliquable
            (ex: bit.ly, .top, .xyz). Ne cliquez jamais dessus.
          </p>
        </div>
      </div>

      <Panel className="space-y-4 border-2 shadow-neo-sm">
        <div className="flex items-center justify-between border-b-2 border-border/80 pb-3">
          <div>
            <h3 className="font-black text-base flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              Référentiel des Syntaxes Officielles T-Money & Moov Money
            </h3>
            <p className="text-xs text-muted-foreground font-medium">
              Critère officiel d'évaluation de conformité syntaxique des opérateurs au Togo
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3 rounded-2xl border-2 border-border/80 bg-card p-4 shadow-neo-sm">
            <div className="flex items-center justify-between">
              <span className="font-black text-sm text-foreground">Format T-Money (Togocom)</span>
              <CyberSticker tone="yellow" rotate="none">
                USSD *145#
              </CyberSticker>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="rounded-xl border-2 border-success/40 bg-success/10 p-3">
                <div className="flex items-center gap-1.5 font-black text-success mb-1">
                  <CheckCircle2 className="size-3.5" /> SMS Officiel Conforme :
                </div>
                <code className="block font-mono text-[11px] text-foreground font-semibold">
                  Transfert reçu de 15 000 FCFA du 90 12 00 00 (KOFFI A.). Frais: 0 FCFA. Nouveau
                  solde : 42 500 FCFA. Réf : TX261031001.
                </code>
              </div>

              <div className="rounded-xl border-2 border-destructive/40 bg-destructive/10 p-3">
                <div className="flex items-center gap-1.5 font-black text-destructive mb-1">
                  <XCircle className="size-3.5" /> Faux SMS Frauduleux :
                </div>
                <code className="block font-mono text-[11px] text-foreground font-semibold">
                  De: +228 91 00 00 00 : Vous avez reçu 15 000 FCFA. Erreur de transfert, renvoyez
                  au 91 00 00 00 urgence hôpital.
                </code>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border-2 border-border/80 bg-card p-4 shadow-neo-sm">
            <div className="flex items-center justify-between">
              <span className="font-black text-sm text-foreground">Format Moov Money (Flooz)</span>
              <CyberSticker tone="cyan" rotate="none">
                USSD *155#
              </CyberSticker>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="rounded-xl border-2 border-success/40 bg-success/10 p-3">
                <div className="flex items-center gap-1.5 font-black text-success mb-1">
                  <CheckCircle2 className="size-3.5" /> SMS Officiel Conforme :
                </div>
                <code className="block font-mono text-[11px] text-foreground font-semibold">
                  Vous avez reçu 8 500 FCFA de 99 00 11 22. Nouveau solde Flooz : 19 200 FCFA. ID
                  Transaction : MV8849201.
                </code>
              </div>

              <div className="rounded-xl border-2 border-destructive/40 bg-destructive/10 p-3">
                <div className="flex items-center gap-1.5 font-black text-destructive mb-1">
                  <XCircle className="size-3.5" /> Faux SMS Frauduleux :
                </div>
                <code className="block font-mono text-[11px] text-foreground font-semibold">
                  Moov Money Promo: Votre numéro gagne 150 000 FCFA. Cliquez sur
                  http://bit.ly/moov-togo pour valider avant ce soir.
                </code>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-2xl border-2 border-warning/50 bg-warning/15 p-4 text-sm shadow-neo-sm">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
          <p className="text-foreground text-xs sm:text-sm font-medium">
            {t("guide.legalNotice")} Au Togo, conservez les preuves en cas d'escroquerie pour
            déposer plainte auprès de la DCPJ ou alerter l'ANCy (cert.tg).
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Panel className="space-y-3 border-2 shadow-neo-sm">
            <div className="flex items-center gap-2 font-black text-base">
              <Smartphone className="size-5 text-primary" />
              <h3>{t("guide.androidTitle")}</h3>
            </div>
            <ol className="space-y-2 pl-4 list-decimal text-xs sm:text-sm text-muted-foreground font-medium">
              {[0, 1, 2].map((idx) => (
                <li key={idx} className="leading-relaxed">
                  {t(`guide.androidSteps.${idx}`)}
                </li>
              ))}
            </ol>
          </Panel>

          <Panel className="space-y-3 border-2 shadow-neo-sm">
            <div className="flex items-center gap-2 font-black text-base">
              <Smartphone className="size-5 text-primary" />
              <h3>{t("guide.iosTitle")}</h3>
            </div>
            <ol className="space-y-2 pl-4 list-decimal text-xs sm:text-sm text-muted-foreground font-medium">
              {[0, 1, 2].map((idx) => (
                <li key={idx} className="leading-relaxed">
                  {t(`guide.iosSteps.${idx}`)}
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>

      <Panel className="bg-night text-night-foreground border-2 border-sidebar-border shadow-neo-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black flex items-center gap-2 text-electric">
              <Headphones className="size-5" /> Numéros d'Urgence & Signalement au Togo
            </h3>
            <p className="text-xs text-night-muted font-medium">
              En cas de doute ou de tentative avérée d'escroquerie, contactez directement :
            </p>
            <div className="flex flex-wrap gap-2.5 pt-2 text-xs">
              <span className="rounded-xl border border-white/20 bg-white/10 px-3 py-1 font-mono font-bold">
                Togocom : 888
              </span>
              <span className="rounded-xl border border-white/20 bg-white/10 px-3 py-1 font-mono font-bold">
                Moov Africa : 100
              </span>
              <span className="rounded-xl border border-white/20 bg-white/10 px-3 py-1 font-mono font-bold">
                Police / DCPJ : 117
              </span>
              <span className="rounded-xl border border-white/20 bg-white/10 px-3 py-1 font-mono font-bold">
                ANCy CERT.TG : cert.tg
              </span>
            </div>
          </div>

          <Button
            asChild
            variant="hero"
            className="shrink-0 shadow-neo border-2 border-white/20 font-bold"
          >
            <Link to="/sms">
              Scanner un SMS suspect <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </Panel>
    </div>
  );
}
