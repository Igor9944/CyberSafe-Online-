import { useEffect, useState } from "react";
import type { AnalysisResult, RiskLevel } from "./risk-engine";

export type ScanType = "SMS" | "QR" | "Audio";

export interface HistoryFinding {
  label: string;
  detail?: string;
}

export interface HistoryEntry {
  id: string;
  type: ScanType;
  date: string;
  level: RiskLevel;
  score: number;
  summary: string;
  findings: HistoryFinding[];
  recommendations: string[];
}

const KEY = "cybersafe.history.v1";
const EVT = "cybersafe-history";

export function readHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    return raw.map((entry: any) => ({
      ...entry,
      findings: Array.isArray(entry.findings)
        ? entry.findings.map((f: any) =>
            typeof f === "string" ? { label: f, detail: "" } : { label: f?.label || "", detail: f?.detail || "" },
          )
        : [],
    }));
  } catch {
    return [];
  }
}

export function saveAnalysis(type: ScanType, r: AnalysisResult) {
  if (typeof window === "undefined" || localStorage.getItem("cybersafe.saveHistory") === "off") return;
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    type,
    date: new Date().toISOString(),
    level: r.level,
    score: r.score,
    summary: r.summary,
    findings: r.findings.map((f) => ({
      label: typeof f === "string" ? f : f.label,
      detail: typeof f === "string" ? "" : f.detail,
    })),
    recommendations: r.recommendations,
  };
  localStorage.setItem(KEY, JSON.stringify([entry, ...readHistory()].slice(0, 100)));
  window.dispatchEvent(new Event(EVT));
}

export function deleteEntry(id: string) {
  localStorage.setItem(KEY, JSON.stringify(readHistory().filter((e) => e.id !== id)));
  window.dispatchEvent(new Event(EVT));
}

export function clearHistory() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVT));
}

export function useHistory() {
  const [items, setItems] = useState<HistoryEntry[]>([]);
  useEffect(() => {
    const sync = () => setItems(readHistory());
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return items;
}
