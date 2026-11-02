import { describe, expect, it } from "vitest";
import { chunkDocument, retrieveRelevantPassages, buildRagContextPrompt } from "../lib/rag-indexer";

describe("Moteur RAG local et découpage sémantique (rag-indexer)", () => {
  it("découpe un document en conservant les numéros de diapositives ou de pages", () => {
    const slideDoc = `
--- Diapositive 1 ---
Introduction aux protocoles réseau et sécurité TCP/IP.
Les couches du modèle OSI définissent l'encapsulation.

--- Diapositive 2 ---
Chiffrement asymétrique et signatures numériques.
RSA repose sur la factorisation des nombres premiers.
    `;

    const chunks = chunkDocument(slideDoc, 100);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks[0]?.pageOrSlideNumber).toBe(1);
    expect(chunks[1]?.pageOrSlideNumber).toBe(2);
  });

  it("découpe un texte par sections de titre lorsque les pages ne sont pas spécifiées", () => {
    const textDoc = `
# Chapitre 1 : Droit pénal spécial
Le principe de légalité des délits et des peines est intangible en droit togolais.

# Chapitre 2 : Les infractions numériques
L'escroquerie par moyen électronique et faux transfert d'argent est réprimée sévèrement.
    `;

    const chunks = chunkDocument(textDoc, 50);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks.some((c) => c.sectionTitle?.includes("Droit pénal"))).toBe(true);
  });

  it("retrouve les passages pertinents avec des termes techniques et ne plante pas sur des caractères spéciaux (ex: C++, TCP/IP)", () => {
    const chunks = [
      {
        id: "c1",
        chunkIndex: 1,
        pageOrSlideNumber: 1,
        sectionTitle: "Langages de programmation",
        content:
          "Le polymorphisme et la gestion manuelle de mémoire en C++ avec les pointeurs et destructeurs.",
        wordCount: 15,
      },
      {
        id: "c2",
        chunkIndex: 2,
        pageOrSlideNumber: 2,
        sectionTitle: "Réseaux informatiques",
        content: "La suite de protocoles TCP/IP et le routage des paquets sur Internet.",
        wordCount: 12,
      },
      {
        id: "c3",
        chunkIndex: 3,
        pageOrSlideNumber: 3,
        sectionTitle: "Droit des affaires",
        content: "Les contrats commerciaux dans l'espace OHADA et les juridictions compétentes.",
        wordCount: 12,
      },
    ];

    const passagesCpp = retrieveRelevantPassages(
      "Comment fonctionne le destructeur en C++ ?",
      chunks,
    );
    expect(passagesCpp.length).toBeGreaterThan(0);
    expect(passagesCpp[0]?.chunk.id).toBe("c1");
    expect(passagesCpp[0]?.citation).toContain("Diapo 1");

    const passagesTcp = retrieveRelevantPassages("Explique-moi les paquets TCP/IP", chunks);
    expect(passagesTcp[0]?.chunk.id).toBe("c2");
  });

  it("construit un prompt de contexte RAG structuré avec mentions de citations obligatoires", () => {
    const passages = [
      {
        chunk: {
          id: "c1",
          chunkIndex: 1,
          pageOrSlideNumber: 3,
          sectionTitle: "Authentification",
          content:
            "L'authentification multi-facteurs (MFA) réduit de 99% les compromissions de compte.",
          wordCount: 12,
        },
        score: 8,
        citation: "[Page / Diapo 3 — Authentification]",
      },
    ];

    const prompt = buildRagContextPrompt(passages);
    expect(prompt).toContain("[SOURCES ACADÉMIQUES DU COURS TÉLÉVERSÉ (RAG)]");
    expect(prompt).toContain("[Page / Diapo 3 — Authentification]");
    expect(prompt).toContain("L'authentification multi-facteurs");
    expect(prompt).toContain("Ne fabrique AUCUNE référence inventée");
  });
});
