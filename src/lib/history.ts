import { useEffect, useState } from "react";
import type { AnalysisResult, RiskLevel } from "./risk-engine";

/** Historique local : seules les métadonnées sont gardées (jamais le SMS, l'image ou l'audio brut). */
export interface HistoryEntry {
  id: string;
  type: "SMS" | "QR" | "Audio";
  date: string;
  level: RiskLevel;
  score: number;
  summary: string;
  findings: string[];
  recommendations: string[];
}

const KEY = "cybersafe.history.v1";
const EVT = "cybersafe-history";

export function readHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveAnalysis(type: HistoryEntry["type"], r: AnalysisResult) {
  if (localStorage.getItem("cybersafe.saveHistory") === "off") return;
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    type,
    date: new Date().toISOString(),
    level: r.level,
    score: r.score,
    summary: r.summary,
    findings: r.findings.map((f) => f.label),
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
