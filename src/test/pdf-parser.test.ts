import { describe, expect, it } from "vitest";
import { extractTextFromPdf } from "../lib/pdf-parser";

describe("Extracteur de texte PDF universel", () => {
  it("est défini et exporte la fonction extractTextFromPdf", () => {
    expect(typeof extractTextFromPdf).toBe("function");
  });

  it("gère gracieusement les erreurs sur un buffer invalide", async () => {
    const invalidBuffer = new Uint8Array([1, 2, 3, 4, 5]);
    await expect(extractTextFromPdf(invalidBuffer)).rejects.toThrow(
      "Impossible d'extraire le texte",
    );
  });
});
