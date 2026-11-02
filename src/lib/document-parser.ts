
import { extractText } from "unpdf";

export type SupportedDocumentFormat = "pdf" | "docx" | "pptx" | "txt";

export interface ParsedDocumentResult {
  text: string;
  format: SupportedDocumentFormat;
  pageCount?: number;
  wordCount: number;
  sections?: { title: string; content: string }[];
}

async function parseZipEntries(buffer: ArrayBuffer): Promise<Map<string, string>> {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const entries = new Map<string, string>();
  let offset = 0;

  while (offset + 30 <= buffer.byteLength) {
    const sig = view.getUint32(offset, true);
    if (sig !== 0x04034b50) break;

    const method = view.getUint16(offset + 8, true);
    const compSize = view.getUint32(offset + 18, true);
    const fnLen = view.getUint16(offset + 26, true);
    const extraLen = view.getUint16(offset + 28, true);

    const fnBytes = bytes.subarray(offset + 30, offset + 30 + fnLen);
    const filename = new TextDecoder().decode(fnBytes);
    const dataStart = offset + 30 + fnLen + extraLen;
    const compData = bytes.subarray(dataStart, dataStart + compSize);

    let decompressed: Uint8Array | null = null;
    if (method === 0) {
      decompressed = compData;
    } else if (method === 8) {
      try {
        const ds = new DecompressionStream("deflate-raw");
        const writer = ds.writable.getWriter();
        writer.write(compData);
        writer.close();
        const chunks: Uint8Array[] = [];
        const reader = ds.readable.getReader();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) chunks.push(value);
        }
        const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
        const merged = new Uint8Array(totalLen);
        let pos = 0;
        for (const c of chunks) {
          merged.set(c, pos);
          pos += c.length;
        }
        decompressed = merged;
      } catch (e) {
        console.warn(`Échec de décompression pour ${filename}:`, e);
      }
    }

    if (decompressed) {
      try {
        entries.set(filename, new TextDecoder("utf-8").decode(decompressed));
      } catch {
      }
    }

    offset = dataStart + compSize;
  }

  return entries;
}

export function extractTextFromXml(xml: string): string {
  const withLineBreaks = xml
    .replace(/<\/w:p>/gi, "\n")
    .replace(/<w:br[^>]*\/>/gi, "\n")
    .replace(/<\/a:p>/gi, "\n")
    .replace(/<a:br[^>]*\/>/gi, "\n");

  const textMatches = withLineBreaks.match(/<(?:w:t|a:t)[^>]*>([\s\S]*?)<\/(?:w:t|a:t)>/gi) ?? [];
  if (textMatches.length > 0) {
    return textMatches
      .map((tag) => tag.replace(/<[^>]+>/g, ""))
      .join(" ")
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s*\n/g, "\n\n")
      .trim();
  }

  return withLineBreaks
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n/g, "\n\n")
    .trim();
}

export async function extractTextFromDocx(buffer: ArrayBuffer): Promise<string> {
  const entries = await parseZipEntries(buffer);
  const docXml = entries.get("word/document.xml");
  if (!docXml) {
    throw new Error("Fichier DOCX invalide : structure word/document.xml absente.");
  }
  return extractTextFromXml(docXml);
}

export async function extractTextFromPptx(buffer: ArrayBuffer): Promise<string> {
  const entries = await parseZipEntries(buffer);
  const slides: string[] = [];

  const slideKeys = Array.from(entries.keys())
    .filter((k) => k.startsWith("ppt/slides/slide") && k.endsWith(".xml"))
    .sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ""), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ""), 10) || 0;
      return numA - numB;
    });

  if (slideKeys.length === 0) {
    throw new Error("Fichier PPTX invalide : aucune diapositive trouvée.");
  }

  for (let i = 0; i < slideKeys.length; i++) {
    const k = slideKeys[i]!;
    const xml = entries.get(k);
    if (xml) {
      const slideText = extractTextFromXml(xml);
      if (slideText) {
        slides.push(`--- Diapositive ${i + 1} ---\n${slideText}`);
      }
    }
  }

  return slides.join("\n\n");
}

export async function extractTextFromPdf(fileOrBuffer: File | ArrayBuffer | Uint8Array): Promise<string> {
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

    const result = await extractText(uint8);
    const pages = result.text;
    if (Array.isArray(pages)) {
      return pages.join("\n\n").trim();
    }
    return String(pages || "").trim();
  } catch (error) {
    console.error("Erreur lors de l'extraction PDF:", error);
    throw new Error(
      "Impossible d'extraire le texte du fichier PDF. Vérifiez qu'il s'agit d'un PDF valide contenant du texte.",
    );
  }
}

export async function extractTextFromDocument(
  fileOrBuffer: File | ArrayBuffer | Uint8Array,
  filename = "document.txt",
): Promise<ParsedDocumentResult> {
  const name = (fileOrBuffer instanceof File ? fileOrBuffer.name : filename).toLowerCase();
  let buffer: ArrayBuffer;

  if (fileOrBuffer instanceof File) {
    buffer = await fileOrBuffer.arrayBuffer();
  } else if (fileOrBuffer instanceof Uint8Array) {
    buffer = fileOrBuffer.buffer.slice(
      fileOrBuffer.byteOffset,
      fileOrBuffer.byteOffset + fileOrBuffer.byteLength,
    ) as ArrayBuffer;
  } else {
    buffer = fileOrBuffer;
  }

  let text = "";
  let format: SupportedDocumentFormat = "txt";

  if (name.endsWith(".pdf")) {
    format = "pdf";
    text = await extractTextFromPdf(buffer);
  } else if (name.endsWith(".docx")) {
    format = "docx";
    text = await extractTextFromDocx(buffer);
  } else if (name.endsWith(".pptx")) {
    format = "pptx";
    text = await extractTextFromPptx(buffer);
  } else {
    format = "txt";
    text = new TextDecoder("utf-8").decode(buffer);
  }

  const cleanText = text.trim();
  const words = cleanText ? cleanText.split(/\s+/).filter(Boolean).length : 0;

  return {
    text: cleanText,
    format,
    wordCount: words,
  };
}

