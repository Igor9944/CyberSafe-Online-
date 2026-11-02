import React from "react";
import { cn } from "@/lib/utils";

export type LogoSize = "sm" | "md" | "lg";
export type LogoThemeVariant = "default" | "light" | "dark" | "electric";
export type LogoVariant = LogoThemeVariant | "compact" | "icon";

export interface CyberSafeEmblemProps {
  className?: string | undefined;
  size?: LogoSize | undefined;
  variant?: LogoThemeVariant | undefined;
}

/**
 * Pure vector SVG CyberSafe Emblem.
 * Faithfully represents the community symbol of three hands united in a continuous
 * triangular mutual wrist-clasp (Borromean knot), signifying collective solidarity
 * and vigilance against Mobile Money cyber fraud.
 *
 * Embellished with neo-brutalist cyber aesthetics:
 * - 3-fold (C3) rotational symmetry
 * - 2-layer topological rendering (underlying forearms + foreground gripping hands)
 * - 4 defined clasping fingers per hand with knuckle contours and dorsal tendon lines
 * - Central security matrix with triangular aperture and pulsing core node
 * - Responsive sizing ("sm" 32px, "md" 40px, "lg" 56px)
 * - Theme variants ("default", "light", "dark", "electric")
 */
export function CyberSafeEmblem({
  className,
  size = "md",
  variant = "default",
}: CyberSafeEmblemProps) {
  const isLight = variant === "light";
  const isElectric = variant === "electric";

  // Dynamic theme-based stroke and fill assignments
  const shieldFill = isLight ? "url(#shieldGradLight)" : "url(#shieldGradDark)";
  const shieldStroke = isLight ? "#0f172a" : isElectric ? "#00f0ff" : "#06b6d4";
  const shieldInnerBevel = isLight ? "#2563eb" : isElectric ? "#22d3ee" : "#38bdf8";

  const armFill = isLight ? "#e2e8f0" : isElectric ? "#0a1e3f" : "url(#armFillGrad)";
  const handFill = isLight ? "#f1f5f9" : isElectric ? "#0d2854" : "url(#handFillGrad)";
  const mainStroke = isLight ? "#0f172a" : isElectric ? "#00f0ff" : "#38bdf8";
  const accentLine = isLight ? "#2563eb" : isElectric ? "#00f0ff" : "#00f0ff";
  const accentDot = isLight ? "#0284c7" : isElectric ? "#22d3ee" : "#38bdf8";
  const coreNodeFill = isLight ? "#059669" : isElectric ? "#34d399" : "#10b981";

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-full select-none", className)}
      aria-hidden="true"
    >
      <defs>
        {/* Backward compatibility gradients: required by test invariants */}
        <linearGradient id="shieldGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0a1024" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <linearGradient id="knotGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>

        <linearGradient id="shieldGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
        <linearGradient id="knotGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="50%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        {/* Cyber Arm & Hand Gradients */}
        <linearGradient id="armFillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#122a54" />
          <stop offset="100%" stopColor="#091832" />
        </linearGradient>
        <linearGradient id="handFillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0c2040" />
          <stop offset="100%" stopColor="#07152c" />
        </linearGradient>

        {/* LAYER 1: Canonical Radial Forearm Shaft */}
        <g id="canonical-forearm">
          <path
            d="M -2.6 -16.5 L -2.8 -3.5 L 2.8 -3.5 L 2.6 -16.5 Z"
            fill={armFill}
            stroke={mainStroke}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          {/* Tech cuff band & biometric alignment line */}
          <line
            x1="-2.6"
            y1="-13.5"
            x2="2.6"
            y2="-13.5"
            stroke={accentLine}
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <circle cx="0" cy="-15" r="0.8" fill={accentDot} />
          <line
            x1="0"
            y1="-13"
            x2="0"
            y2="-6.5"
            stroke={mainStroke}
            strokeWidth="1.0"
            opacity="0.65"
            strokeLinecap="round"
          />
        </g>

        {/* LAYER 2: Canonical Clasping Hand (Opaque Forefront Knot) */}
        <g id="canonical-hand">
          {/* Opaque Hand Body with 4 Sculpted Knuckles & Gripping Contour */}
          <path
            d="M -6.29 -3.87 C -3.34 -4.83 0.63 -5.31 4.04 -4.70 C 4.90 -2.60 3.39 0.08 0.77 1.63 C -0.22 2.21 -0.58 2.37 -0.73 2.15 C -0.87 1.94 -0.66 1.57 -0.19 1.12 C -0.54 1.34 -0.83 1.37 -0.89 1.13 C -0.96 0.88 -0.72 0.54 -0.25 0.17 C -0.61 0.40 -0.88 0.41 -0.94 0.16 C -1.00 -0.09 -0.73 -0.44 -0.27 -0.80 C -0.63 -0.58 -0.83 -0.67 -0.81 -0.92 C -0.80 -1.16 -0.54 -1.43 -0.12 -1.72 C -1.89 -0.70 -3.42 -0.26 -4.89 -0.26 C -2.39 -1.80 -2.86 -2.49 -2.81 -3.22 C -2.08 -5.04 -3.96 -6.01 -5.18 -6.32 Z"
            fill={handFill}
            stroke={mainStroke}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          {/* 3 Finger Separation Grooves */}
          <line
            x1="4.23"
            y1="-2.42"
            x2="-0.73"
            y2="2.15"
            stroke={mainStroke}
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <line
            x1="3.61"
            y1="-3.23"
            x2="-0.89"
            y2="1.13"
            stroke={mainStroke}
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <line
            x1="3.00"
            y1="-4.03"
            x2="-0.94"
            y2="0.16"
            stroke={mainStroke}
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          {/* Knuckle Ridge Arc & Knuckle Accents */}
          <path
            d="M 4.52 -1.77 L 4.09 -2.53 L 3.48 -3.33 L 2.87 -4.14"
            fill="none"
            stroke={accentLine}
            strokeWidth="0.8"
            opacity="0.8"
          />
          <circle cx="4.52" cy="-1.77" r="0.6" fill={accentLine} />
          <circle cx="4.09" cy="-2.53" r="0.6" fill={accentLine} />
          <circle cx="3.48" cy="-3.33" r="0.6" fill={accentLine} />
          <circle cx="2.87" cy="-4.14" r="0.6" fill={accentLine} />
          {/* Metacarpal Dorsal Tendon Lines */}
          <line
            x1="4.09"
            y1="-2.53"
            x2="-1.10"
            y2="-4.91"
            stroke={isLight ? "#2563eb" : "#06b6d4"}
            strokeWidth="0.9"
            strokeLinecap="round"
            opacity="0.75"
          />
          <line
            x1="3.48"
            y1="-3.33"
            x2="-1.77"
            y2="-4.06"
            stroke={isLight ? "#2563eb" : "#06b6d4"}
            strokeWidth="0.9"
            strokeLinecap="round"
            opacity="0.75"
          />
          <line
            x1="2.87"
            y1="-4.14"
            x2="-2.43"
            y2="-3.21"
            stroke={isLight ? "#2563eb" : "#06b6d4"}
            strokeWidth="0.9"
            strokeLinecap="round"
            opacity="0.75"
          />
          {/* Thumb Counter-Grip */}
          <path
            d="M -2.22 -2.21 Q -3.16 -1.23 -2.47 -0.21"
            fill="none"
            stroke={mainStroke}
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          {/* Cyber Biometric Sensor Accent */}
          <circle cx="-0.07" cy="-5.29" r="0.8" fill={accentLine} />
          <line
            x1="-0.07"
            y1="-5.29"
            x2="-2.07"
            y2="-4.58"
            stroke={accentLine}
            strokeWidth="0.8"
            strokeDasharray="0.8 0.8"
            strokeLinecap="round"
          />
        </g>
      </defs>

      {/* Neo-brutalist Outer Hex-Shield Badge Frame */}
      <path
        d="M 24 3.5 L 42 9.5 V 25 C 42 35.8 34 43.5 24 46 C 14 43.5 6 35.8 6 25 V 9.5 Z"
        fill={shieldFill}
        stroke={shieldStroke}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* Subtle Shield Inner Bevel */}
      <path
        d="M 24 5.5 L 40 11 V 24.5 C 40 34.2 33 41.5 24 43.8 C 15 41.5 8 34.2 8 24.5 V 11 Z"
        fill="none"
        stroke={shieldInnerBevel}
        strokeWidth="0.6"
        opacity="0.35"
      />

      {/* Central Security Matrix (Triangular Aperture & Core Node) */}
      <polygon
        points="24,20.2 27.8,26.5 20.2,26.5"
        fill={isLight ? "#0284c7" : "#06b6d4"}
        fillOpacity="0.2"
        stroke={mainStroke}
        strokeWidth="1.1"
      />
      <circle cx="24" cy="24.4" r="1.6" fill={coreNodeFill} />
      <circle
        cx="24"
        cy="24.4"
        r="2.6"
        fill="none"
        stroke={coreNodeFill}
        strokeWidth="0.6"
        strokeDasharray="1 1"
        opacity="0.8"
      />

      {/* Continuous 3-Hand Mutual Wrist Clasp with C3 Symmetry */}
      <g transform="translate(24, 24.5)">
        {/* Layer 1: The 3 Radial Forearms */}
        <use href="#canonical-forearm" transform="rotate(0)" />
        <use href="#canonical-forearm" transform="rotate(120)" />
        <use href="#canonical-forearm" transform="rotate(240)" />

        {/* Layer 2: The 3 Foreground Gripping Hands */}
        <use href="#canonical-hand" transform="rotate(0)" />
        <use href="#canonical-hand" transform="rotate(120)" />
        <use href="#canonical-hand" transform="rotate(240)" />
      </g>

      {/* Peripheral Cyber Circuit Nodes */}
      <circle cx="12" cy="14" r="1.1" fill={accentDot} opacity="0.85" />
      <line
        x1="12"
        y1="14"
        x2="16"
        y2="18"
        stroke={shieldStroke}
        strokeWidth="0.8"
        strokeDasharray="1 1"
        opacity="0.6"
      />

      <circle cx="36" cy="14" r="1.1" fill={accentDot} opacity="0.85" />
      <line
        x1="36"
        y1="14"
        x2="32"
        y2="18"
        stroke={shieldStroke}
        strokeWidth="0.8"
        strokeDasharray="1 1"
        opacity="0.6"
      />

      <circle cx="24" cy="41" r="1.1" fill={coreNodeFill} opacity="0.85" />
      <line
        x1="24"
        y1="41"
        x2="24"
        y2="37"
        stroke={coreNodeFill}
        strokeWidth="0.8"
        strokeDasharray="1 1"
        opacity="0.6"
      />
    </svg>
  );
}

