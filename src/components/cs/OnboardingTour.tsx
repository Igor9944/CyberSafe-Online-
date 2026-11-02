import { useState, useEffect, type ElementType } from "react";
import {
  Compass,
  ShieldCheck,
  MessageSquareWarning,
  QrCode,
  GraduationCap,
  Bot,
  Sparkles,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface OnboardingTourProps {
  open: boolean;
  onClose: () => void;
}

export interface TourStep {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
  icon: ElementType;
  tone: "lime" | "cyan" | "purple" | "yellow" | "electric";
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    badge: "Accueil",
    title: "Bienvenue sur CyberSafe Online",
    subtitle: "Votre bouclier personnel contre les cyberfraudes",
    description:
      "CyberSafe Online est votre plateforme SaaS souveraine de cyber-protection intelligente. Apprenez à vous prémunir efficacement contre les escroqueries numériques, le phishing et sécurisez vos transactions Mobile Money au quotidien.",
    highlights: [
      "Protection proactive et accessible 24/7",
      "Sécurisation ciblée Mobile Money (T-Money & Moov Money)",
      "Architecture sécurisée et respectueuse de la vie privée",
    ],
    icon: ShieldCheck,
    tone: "lime",
  },
  {
    id: "sms-scanner",
    badge: "Scanner SMS",
    title: "Scanners Phishing & SMS",
    subtitle: "Analyse intelligente des messages frauduleux en français et langues locales",
    description:
      "Analysez instantanément vos SMS, messages WhatsApp et emails suspects. Notre moteur IA combiné au modèle Google Gemma 4 détecte les tentatives d'usurpation en français ainsi qu'en langues locales (Éwé, Mina, Kabyè).",
    highlights: [
      "Détection multilingue instantanée avec score de risque",
      "Décryptage des arnaques aux faux dépôts et validations USSD",
      "Conseils de riposte immédiats et actions préventives",
    ],
    icon: MessageSquareWarning,
    tone: "cyan",
  },
  {
    id: "qr-audio",
    badge: "QR & Voix",
    title: "Détecteurs QR & Audio",
    subtitle: "Vérification des QR codes malveillants et simulations d'appels d'ingénierie sociale",
    description:
      "Inspectez tout QR code douteux avant de scanner pour neutraliser le quishing grâce à l'intégration VirusTotal, et entraînez-vous contre les attaques vocales (vishing) grâce aux simulations sonores interactives.",
    highlights: [
      "Contrôle de sécurité des URLs et certificats de redirection",
      "Simulateur audio d'ingénierie sociale et d'appels frauduleux",
      "Indicateurs de réputation et conformité des liens",
    ],
    icon: QrCode,
    tone: "yellow",
  },
  {
    id: "learning-hub",
    badge: "Espace Étudiant",
    title: "Espace d'Apprentissage & FlashCards",
    subtitle: "Modes d'entraînement interactifs Oui/Non et Bonne Réponse",
    description:
      "Accédez à l'espace apprendre et renforcez vos compétences en cybersécurité grâce aux cours interactifs et aux flashcards mémo. Testez vos réflexes en mode binaire « Oui / Non » ou défiez-vous avec le mode QCM « Bonne Réponse » avec quiz et score en direct.",
    highlights: [
      "Mode binaire « Oui / Non » avec feedback pédagogique immédiat",
      "Mode QCM « Bonne Réponse » avec explications détaillées",
      "Suivi de progression et maîtrise des modules de formation étudiant",
    ],
    icon: GraduationCap,
    tone: "purple",
  },
  {
    id: "cyber-assistant",
    badge: "Assistant IA",
    title: "Assistant Cyber & Référentiel",
    subtitle: "Conseils en direct et syntaxe officielle des opérateurs",
    description:
      "Consultez à tout instant votre assistant cyber propulsé par l'IA pour obtenir des recommandations contextualisées, et parcourez le répertoire officiel des syntaxes USSD et numéros d'urgence des opérateurs régionaux.",
    highlights: [
      "Assistant intelligent disponible pour répondre à vos questions",
      "Syntaxes USSD officielles vérifiées (T-Money, Moov)",
      "Procédures d'urgence pour blocage de compte en cas de fraude",
    ],
    icon: Bot,
    tone: "cyan",
  },
  {
    id: "theme-settings",
    badge: "Paramètres",
    title: "Thème & Paramètres",
    subtitle: "Bascule claire/sombre cyber et personnalisation de votre espace",
    description:
      "Personnalisez votre expérience selon vos besoins : activez le thème sombre cyber néo-brutaliste haute lisibilité, sélectionnez votre langue préférée et relancez ce guide d'orientation à la demande depuis l'en-tête.",
    highlights: [
      "Thème sombre à fort contraste sans reflets agressifs",
      "Support multilingue (Français, Éwé, Anglais)",
      "Guide d'orientation disponible à tout moment",
    ],
    icon: Sparkles,
    tone: "electric",
  },
];

