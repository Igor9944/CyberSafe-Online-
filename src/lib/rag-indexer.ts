
export interface DocumentChunk {
  id: string;
  chunkIndex: number;
  pageOrSlideNumber?: number;
  sectionTitle?: string;
  content: string;
  wordCount: number;
}

export interface RetrievedPassage {
  chunk: DocumentChunk;
  score: number;
  citation: string;
}

export function chunkDocument(
  text: string,
  targetWordsPerChunk = 250,
  overlapWords = 40,
): DocumentChunk[] {
  if (!text || !text.trim()) return [];

  const chunks: DocumentChunk[] = [];
  const clean = text.replace(/\r\n/g, "\n");

  const pageSections = clean.split(/(?:---|===)\s*(?:Diapositive|Page)\s*(\d+)\s*(?:---|===)/i);

  if (pageSections.length > 1) {
    let currentNum = 1;
    for (let i = 0; i < pageSections.length; i++) {
      const part = pageSections[i]?.trim();
      if (!part) continue;

      if (/^\d+$/.test(part)) {
        currentNum = parseInt(part, 10);
        continue;
      }

      const words = part.split(/\s+/).filter(Boolean);
      if (words.length <= targetWordsPerChunk * 1.5) {
        chunks.push({
          id: `chunk-${chunks.length + 1}`,
          chunkIndex: chunks.length + 1,
          pageOrSlideNumber: currentNum,
          sectionTitle: extractSectionHeading(part),
          content: part,
          wordCount: words.length,
        });
      } else {
        const subChunks = splitWordsWithOverlap(words, targetWordsPerChunk, overlapWords);
        for (const sub of subChunks) {
          chunks.push({
            id: `chunk-${chunks.length + 1}`,
            chunkIndex: chunks.length + 1,
            pageOrSlideNumber: currentNum,
            sectionTitle: extractSectionHeading(sub),
            content: sub,
            wordCount: sub.split(/\s+/).filter(Boolean).length,
          });
        }
      }
    }
    return chunks;
  }

  const paragraphs = clean.split(/\n\s*\n+/);
  let currentWords: string[] = [];
  let currentSection = "Introduction / Généralités";

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    const isHeading = /^(?:#{1,4}\s+|[0-9IVX]+\.|\bchapitre\b|\bpartie\b|\bsection\b)/i.test(trimmed);
    if (isHeading) {
      if (currentWords.length > 0) {
        chunks.push({
          id: `chunk-${chunks.length + 1}`,
          chunkIndex: chunks.length + 1,
          sectionTitle: currentSection,
          content: currentWords.join(" "),
          wordCount: currentWords.length,
        });
        currentWords = [];
      }
      currentSection = trimmed.slice(0, 60).replace(/[#*`_]/g, "").trim();
    }

    const paraWords = trimmed.split(/\s+/).filter(Boolean);
    if (currentWords.length + paraWords.length > targetWordsPerChunk && currentWords.length > 50) {
      const chunkText = currentWords.join(" ");
      chunks.push({
        id: `chunk-${chunks.length + 1}`,
        chunkIndex: chunks.length + 1,
        sectionTitle: currentSection,
        content: chunkText,
        wordCount: currentWords.length,
      });

      currentWords = currentWords.slice(-overlapWords).concat(paraWords);
    } else {
      currentWords.push(...paraWords);
    }
  }

  if (currentWords.length > 0) {
    const chunkText = currentWords.join(" ");
    chunks.push({
      id: `chunk-${chunks.length + 1}`,
      chunkIndex: chunks.length + 1,
      sectionTitle: currentSection,
      content: chunkText,
      wordCount: currentWords.length,
    });
  }

  return chunks;
}

function splitWordsWithOverlap(words: string[], size: number, overlap: number): string[] {
  const result: string[] = [];
  let i = 0;
  while (i < words.length) {
    const slice = words.slice(i, i + size);
    result.push(slice.join(" "));
    i += size - overlap;
    if (i + overlap >= words.length) {
      if (i < words.length) {
        result.push(words.slice(i).join(" "));
      }
      break;
    }
  }
  return result;
}

function extractSectionHeading(text: string): string {
  const firstLine = text.split("\n")[0]?.trim() || "";
  if (firstLine.length < 80 && /^[A-Z0-9#\s—–:.-]+$/i.test(firstLine)) {
    return firstLine.replace(/^[#\s—–:-]+/, "");
  }
  return "Section de cours";
}

export function retrieveRelevantPassages(
  query: string,
  chunks: DocumentChunk[],
  topK = 3,
): RetrievedPassage[] {
  if (!query || chunks.length === 0) return [];

  const stopWords = new Set([
    "le", "la", "les", "un", "une", "des", "du", "de", "ce", "cet", "cette", "ces",
    "en", "dans", "pour", "par", "sur", "avec", "sans", "est", "sont", "ont", "a",
    "que", "qui", "quoi", "dont", "ou", "et", "mais", "donc", "or", "ni", "car",
    "the", "a", "an", "in", "on", "at", "for", "with", "about", "to", "from",
  ]);

  const queryTokens = query
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  if (queryTokens.length === 0) {
    return chunks.slice(0, topK).map((c) => ({
      chunk: c,
      score: 1,
      citation: c.pageOrSlideNumber
        ? `[Page / Diapo ${c.pageOrSlideNumber} — ${c.sectionTitle || "Extrait"}]`
        : `[Passage ${c.chunkIndex} — ${c.sectionTitle || "Extrait"}]`,
    }));
  }

  const scored = chunks.map((chunk) => {
    const chunkLower = chunk.content.toLowerCase();
    let score = 0;

    for (const token of queryTokens) {
      if (chunkLower.includes(token)) {
        const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        let count = 1;
        try {
          const regex = new RegExp(`\\b${escaped}`, "gi");
          count = (chunkLower.match(regex) || []).length || 1;
        } catch {
          count = chunkLower.split(token).length - 1 || 1;
        }
        score += count * 2;

        if (chunk.sectionTitle && chunk.sectionTitle.toLowerCase().includes(token)) {
          score += 5;
        }
      }
    }

    return {
      chunk,
      score,
      citation: chunk.pageOrSlideNumber
        ? `[Page / Diapo ${chunk.pageOrSlideNumber} — ${chunk.sectionTitle || "Extrait"}]`
        : `[Passage ${chunk.chunkIndex} — ${chunk.sectionTitle || "Extrait"}]`,
    };
  });

  const matched = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);

  if (matched.length > 0) {
    return matched.slice(0, topK);
  }

  return scored.slice(0, Math.min(topK, 2));
}

export function buildRagContextPrompt(passages: RetrievedPassage[]): string {
  if (passages.length === 0) return "";

  const passagesText = passages
    .map((p, idx) => `--- EXTRAIT ${idx + 1} ${p.citation} ---\n${p.chunk.content}`)
    .join("\n\n");

  return `
[SOURCES ACADÉMIQUES DU COURS TÉLÉVERSÉ (RAG)] :
Tu dois impérativement t'appuyer sur les extraits ci-dessous pour formuler ta réponse.
Indique systématiquement les citations des sources correspondantes (${passages.map((p) => p.citation).join(", ")}) dans tes explications pour que l'étudiant puisse vérifier dans son document original.
Ne fabrique AUCUNE référence inventée ni contenu absent du document.

${passagesText}
`;
}

