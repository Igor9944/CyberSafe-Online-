import { describe, expect, it } from "vitest";
import {
  extractTextFromXml,
  extractTextFromDocument,
  extractTextFromDocx,
  extractTextFromPptx,
} from "../lib/document-parser";

describe("Extracteur de documents universel (PDF, DOCX, PPTX, TXT)", () => {
  it("extrait correctement le texte d'un fragment XML de document Word (<w:t>)", () => {
    const mockWordXml = `
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p>
            <w:r><w:t>Chapitre 1 : Introduction à la Cybersécurité</w:t></w:r>
          </w:p>
          <w:p>
            <w:r><w:t>La protection des données mobiles est essentielle au Togo.</w:t></w:r>
          </w:p>
        </w:body>
      </w:document>
    `;

    const text = extractTextFromXml(mockWordXml);
    expect(text).toContain("Chapitre 1 : Introduction à la Cybersécurité");
    expect(text).toContain("La protection des données mobiles est essentielle au Togo.");
  });

  it("extrait correctement le texte d'un fragment XML de présentation PowerPoint (<a:t>)", () => {
    const mockSlideXml = `
      <p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
        <p:cSld>
          <p:spTree>
            <p:sp>
              <p:txBody>
                <a:p><a:r><a:t>Sécurité Mobile Money</a:t></a:r></a:p>
                <a:p><a:r><a:t>Règle d'or : Ne jamais donner son code PIN.</a:t></a:r></a:p>
              </p:txBody>
            </p:sp>
          </p:spTree>
        </p:cSld>
      </p:sld>
    `;

    const text = extractTextFromXml(mockSlideXml);
    expect(text).toContain("Sécurité Mobile Money");
    expect(text).toContain("Ne jamais donner son code PIN.");
  });

  it("gère l'extraction de documents texte brut (TXT / Markdown)", async () => {
    const rawText = "Algèbre linéaire\nThéorème du rang pour les espaces vectoriels de dimension finie.";
    const buffer = new TextEncoder().encode(rawText).buffer;

    const result = await extractTextFromDocument(buffer, "cours-maths.txt");
    expect(result.format).toBe("txt");
    expect(result.text).toBe(rawText);
    expect(result.wordCount).toBe(12);
  });

  it("rejette un buffer corrompu ou incomplet pour DOCX avec une erreur explicite", async () => {
    const corruptBuffer = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]).buffer;
    await expect(extractTextFromDocx(corruptBuffer)).rejects.toThrow("Fichier DOCX invalide");
  });

  it("rejette un buffer corrompu pour PPTX avec une erreur explicite", async () => {
    const corruptBuffer = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]).buffer;
    await expect(extractTextFromPptx(corruptBuffer)).rejects.toThrow("Fichier PPTX invalide");
  });
});
