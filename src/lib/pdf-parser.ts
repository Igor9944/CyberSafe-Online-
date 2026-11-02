import { extractText } from "unpdf";

/**
 * Extrait le texte d'un fichier PDF (dans le navigateur ou sur le serveur).
 */
export async function extractTextFromPdf(fileOrBuffer: File | ArrayBuffer | Uint8Array): Promise<string> {
  try {
    let buffer: ArrayBuffer;
    if (fileOrBuffer instanceof File) {
      buffer = await fileOrBuffer.arrayBuffer();
    } else {
      buffer = fileOrBuffer;
    }

    const result = await extractText(new Uint8Array(buffer));
    const pages = result.text;
    if (Array.isArray(pages)) {
      return pages.join("\n\n").trim();
    }
    return String(pages || "").trim();
  } catch (error) {
    console.error("Erreur lors de l'extraction PDF:", error);
    throw new Error("Impossible d'extraire le texte du fichier PDF. Vérifiez qu'il s'agit d'un PDF valide contenant du texte.");
  }
}
