import logoMark from "@/assets/cybersafeimage.jpeg";
import { cn } from "@/lib/utils";

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative size-10 shrink-0 overflow-hidden rounded-xl bg-white p-1 shadow-glow ring-1 ring-white/20 transition-transform duration-200 hover:scale-105">
        <img
          src={logoMark}
          alt="CyberSafe Online Logo"
          className="size-full object-contain"
        />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="font-display text-base font-extrabold tracking-tight">
            CyberSafe<span className="text-electric font-black"> Online</span>
          </div>
          <div className="mt-0.5 text-[9.5px] uppercase tracking-[0.16em] opacity-75 font-semibold">
            Sécurité & IA · Togo
          </div>
        </div>
      )}
    </div>
  );
}
