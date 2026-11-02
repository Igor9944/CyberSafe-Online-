import React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function WavyCyberGrid({
  className = "opacity-25",
  opacity,
  variant = "curved",
}: {
  className?: string;
  opacity?: number;
  variant?: "curved" | "perspective";
}) {
  if (variant === "perspective") {
    return (
      <svg
        aria-hidden="true"
        style={opacity !== undefined ? { opacity } : undefined}
        className={cn("pointer-events-none absolute inset-0 size-full stroke-current", className)}
        fill="none"
        viewBox="0 0 800 600"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M 50 0 C 120 180, 80 420, 20 600" strokeWidth="0.8" />
        <path d="M 150 0 C 220 170, 190 390, 140 600" strokeWidth="0.8" />
        <path d="M 270 0 C 330 190, 310 410, 260 600" strokeWidth="0.8" />
        <path d="M 390 0 C 460 210, 420 400, 410 600" strokeWidth="0.8" />
        <path d="M 510 0 C 580 170, 560 410, 540 600" strokeWidth="0.8" />
        <path d="M 640 0 C 690 200, 670 380, 680 600" strokeWidth="0.8" />
        <path d="M 760 0 C 820 180, 780 430, 790 600" strokeWidth="0.8" />

        <path d="M 0 50 C 190 120, 410 80, 800 30" strokeWidth="0.8" />
        <path d="M 0 140 C 210 220, 430 160, 800 120" strokeWidth="0.8" />
        <path d="M 0 250 C 240 330, 470 230, 800 240" strokeWidth="0.8" />
        <path d="M 0 360 C 200 420, 490 340, 800 370" strokeWidth="0.8" />
        <path d="M 0 470 C 230 530, 520 460, 800 480" strokeWidth="0.8" />
        <path d="M 0 570 C 260 590, 540 550, 800 580" strokeWidth="0.8" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      style={opacity !== undefined ? { opacity } : undefined}
      className={cn("pointer-events-none absolute inset-0 size-full stroke-current", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="wavy-cyber-mesh" width="120" height="120" patternUnits="userSpaceOnUse">
          <path d="M0 15 Q 30 5, 60 24 T 120 15" strokeWidth="0.85" />
          <path d="M0 35 Q 35 45, 65 26 T 120 35" strokeWidth="0.85" />
          <path d="M0 55 Q 25 45, 60 66 T 120 55" strokeWidth="0.85" />
          <path d="M0 75 Q 35 88, 65 65 T 120 75" strokeWidth="0.85" />
          <path d="M0 95 Q 28 85, 60 105 T 120 95" strokeWidth="0.85" />
          <path d="M0 115 Q 35 125, 65 106 T 120 115" strokeWidth="0.85" />

          <path d="M15 0 Q 5 30, 24 60 T 15 120" strokeWidth="0.85" />
          <path d="M35 0 Q 45 35, 26 65 T 35 120" strokeWidth="0.85" />
          <path d="M55 0 Q 45 25, 66 60 T 55 120" strokeWidth="0.85" />
          <path d="M75 0 Q 88 35, 65 65 T 75 120" strokeWidth="0.85" />
          <path d="M95 0 Q 85 28, 105 60 T 95 120" strokeWidth="0.85" />
          <path d="M115 0 Q 125 35, 106 65 T 115 120" strokeWidth="0.85" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#wavy-cyber-mesh)" />
    </svg>
  );
}

export function TopographicContours({ className = "opacity-15" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 size-full stroke-current", className)}
      fill="none"
      viewBox="0 0 800 500"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M -20 180 C 120 100, 200 260, 360 150 C 520 40, 600 280, 820 190"
        strokeWidth="1.3"
        strokeDasharray="4 6"
      />
      <path
        d="M -20 230 C 140 150, 220 310, 380 200 C 540 90, 620 330, 820 240"
        strokeWidth="1.3"
      />
      <path
        d="M -20 290 C 160 210, 240 370, 410 260 C 580 150, 640 390, 820 300"
        strokeWidth="1.3"
        strokeDasharray="3 5"
      />

      <path
        d="M 120 60 C 160 20, 240 30, 260 90 C 280 150, 200 190, 150 160 C 100 130, 80 100, 120 60 Z"
        strokeWidth="1"
      />
      <path
        d="M 140 75 C 170 45, 220 55, 235 95 C 250 135, 195 160, 160 140 C 125 120, 115 95, 140 75 Z"
        strokeWidth="0.9"
        strokeDasharray="3 3"
      />

      <path
        d="M 540 280 C 620 220, 710 240, 740 320 C 770 400, 660 460, 580 430 C 500 400, 460 340, 540 280 Z"
        strokeWidth="1.1"
      />
      <path
        d="M 570 310 C 625 260, 685 275, 710 335 C 735 395, 650 435, 595 410 C 540 385, 515 350, 570 310 Z"
        strokeWidth="0.9"
        strokeDasharray="4 4"
      />

      <path
        d="M 330 360 C 370 320, 440 340, 450 390 C 460 440, 390 470, 350 450 C 310 430, 290 400, 330 360 Z"
        strokeWidth="0.9"
      />
    </svg>
  );
}

export function MemphisDoodle({
  variant = "wave",
  className,
}: {
  variant?:
    "wave" | "zigzag" | "loop" | "spark" | "spiral" | "concentric-arc" | "pretzel" | "squiggle";
  className?: string;
}) {
  if (variant === "zigzag") {
    return (
      <svg
        aria-hidden="true"
        className={cn("size-6 stroke-current fill-none", className)}
        viewBox="0 0 40 16"
      >
        <path
          d="M2 14 L10 2 L18 14 L26 2 L34 14 L38 8"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (variant === "loop") {
    return (
      <svg
        aria-hidden="true"
        className={cn("size-6 stroke-current fill-none", className)}
        viewBox="0 0 32 32"
      >
        <path
          d="M 6 24 C 6 12, 16 6, 22 12 C 28 18, 18 26, 12 20 C 6 14, 18 6, 26 14"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (variant === "spiral") {
    return (
      <svg
        aria-hidden="true"
        className={cn("size-6 stroke-current fill-none", className)}
        viewBox="0 0 36 36"
      >
        <path
          d="M 18 18 A 3 3 0 0 1 18 12 A 7 7 0 0 1 25 19 A 11 11 0 0 1 14 30 A 15 15 0 0 1 3 15"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (variant === "concentric-arc") {
    return (
      <svg
        aria-hidden="true"
        className={cn("size-6 stroke-current fill-none", className)}
        viewBox="0 0 32 32"
      >
        <path d="M 6 26 A 20 20 0 0 1 26 6" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 12 26 A 14 14 0 0 1 26 12" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 18 26 A 8 8 0 0 1 26 18" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (variant === "pretzel") {
    return (
      <svg
        aria-hidden="true"
        className={cn("size-6 stroke-current fill-none", className)}
        viewBox="0 0 36 24"
      >
        <path
          d="M 6 18 C 0 12, 0 4, 8 4 C 16 4, 18 20, 26 20 C 34 20, 36 12, 30 6 C 24 0, 16 16, 8 16"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (variant === "squiggle") {
    return (
      <svg
        aria-hidden="true"
        className={cn("size-8 stroke-current fill-none", className)}
        viewBox="0 0 56 16"
      >
        <path d="M2 8 Q 8 0, 14 8 T 26 8 T 38 8 T 50 8" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  if (variant === "spark") {
    return (
      <svg aria-hidden="true" className={cn("size-5 fill-current", className)} viewBox="0 0 24 24">
        <path d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className={cn("size-7 stroke-current fill-none", className)}
      viewBox="0 0 48 16"
    >
      <path
        d="M2 8 C 8 2, 14 14, 20 8 C 26 2, 32 14, 38 8 C 42 4, 46 12, 48 8"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export type StickerTone =
  "lime" | "yellow" | "cyan" | "purple" | "rose" | "orange" | "dark" | "white";

const STICKER_STYLES: Record<StickerTone, string> = {
  lime: "bg-[#D9F99D] text-slate-950 border-slate-950 shadow-[2.5px_2.5px_0px_0px_#0f172a] dark:border-white/40 dark:shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,0.95)]",
  yellow:
    "bg-[#FEF08A] text-slate-950 border-slate-950 shadow-[2.5px_2.5px_0px_0px_#0f172a] dark:border-white/40 dark:shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,0.95)]",
  cyan: "bg-[#BAE6FD] text-slate-950 border-slate-950 shadow-[2.5px_2.5px_0px_0px_#0f172a] dark:border-white/40 dark:shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,0.95)]",
  purple:
    "bg-[#E9D5FF] text-slate-950 border-slate-950 shadow-[2.5px_2.5px_0px_0px_#0f172a] dark:border-white/40 dark:shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,0.95)]",
  rose: "bg-[#FECDD3] text-slate-950 border-slate-950 shadow-[2.5px_2.5px_0px_0px_#0f172a] dark:border-white/40 dark:shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,0.95)]",
  orange:
    "bg-[#FED7AA] text-slate-950 border-slate-950 shadow-[2.5px_2.5px_0px_0px_#0f172a] dark:border-white/40 dark:shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,0.95)]",
  dark: "bg-slate-950 text-white border-slate-700 shadow-[2.5px_2.5px_0px_0px_#38bdf8] dark:border-slate-500 dark:shadow-[2.5px_2.5px_0px_0px_#38bdf8]",
  white:
    "bg-white text-slate-950 border-slate-950 shadow-[2.5px_2.5px_0px_0px_#0f172a] dark:bg-slate-900 dark:text-slate-100 dark:border-white/50 dark:shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,0.95)]",
};

export function CyberSticker({
  tone = "lime",
  icon: Icon,
  children,
  className,
  rotate = "none",
  peel = false,
}: {
  tone?: StickerTone;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  rotate?: "none" | "left" | "right";
  peel?: boolean;
}) {
  const rotateClass =
    rotate === "left"
      ? "-rotate-2 hover:rotate-0"
      : rotate === "right"
        ? "rotate-2 hover:rotate-0"
        : "hover:-rotate-1";

  return (
    <span
      className={cn(
        "relative inline-flex items-center gap-1.5 rounded-xl border-2 px-2.5 py-1 text-xs font-black tracking-tight transition-all duration-200 select-none hover:-translate-y-0.5 active:translate-y-0.5",
        STICKER_STYLES[tone],
        rotateClass,
        className,
      )}
    >
      {Icon && <Icon className="size-3.5 stroke-[2.5]" />}
      <span>{children}</span>
      {peel && (
        <span
          aria-hidden="true"
          className="absolute -bottom-1 -right-1 size-2.5 bg-slate-900/30 rounded-tl-sm pointer-events-none"
        />
      )}
    </span>
  );
}

export function CyberGlyph({
  icon: Icon,
  size = "md",
  className,
  variant = "dark",
}: {
  icon: LucideIcon;
  size?: "sm" | "md" | "lg";
  className?: string;
  variant?: "dark" | "light" | "electric";
}) {
  const sizeClasses = {
    sm: "size-8 rounded-lg",
    md: "size-11 rounded-xl",
    lg: "size-14 rounded-2xl",
  }[size];

  const iconSizes = {
    sm: "size-4 stroke-[2.4]",
    md: "size-5 stroke-[2.4]",
    lg: "size-7 stroke-[2.4]",
  }[size];

  const variantClasses = {
    dark: "bg-slate-950 text-white border-2 border-slate-900 shadow-[2.5px_2.5px_0px_0px_#0f172a] dark:bg-slate-900 dark:text-cyan-400 dark:border-cyan-400/60 dark:shadow-[2.5px_2.5px_0px_0px_#06b6d4]",
    light:
      "bg-white text-slate-950 border-2 border-slate-900 shadow-[2.5px_2.5px_0px_0px_#0f172a] dark:bg-slate-900 dark:text-white dark:border-white/40 dark:shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,0.95)]",
    electric:
      "bg-electric text-white border-2 border-slate-950 shadow-[2.5px_2.5px_0px_0px_#0f172a] dark:border-white/40 dark:shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,0.95)]",
  }[variant];

  return (
    <div
      className={cn(
        "grid place-items-center shrink-0 transition-transform hover:scale-105",
        sizeClasses,
        variantClasses,
        className,
      )}
    >
      <Icon className={iconSizes} />
    </div>
  );
}

export function CyberCard({
  children,
  className,
  tone = "default",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "tactile" | "lime" | "cyan" | "night";
  onClick?: () => void;
}) {
  const toneClasses = {
    default:
      "border-2 border-border/90 bg-card shadow-[3px_3px_0px_0px_rgba(15,23,42,0.08)] dark:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.95)]",
    tactile:
      "border-2 border-foreground/80 bg-card text-card-foreground shadow-[3px_3px_0px_0px_rgba(15,23,42,0.85)] dark:border-border dark:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.95)]",
    lime: "border-2 border-slate-900 bg-[#ECFCCB]/80 text-slate-950 shadow-[3px_3px_0px_0px_rgba(15,23,42,0.9)] dark:bg-lime-950/40 dark:text-lime-100 dark:border-lime-500/40 dark:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.95)]",
    cyan: "border-2 border-slate-900 bg-[#E0F2FE]/80 text-slate-950 shadow-[3px_3px_0px_0px_rgba(15,23,42,0.9)] dark:bg-sky-950/40 dark:text-sky-100 dark:border-sky-500/40 dark:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.95)]",
    night:
      "border-2 border-border/70 bg-night text-night-foreground shadow-[3px_3px_0px_0px_rgba(56,189,248,0.25)] dark:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.95)]",
  }[tone];

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl p-5 transition-all duration-200",
        toneClasses,
        onClick && "cursor-pointer hover:-translate-y-0.5 active:translate-y-0.5",
        className,
      )}
    >
      {children}
    </div>
  );
}
