
import { createWorker } from "tesseract.js";

export interface OcrExtractionResult {
  text: string;
  confidence: number;
  engine: "gemma_vision" | "tesseract_local";
}

export async function extractTextWithLocalOcr(
  imageSource: string | File | Blob,
  lang: "fra" | "eng" = "fra",
): Promise<OcrExtractionResult> {
  let worker: any = null;
  try {
    worker = await createWorker(lang);
    const result = await worker.recognize(imageSource);
    const text = result?.data?.text?.trim() || "";
    const confidence = result?.data?.confidence || 0;

    return {
      text,
      confidence,
      engine: "tesseract_local",
    };
  } catch (error) {
    console.warn("Échec OCR Tesseract local:", error);
    throw new Error(
      "Impossible d'extraire le texte de l'image localement. Vérifiez la netteté de la capture d'écran.",
    );
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch {
      }
    }
  }
}