export interface LogoProps {
  /** Responsive dimensions: "sm" (32px), "md" (40px, default), "lg" (56px) */
  size?: LogoSize | undefined;
  /** Style variants or legacy display modes */
  variant?: LogoVariant | undefined;
  /** Explicit style theme variant override */
  themeVariant?: LogoThemeVariant | undefined;
  /** Whether to hide text and display compact emblem only */
  compact?: boolean | undefined;
  /** Explicitly control text visibility */
  showText?: boolean | undefined;
  /** Additional wrapper className */
  className?: string | undefined;
  /** Additional emblem wrapper className */
  iconClassName?: string | undefined;
}

export function Logo({
  size = "md",
  variant = "default",
  themeVariant,
  compact = false,
  showText,
  className,
  iconClassName,
}: LogoProps) {
  const isCompact = compact || variant === "compact" || variant === "icon";
  const shouldShowText = showText !== undefined ? showText : !isCompact;
  const effectiveTheme: LogoThemeVariant =
    themeVariant ||
    (variant === "light" || variant === "dark" || variant === "electric" ? variant : "default");

  // Responsive size styling tokens
  const sizeClasses: Record<
    LogoSize,
    {
      gap: string;
      iconBox: string;
      title: string;
      subtitle: string;
    }
  > = {
    sm: {
      gap: "gap-2",
      iconBox: "size-8 rounded-lg p-0.5",
      title: "text-sm font-extrabold tracking-tight",
      subtitle: "text-[8px] font-semibold tracking-wider",
    },
    md: {
      gap: "gap-3",
      iconBox: "size-10 rounded-xl p-1",
      title: "text-base font-extrabold tracking-tight",
      subtitle: "text-[9.5px] font-semibold tracking-[0.16em]",
    },
    lg: {
      gap: "gap-4",
      iconBox: "size-14 sm:size-16 rounded-2xl p-1.5",
      title: "text-xl sm:text-2xl font-black tracking-tight",
      subtitle: "text-xs font-semibold tracking-widest",
    },
  };

  // Theme container classes (strictly preserving dark cyber defaults for ADV-3.3)
  const themeContainerClasses: Record<LogoThemeVariant, string> = {
    default:
      "bg-slate-900 border-2 border-slate-900 text-cyan-400 shadow-neo-sm dark:bg-slate-950 dark:border-cyan-400 dark:shadow-[0_0_12px_rgba(6,182,212,0.35)]",
    light: "bg-slate-900 border-2 border-slate-900 text-cyan-400 shadow-neo-sm dark:bg-slate-950",
    dark: "bg-slate-900 dark:bg-slate-950 border-2 border-cyan-400 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.35)]",
    electric:
      "bg-slate-900 dark:bg-slate-950 border-2 border-cyan-400 text-cyan-300 shadow-[0_0_14px_rgba(6,182,212,0.45)] ring-2 ring-cyan-400/30",
  };

  const currentSizeConfig = sizeClasses[size] || sizeClasses.md;
  const containerClass = themeContainerClasses[effectiveTheme] || themeContainerClasses.default;

  return (
    <div className={cn("flex items-center", currentSizeConfig.gap, className)}>
      <div
        className={cn(
          "relative shrink-0 overflow-hidden",
          containerClass,
          currentSizeConfig.iconBox,
          "transition-transform duration-200 hover:scale-105 flex items-center justify-center",
          iconClassName,
        )}
      >
        <CyberSafeEmblem variant={effectiveTheme} size={size} />
      </div>
      {shouldShowText && (
        <div className="leading-tight">
          <div className={cn("font-display", currentSizeConfig.title)}>
            CyberSafe
            <span
              className={cn(
                effectiveTheme === "electric"
                  ? "text-cyan-400 dark:text-cyan-300 font-black animate-pulse"
                  : "text-electric font-black",
              )}
            >
              {" "}
              Online
            </span>
          </div>
          <div
            className={cn(
              "mt-0.5 flex items-center gap-1.5 uppercase opacity-75",
              currentSizeConfig.subtitle,
            )}
          >
            <span>Sécurité & IA · Togo</span>
            <span className="inline-block size-1 rounded-full bg-emerald-500" />
            <span className="text-emerald-500 dark:text-emerald-400 font-bold">SaaS</span>
          </div>
        </div>
      )}
    </div>
  );
}