export function OnboardingTour({ open, onClose }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  // Reset to step 0 when reopened
  useEffect(() => {
    if (open) {
      setCurrentStep(0);
    }
  }, [open]);

  // Handle escape key to dismiss
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowRight") {
        setCurrentStep((prev) => Math.min(TOUR_STEPS.length - 1, prev + 1));
      } else if (event.key === "ArrowLeft") {
        setCurrentStep((prev) => Math.max(0, prev - 1));
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const safeStep = TOUR_STEPS[currentStep] ?? TOUR_STEPS[0];
  if (!safeStep) {
    return null;
  }
  const step = safeStep;
  const StepIcon = step.icon;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  const markTourCompleted = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("cybersafe_tour_completed", "true");
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  };

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    markTourCompleted();
    onClose();
  };

  const handleFinish = () => {
    markTourCompleted();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      data-testid="onboarding-tour-backdrop"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Visite guidée interactive"
        className="relative w-full max-w-lg rounded-2xl border-2 border-border bg-card dark:bg-slate-900 p-6 sm:p-7 text-card-foreground shadow-neo transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Title bar & Controls */}
        <div className="flex items-center justify-between gap-3 border-b border-border/80 pb-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="grid size-8 place-items-center rounded-xl border border-electric/30 bg-electric/15 text-electric">
              <Compass className="size-4 animate-spin-slow" />
            </span>
            <div className="min-w-0">
              <div className="text-[11px] font-black uppercase tracking-wider text-electric">
                Guide Interactif
              </div>
              <div className="text-xs font-semibold text-muted-foreground truncate">
                Prise en main CyberSafe
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="rounded-lg bg-muted px-2.5 py-1 font-mono text-xs font-bold text-muted-foreground border border-border/50">
              Étape {currentStep + 1} / {TOUR_STEPS.length}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              title="Fermer"
              className="grid size-7 place-items-center rounded-lg border border-border/80 bg-background text-muted-foreground hover:bg-accent hover:text-foreground transition cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Step Dots indicator */}
        <div className="mt-3 flex items-center gap-1.5" aria-hidden="true">
          {TOUR_STEPS.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setCurrentStep(idx)}
              aria-label={`Aller à l'étape ${idx + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                idx === currentStep
                  ? "w-8 bg-electric"
                  : idx < currentStep
                    ? "w-3 bg-muted-foreground/60"
                    : "w-3 bg-muted",
              )}
            />
          ))}
        </div>

        {/* Step Body */}
        <div className="mt-5 space-y-4">
          <div className="flex items-start gap-3.5">
            <div
              className={cn(
                "grid size-11 shrink-0 place-items-center rounded-2xl border-2 shadow-neo-xs",
                step.tone === "lime" && "bg-lime-400/20 text-lime-400 border-lime-400/40",
                step.tone === "cyan" && "bg-cyan-400/20 text-cyan-400 border-cyan-400/40",
                step.tone === "purple" && "bg-purple-400/20 text-purple-400 border-purple-400/40",
                step.tone === "yellow" && "bg-amber-400/20 text-amber-400 border-amber-400/40",
                step.tone === "electric" && "bg-electric/20 text-electric border-electric/40",
              )}
            >
              <StepIcon className="size-5" />
            </div>

            <div className="min-w-0 flex-1">
              <span
                className={cn(
                  "inline-block rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border mb-1",
                  step.tone === "lime" && "bg-lime-400/15 text-lime-400 border-lime-400/30",
                  step.tone === "cyan" && "bg-cyan-400/15 text-cyan-400 border-cyan-400/30",
                  step.tone === "purple" && "bg-purple-400/15 text-purple-400 border-purple-400/30",
                  step.tone === "yellow" && "bg-amber-400/15 text-amber-400 border-amber-400/30",
                  step.tone === "electric" && "bg-electric/15 text-electric border-electric/30",
                )}
              >
                {step.badge}
              </span>
              <h3 className="text-base font-black tracking-tight text-foreground sm:text-lg">
                {step.title}
              </h3>
              <p className="text-xs font-semibold text-muted-foreground">
                {step.subtitle}
              </p>
            </div>
          </div>

          <p className="text-xs sm:text-sm leading-relaxed text-foreground/90">
            {step.description}
          </p>

          <div className="rounded-xl border border-border/80 bg-muted/40 p-3 space-y-1.5">
            <div className="text-[10.5px] font-black uppercase tracking-wider text-muted-foreground">
              Points clés :
            </div>
            {step.highlights.map((highlight, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-foreground/85">
                <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500 dark:text-emerald-400" />
                <span>{highlight}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-border/80 pt-4">
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-bold text-muted-foreground hover:text-foreground transition cursor-pointer underline-offset-4 hover:underline"
          >
            Passer
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={isFirstStep}
              className={cn(
                "inline-flex items-center gap-1 rounded-xl border-2 border-border/80 bg-background px-3 py-1.5 text-xs font-bold text-foreground transition shadow-neo-xs",
                isFirstStep
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-accent cursor-pointer active:translate-y-0.5 active:shadow-none",
              )}
            >
              <ChevronLeft className="size-3.5" />
              <span>Précédent</span>
            </button>

            {!isLastStep ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 rounded-xl border-2 border-slate-900 bg-electric px-4 py-1.5 text-xs font-black text-slate-950 transition hover:bg-electric/90 cursor-pointer shadow-neo-sm active:translate-y-0.5 active:shadow-none"
              >
                <span>Suivant</span>
                <ChevronRight className="size-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="inline-flex items-center gap-1.5 rounded-xl border-2 border-slate-900 bg-emerald-400 px-4 py-1.5 text-xs font-black text-slate-950 transition hover:bg-emerald-300 cursor-pointer shadow-neo-sm active:translate-y-0.5 active:shadow-none"
              >
                <CheckCircle2 className="size-3.5" />
                <span>Terminer</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingTour;
