import type { ParsedDocumentResult, SupportedDocumentFormat } from "./document-parser";
export { extractTextFromDocument, extractTextFromDocx, extractTextFromPptx, type ParsedDocumentResult, type SupportedDocumentFormat } from "./document-parser";

// Dynamic import for unpdf (code split) - only loaded when PDF processing is needed
let unpdfModule: typeof import("unpdf") | null = null;

export async function extractTextFromPdf(
  fileOrBuffer: File | ArrayBuffer | Uint8Array,
): Promise<string> {
  try {
    let uint8: Uint8Array;
    if (fileOrBuffer instanceof File) {
      const buffer = await fileOrBuffer.arrayBuffer();
      uint8 = new Uint8Array(buffer);
    } else if (fileOrBuffer instanceof Uint8Array) {
      uint8 = fileOrBuffer;
    } else {
      uint8 = new Uint8Array(fileOrBuffer);
    }

    const mod = await import("unpdf");
    const result = await mod.extractText(uint8);
    const pages = result.text;
    if (Array.isArray(pages)) {
      return pages.join("\n\n").trim();
    }
    return String(pages || "").trim();
  } catch (error) {
    console.error("Erreur lors de l'extraction PDF:", error);
    throw new Error(
      "Impossible d'extraire le texte du fichier PDF. Vérifiez qu'il s'agit d'un PDF valide contenant du texte."
    );
  }
}
