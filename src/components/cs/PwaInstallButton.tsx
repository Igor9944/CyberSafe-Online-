import { useState, useEffect } from "react";
import { Download, Smartphone, Check, Sparkles, X, Share } from "lucide-react";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface PwaInstallButtonProps {
  className?: string;
  variant?: "header" | "button" | "card" | "mobile-bar";
  compact?: boolean;
}

export function PwaInstallButton({
  className,
  variant = "header",
  compact = false,
}: PwaInstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect if already installed or running in standalone mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn("PWA install error:", err);
      }
    } else if (isIos) {
      setShowIosModal(true);
    } else {
      // Browser doesn't support or already prompt consumed, show gentle notification or tip
      setShowIosModal(true);
    }
  };

  if (isInstalled) {
    if (variant === "card") {
      return (
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-bold text-emerald-400",
            compact && "px-3 py-2",
            className,
          )}
        >
          <Check className="size-4 shrink-0 text-emerald-400" />
          <span>
            {compact
              ? "Application installée"
              : "Application CyberSafe installée (Mode Standalone)"}
          </span>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      {variant === "header" && (
        <button
          type="button"
          onClick={handleInstallClick}
          title="Installer l'application CyberSafe (PWA)"
          aria-label="Installer l'application CyberSafe"
          className={cn(
            "group relative inline-flex items-center gap-1.5 rounded-xl border-2 border-slate-900 dark:border-cyan-400/80 bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-1.5 text-xs font-black text-white shadow-neo-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-neo active:translate-y-0.5 active:shadow-none cursor-pointer overflow-hidden",
            className,
          )}
        >
          <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
          <Download className="size-3.5 transition-transform group-hover:translate-y-0.5" />
          <span className="hidden sm:inline">Installer l'App</span>
          <span className="sm:hidden">Installer</span>
        </button>
      )}

      {variant === "mobile-bar" && (
        <button
          type="button"
          onClick={handleInstallClick}
          aria-label="Installer l'application"
          className={cn(
            "group grid size-8 place-items-center rounded-lg border border-cyan-400/40 bg-cyan-950/60 text-cyan-300 hover:bg-cyan-900/60 transition cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
            className,
          )}
          title="Installer l'application sur votre écran d'accueil"
        >
          <Download className="size-4 text-cyan-300 transition-transform group-hover:-translate-y-0.5" />
        </button>
      )}

      {variant === "button" && (
        <button
          type="button"
          onClick={handleInstallClick}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-900 dark:border-cyan-400 bg-electric px-4 py-2.5 text-sm font-black text-white shadow-neo transition-all duration-200 hover:-translate-y-0.5 hover:shadow-neo-lg active:translate-y-0.5 active:shadow-none cursor-pointer",
            className,
          )}
        >
          <Smartphone className="size-4" />
          <span>Installer CyberSafe sur mon appareil</span>
        </button>
      )}

      {variant === "card" && (
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border-2 border-slate-900 dark:border-cyan-400/70 bg-gradient-to-br from-slate-900 to-slate-950 p-4 text-white shadow-neo-sm",
            compact && "rounded-xl p-3",
            className,
          )}
        >
          {compact ? (
            <div className="flex items-center gap-2.5">
              <div className="grid size-8 shrink-0 place-items-center rounded-lg border border-cyan-400/40 bg-cyan-500/20 text-cyan-300">
                <Smartphone className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-black text-white">Installer CyberSafe</h4>
                <p className="mt-0.5 text-[10px] leading-snug text-slate-300">
                  Accès rapide depuis l’écran d’accueil.
                </p>
              </div>
              <button
                type="button"
                onClick={handleInstallClick}
                className={cn(
                  "min-h-10 shrink-0 rounded-lg bg-cyan-400 px-3 text-xs font-black text-slate-950 transition-colors hover:bg-cyan-300",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                )}
              >
                Installer
              </button>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="grid size-10 place-items-center rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300">
                  <Smartphone className="size-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                    Installer l'application <Sparkles className="size-3 text-cyan-300" />
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Accédez à CyberSafe hors-ligne, directement depuis l'écran d'accueil comme
                    YouTube ou WhatsApp.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleInstallClick}
                className="shrink-0 rounded-xl bg-cyan-400 px-3 py-1.5 text-xs font-black text-slate-950 shadow-neo-sm hover:bg-cyan-300 transition-transform active:translate-y-0.5 cursor-pointer"
              >
                Installer
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal / Dialog for iOS and manual installation instructions */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-2xl border-2 border-slate-900 dark:border-cyan-400 bg-card p-5 text-card-foreground shadow-neo-lg">
            <button
              type="button"
              onClick={() => setShowIosModal(false)}
              aria-label="Fermer"
              className="absolute right-3.5 top-3.5 rounded-lg p-1 text-muted-foreground hover:bg-accent transition"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-primary/20 text-primary">
                <Download className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-black">Installer CyberSafe</h3>
                <p className="text-xs text-muted-foreground">Application Web Progressive (PWA)</p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-xs leading-relaxed">
              {isIos ? (
                <>
                  <p className="font-semibold text-foreground">
                    Pour installer CyberSafe sur votre iPhone ou iPad :
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground pl-1">
                    <li>
                      Appuyez sur le bouton <strong>Partager</strong>{" "}
                      <Share className="inline size-3.5 mx-1" /> dans la barre de Safari.
                    </li>
                    <li>
                      Faites défiler le menu vers le bas et touchez{" "}
                      <strong>« Sur l'écran d'accueil »</strong>.
                    </li>
                    <li>
                      Confirmez en appuyant sur <strong>« Ajouter »</strong> en haut à droite.
                    </li>
                  </ol>
                </>
              ) : (
                <>
                  <p className="font-semibold text-foreground">
                    Pour installer CyberSafe sur votre ordinateur ou smartphone :
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground pl-1">
                    <li>
                      Dans Chrome, Edge ou Brave, cliquez sur l'icône <strong>Installer</strong>{" "}
                      dans la barre d'adresse (à droite de l'URL).
                    </li>
                    <li>
                      Ou ouvrez le menu du navigateur (les trois points{" "}
                      <code className="px-1 py-0.5 rounded bg-muted">⋮</code>) et sélectionnez{" "}
                      <strong>« Installer CyberSafe Online... »</strong>.
                    </li>
                  </ol>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowIosModal(false)}
              className="mt-5 w-full rounded-xl bg-primary py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition"
            >
              Compris !
            </button>
          </div>
        </div>
      )}
    </>
  );
}
