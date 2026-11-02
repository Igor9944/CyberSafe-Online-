import { createWorker } from "tesseract.js";

export interface OcrExtractionResult {
  text: string;
  confidence: number;
  engine: "gemma_vision" | "tesseract_local";
}

let worker: any = null;
let workerPromise: Promise<any> | null = null;

export async function extractTextWithLocalOcr(
  imageSource: string | File | Blob,
  lang: "fra" | "eng" = "fra",
): Promise<OcrExtractionResult> {
  const loadWorker = async () => {
    const { createWorker } = await import("tesseract.js");
    const w = await createWorker(lang);
    return w;
  };

  if (!workerPromise) {
    workerPromise = loadWorker();
  }
  worker = await workerPromise;

  const result = await worker.recognize(imageSource);
  const text = result?.data?.text?.trim() || "";
  const confidence = result?.data?.confidence || 0;

  return {
    text,
    confidence,
    engine: "tesseract_local",
  };
}
