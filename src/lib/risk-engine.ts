export type RiskLevel = "FAIBLE" | "SUSPECT" | "ÉLEVÉ";
export type SupportedLang = "fr" | "en" | "ee";

export interface Finding {
  label: string;
  detail: string;
  weight: number;
}

export interface AnalysisResult {
  level: RiskLevel;
  score: number;
  findings: Finding[];
  extracted: { sender?: string | undefined; amounts: string[]; links: string[]; phones: string[] };
  recommendations: string[];
  summary: string;
}

export function levelFromScore(score: number): RiskLevel {
  if (score >= 60) return "ÉLEVÉ";
  if (score >= 25) return "SUSPECT";
  return "FAIBLE";
}

interface LocalizedRule {
  id: string;
  re: RegExp;
  weight: number;
  label: Record<SupportedLang, string>;
  detail: Record<SupportedLang, string>;
}

const MULTILINGUAL_RULES: LocalizedRule[] = [
  {
    id: "pin",
    re: /\b(code\s*pin|pin\s*code|pin|mot\s*de\s*passe|password|passcode|code\s*secret|secret\s*code|kɔdi\s*ɣaɣla|pin\s*kɔdi|dzesi\s*ɣaɣla)\b/i,
    weight: 40,
    label: {
      fr: "Demande de code secret / PIN",
      en: "PIN / Secret Code Request",
      ee: "PIN alo Kɔdi ɣaɣla biabia",
    },
    detail: {
      fr: "Le message mentionne votre PIN ou code secret. Aucun opérateur ni banque ne le demande jamais.",
      en: "The message demands your PIN or password. No legitimate operator or bank ever asks for this.",
      ee: "Nyatakaka sia le wò PIN alo kɔdi ɣaɣla biam. Kɔmpani alo dɔwɔla aɖeke mebiana esia gbeɖe o.",
    },
  },
  {
    id: "otp",
    re: /\b(otp|one[- ]time\s*password|code\s*(de\s*)?(validation|confirmation|v[ée]rification)|verification\s*code|kɔdi\s*si\s*va|code\s*re[çc]u|code\s*sms)\b/i,
    weight: 40,
    label: {
      fr: "Demande de code OTP / validation",
      en: "OTP / Verification Code Request",
      ee: "OTP alo Dzesi si nèxɔ biabia",
    },
    detail: {
      fr: "On vous demande un code temporaire reçu par SMS : c'est la méthode classique pour vider un compte Mobile Money.",
      en: "You are asked for an OTP received via SMS: this is the most common technique used to drain mobile wallets.",
      ee: "Wole SMS kɔdi si va na wò biam : mɔ̃ vɔ̃ɖi si amebeblatɔwo zãna hena akɔnta dodo ɖi ye.",
    },
  },
  {
    id: "reward",
    re: /\b(bonus|cadeau|gift|gagn[ée]|winner|won|r[ée]compense|reward|lot|tirage|lottery|f[ée]licitations?|congratulations?|fetu|nunana|w[oò]du\s*ga|w[oò]kp[oɔ]\s*ga)\b/i,
    weight: 22,
    label: {
      fr: "Fausse récompense ou bonus",
      en: "Fake Prize or Bonus Offer",
      ee: "Nunana alo Fetu beble",
    },
    detail: {
      fr: "Promesse de gain, loterie ou bonus inattendu : technique typique d'hameçonnage.",
      en: "Promise of unexpected gifts, lotteries, or promotional bonuses: typical phishing bait.",
      ee: "Wodo ga alo fetu beble ŋugbe na wò : amebeble ƒe aɖaŋu vɔ̃ aɖee.",
    },
  },
  {
    id: "urgency",
    re: /\b(urgent|imm[ée]diatement|immediately|vite|quick|hurry|dernier\s*d[ée]lai|deadline|sous\s*\d+\s*(h|heures?|min|hours)|expire|bloqu[ée]|blocked|suspendu|suspended|kaba|kabakaba|fifia|az[oɔ]gb[oɔ]|xaxa)\b/i,
    weight: 18,
    label: {
      fr: "Pression et sentiment d'urgence",
      en: "Psychological Pressure & Urgency",
      ee: "Kaba wɔwɔ kple Vɔvɔ̃ dodo",
    },
    detail: {
      fr: "Le message vous presse d'agir rapidement pour vous empêcher de réfléchir ou de vérifier.",
      en: "Creates intense urgency to force hasty decisions before you have time to consult others.",
      ee: "Nyatakaka sia le kaba wɔm na wò alo le vɔvɔ̃ dom na wò be nàgakpɔ teƒe abu tame o.",
    },
  },
  {
    id: "fake_agent",
    re: /\b(agent|service\s*client|customer\s*care|support|conseiller|technicien|officer|representative|d[oɔ]w[oɔ]la|k[oɔ]mpani\s*d[oɔ]w[oɔ]la)\b/i,
    weight: 12,
    label: {
      fr: "Usurpation d'agent de support",
      en: "Agent Impersonation",
      ee: "Dɔwɔla beble dzedze",
    },
    detail: {
      fr: "L'expéditeur prétend être un agent Moov, T-Money ou un technicien officiel.",
      en: "The sender claims to represent Moov, T-Money, or a technical support desk.",
      ee: "Amea be ye nye Moov alo T-Money dɔwɔla alo kpekpedenutɔ.",
    },
  },
  {
    id: "wrong_transfer",
    re: /\b(renvoy|retourn|rembours|refund|send\s*back|erreur\s*de\s*transfert|wrong\s*transfer|par\s*erreur|by\s*mistake|mistakenly|\b[dɖ]o\s*ga\b|ga\s*[dɖ]o[dɖ]o|ga\s*gbl[eẽ]|tr[oɔ]\s*ga)\b/i,
    weight: 25,
    label: {
      fr: "Arnaque au faux transfert par erreur",
      en: "Accidental Transfer Scam",
      ee: "Ga ɖoɖo le vodada me beble",
    },
    detail: {
      fr: "On prétend vous avoir envoyé de l'argent par erreur et on exige un renvoi immédiat sans que vous vérifiiez votre solde officiel.",
      en: "The sender claims money was sent to you by mistake and demands an instant refund before you check your real account balance.",
      ee: "Wobe yewoɖo ga na wò le vodada me eye wole biam be nàtrɔe kaba hafi nàkpɔ wò akɔnta le USSD dzi.",
    },
  },
  {
    id: "tontine",
    re: /\b(tontine|doublement|doubler|multiplier|placement|pyramide|investissez|investir|rendement\s*garanti|gains?\s*faciles?|egbɔgroup|ga\s*dzedze|xɔ\s*ga\s*kaba)\b/i,
    weight: 35,
    label: {
      fr: "Fausse tontine / Doublement d'argent suspect",
      en: "Fake Tontine / Ponzi Multiplier Scheme",
      ee: "Tontine alo Ga dzidzi beble",
    },
    detail: {
      fr: "Promesse de multiplier votre mise en quelques minutes (fausse tontine ou placement miracle) : arnaque financière classique au Togo.",
      en: "Promise of rapid money multiplication (fake online tontine): classical Ponzi fraud targeting mobile wallets in Togo.",
      ee: "Wodo ga gbogbo dzidzi le aɖabaƒoƒo ʋee aɖewo me ŋugbe : amebeble gã aɖe le Togo.",
    },
  },
  {
    id: "ussd",
    re: /\*\d{2,4}[*#\d]*#/,
    weight: 25,
    label: {
      fr: "Code USSD piégé à composer",
      en: "Malicious USSD Code Execution",
      ee: "USSD Kɔdi si woabia be nàƒo",
    },
    detail: {
      fr: "Le message contient une syntaxe USSD (*...#) qui peut transférer vos fonds ou transférer vos appels en arrière-plan.",
      en: "Contains a USSD sequence (*...#) that could trigger an unauthorized money transfer or call forwarding.",
      ee: "Mɔ̃ sia le biam be nàƒo USSD dzesi (*...#) si ate ŋu aɖo wò ga ɖa alo atsrɔ̃ wò akɔnta.",
    },
  },
  {
    id: "banking",
    re: /\b(carte\s*bancaire|credit\s*card|debit\s*card|cvv|iban|rib|num[ée]ro\s*de\s*carte|card\s*number)\b/i,
    weight: 35,
    label: {
      fr: "Demande d'informations bancaires sensibles",
      en: "Sensitive Banking Data Harvest",
      ee: "Banki nyatakaka veviwo biabia",
    },
    detail: {
      fr: "Tentative de captation de coordonnées de carte de crédit ou données bancaires confidentielles.",
      en: "Attempting to harvest payment card credentials, CVV, or confidential banking information.",
      ee: "Wole banki kaɖi xexlẽdzesi kple nya ɣaɣlawo biam le afisia.",
    },
  },
];

const SHORTENERS = [
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "is.gd",
  "cutt.ly",
  "rb.gy",
  "ow.ly",
  "shorturl.at",
];
const SUSPICIOUS_TLDS = [
  ".xyz",
  ".top",
  ".click",
  ".live",
  ".icu",
  ".buzz",
  ".gq",
  ".tk",
  ".ml",
  ".cf",
  ".ga",
  ".info",
  ".online",
  ".site",
];
const BRANDS = [
  "moov",
  "tmoney",
  "t-money",
  "togocom",
  "flooz",
  "mtn",
  "orange",
  "ecobank",
  "wave",
];
const OFFICIAL_DOMAINS = ["moov-africa.tg", "togocom.tg", "yas.tg"];

export function extractLinks(text: string): string[] {
  const re =
    /\b((?:https?:\/\/|www\.)[^\s<>"']+|[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|net|org|tg|xyz|top|click|live|icu|buzz|info|online|site|ly|co|me|io|gq|tk|ml)(?:\/[^\s<>"']*)?)/gi;
  return Array.from(new Set(text.match(re) ?? [])).map((l) => l.replace(/[.,;)]+$/, ""));
}

export function analyzeUrl(raw: string, lang: SupportedLang = "fr"): Finding[] {
  const findings: Finding[] = [];
  let host = "";
  let url: URL | null = null;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `http://${raw}`);
    host = url.hostname.toLowerCase();
  } catch {
    const labels = {
      fr: "Lien malformé",
      en: "Malformed URL Link",
      ee: "Kadodo gblẽku",
    };
    const details = {
      fr: "Le lien est malformé, ce qui est souvent fait exprès pour contourner les filtres.",
      en: "The link is malformed, which is frequently used to evade security scanners.",
      ee: "Kadodo sia mesɔ o, amebeblatɔwo wɔnɛ be yewoaflu mɔ̃a.",
    };
    return [{ label: labels[lang], detail: details[lang], weight: 20 }];
  }

  if (url.protocol === "http:" && /^https?:/i.test(raw)) {
    findings.push({
      label:
        lang === "ee"
          ? "Kadodo manɔ dedie (HTTP)"
          : lang === "en"
            ? "Unencrypted Connection (HTTP)"
            : "Connexion non chiffrée (HTTP)",
      detail:
        lang === "ee"
          ? "Kadodo sia mezã HTTPS o."
          : lang === "en"
            ? "Uses insecure plain HTTP instead of HTTPS."
            : "Le lien utilise HTTP, pas de chiffrement HTTPS.",
      weight: 10,
    });
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    findings.push({
      label:
        lang === "ee"
          ? "IP Xexlẽdzesi ko"
          : lang === "en"
            ? "Raw IP Address Host"
            : "Adresse IP brute",
      detail:
        lang === "ee"
          ? "Kadodoa yi IP xexlẽdzesi teƒe tsɔ wu dukɔmevi ŋkɔ."
          : lang === "en"
            ? "Points directly to an IP address instead of a recognized domain."
            : "Le lien pointe directement vers une adresse IP sans nom de domaine.",
      weight: 30,
    });
  }

  if (SHORTENERS.some((s) => host === s || host.endsWith(`.${s}`))) {
    findings.push({
      label:
        lang === "ee" ? "Kadodo kpuie ɣaɣla" : lang === "en" ? "Shortened URL" : "Lien raccourci",
      detail:
        lang === "ee"
          ? `${host} le afi si tututu nèyina ɣlam.`
          : lang === "en"
            ? `${host} hides the real final destination.`
            : `${host} masque la véritable destination finale.`,
      weight: 20,
    });
  }

  if (SUSPICIOUS_TLDS.some((t) => host.endsWith(t))) {
    findings.push({
      label:
        lang === "ee"
          ? "Domain vɔ̃ɖi"
          : lang === "en"
            ? "High-Risk Domain Extension"
            : "Extension de domaine à risque",
      detail:
        lang === "ee"
          ? `Domain ${host} nye esi amebeblatɔwo zãna zi geɖe.`
          : lang === "en"
            ? `The domain suffix of ${host} is known for high scam prevalence.`
            : `L'extension de ${host} est très fréquemment utilisée par les fraudeurs.`,
      weight: 20,
    });
  }

  const official = OFFICIAL_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
  const brand = BRANDS.find(
    (b) =>
      host.replace(/-/g, "").includes(b.replace(/-/g, "")) ||
      (!official && raw.toLowerCase().includes(b)),
  );
  if (brand && !official) {
    findings.push({
      label:
        lang === "ee"
          ? "Kɔmpani ŋkɔ vɔ̃ zãzã"
          : lang === "en"
            ? "Brand Impersonation"
            : "Imitation de marque officielle",
      detail:
        lang === "ee"
          ? `Kadodoa le « ${brand} » zãm evɔ menye kɔmpani vavã ƒe website o.`
          : lang === "en"
            ? `The link references '${brand}' but is NOT an official domain.`
            : `Le lien exploite la marque « ${brand} » en dehors des domaines officiels certifiés.`,
      weight: 35,
    });
  }

  if (/\b(phishing|claim|steal|token=fake|promo=moov)\b/i.test(raw)) {
    findings.push({
      label:
        lang === "ee"
          ? "Kadodo beble (Phishing)"
          : lang === "en"
            ? "Suspicious Phishing URL Pattern"
            : "Indicateur d'hameçonnage (Phishing)",
      detail:
        lang === "ee"
          ? "Kadodo sia me nyawo ɖee fia be beble kadodo aɖee."
          : lang === "en"
            ? "URL path or query parameters exhibit known phishing signatures."
            : "La structure de l'URL ou ses paramètres révèlent une tentative manifeste d'hameçonnage.",
      weight: 35,
    });
  }

  return findings;
}

function finalize(
  findings: Finding[],
  extracted: AnalysisResult["extracted"],
  kind: "sms" | "url" | "audio",
  lang: SupportedLang = "fr",
): AnalysisResult {
  const score = Math.min(
    100,
    findings.reduce((s, f) => s + f.weight, 0),
  );
  const level = levelFromScore(score);
  const recs: string[] = [];

  if (lang === "ee") {
    if (level === "FAIBLE") {
      recs.push("Afɔku gã aɖeke medze le dzesi sia me o, gake nɔ ŋudzɔ ɣesiaɣi.");
      recs.push("Kpɔ wò ga le akɔnta me to USSD se vavã dzi gbã.");
    } else {
      recs.push("Mègatsɔ wò PIN alo OTP gbeɖe na ame aɖeke o, eɖanye 'dɔwɔla' hã o.");
      if (extracted.links.length)
        recs.push("Mègaʋu kadodo (link) sia o. Ŋlɔ adrɛs vavã la wò ŋutɔ.");
      recs.push("Mègaƒo USSD kɔdi aɖeke si wogblɔ na wò le SMS alo kaƒoƒo me o.");
      recs.push("Yɔ wò kɔmpani (Moov alo Togocom) to woƒe dɔwɔƒe xexlẽdzesi vavã dzi.");
      if (level === "ÉLEVÉ") recs.push("Tui mɔ ame sia eye nàgblɔe na kɔmpani la kaba.");
    }
  } else if (lang === "en") {
    if (level === "FAIBLE") {
      recs.push("No explicit high threat indicators detected, but maintain general vigilance.");
      recs.push("Always verify your account balance directly via official telecom USSD menus.");
    } else {
      recs.push("Never disclose your PIN, OTP, or secret validation codes to anyone.");
      if (extracted.links.length)
        recs.push("Do not open the link. Manually navigate to official websites.");
      recs.push("Do not execute USSD strings received via SMS or unexpected calls.");
      recs.push("Contact your operator via their published official support numbers.");
      if (level === "ÉLEVÉ") recs.push("Block the sender immediately and file a fraud report.");
    }
  } else {
    if (level === "FAIBLE") {
      recs.push("Aucun signal fort d'arnaque détecté, mais restez vigilant.");
      recs.push(
        "Vérifiez toujours votre solde directement via le menu USSD officiel de votre opérateur.",
      );
    } else {
      recs.push("Ne communiquez jamais votre PIN, OTP ou code secret, même à un « agent ».");
      if (extracted.links.length)
        recs.push("N'ouvrez pas le lien. Tapez vous-même l'adresse officielle si besoin.");
      recs.push("Ne composez aucun code USSD reçu par message ou appel.");
      recs.push("Contactez votre opérateur via son numéro officiel pour vérifier.");
      if (level === "ÉLEVÉ")
        recs.push("Bloquez l'expéditeur et signalez le message à votre opérateur.");
    }
  }

  let summary = "";
  if (lang === "ee") {
    const item = kind === "sms" ? "SMS sia" : kind === "url" ? "Nu sia" : "Kaƒoƒo sia";
    summary =
      level === "ÉLEVÉ"
        ? `${item} ɖe beble dzesi sesẽwo fia. Mègawɔ nu si wòbiana la aɖeke o.`
        : level === "SUSPECT"
          ? `${item} me nyawo medze pɛpɛpɛ o. Biae le kɔmpani vavã gbɔ hafi nàwɔ naneke.`
          : `${item} meɖe beble dzesi aɖeke fia le dodokpɔ sia nu o.`;
  } else if (lang === "en") {
    const item = kind === "sms" ? "This SMS" : kind === "url" ? "This content" : "This call";
    summary =
      level === "ÉLEVÉ"
        ? `${item} shows strong indicators of financial fraud. Do not follow any instructions provided.`
        : level === "SUSPECT"
          ? `${item} contains suspicious patterns. Verify through official customer channels before proceeding.`
          : `${item} does not show obvious scam signatures based on current security rules.`;
  } else {
    const what = kind === "sms" ? "Ce message" : kind === "url" ? "Ce contenu" : "Cet appel";
    summary =
      level === "ÉLEVÉ"
        ? `${what} présente plusieurs signes forts d'arnaque. Ne faites rien de ce qu'il demande.`
        : level === "SUSPECT"
          ? `${what} contient des éléments douteux. Vérifiez auprès de la source officielle avant d'agir.`
          : `${what} ne présente pas de signal d'arnaque évident selon nos règles locales.`;
  }

  return { level, score, findings, extracted, recommendations: recs, summary };
}

export function analyzeSms(text: string, lang: SupportedLang = "fr"): AnalysisResult {
  const findings: Finding[] = [];
  for (const r of MULTILINGUAL_RULES) {
    if (r.re.test(text)) {
      findings.push({
        label: r.label[lang] || r.label.fr,
        detail: r.detail[lang] || r.detail.fr,
        weight: r.weight,
      });
    }
  }

  const links = extractLinks(text);
  for (const l of links) {
    for (const f of analyzeUrl(l, lang)) {
      findings.push({ ...f, label: `${f.label} (${l})` });
    }
  }

  if (links.length) {
    const linkLabel =
      lang === "ee" ? "Kadodo le eme" : lang === "en" ? "Embedded URL Link" : "Lien présent";
    const linkDetail =
      lang === "ee"
        ? "Mobile Money kɔmpaniwo meɖoa link be woaxɔ transaction o."
        : lang === "en"
          ? "Mobile Money operators do not send links to complete or confirm transactions."
          : "Les opérateurs Mobile Money n'envoient pas de liens pour valider une transaction.";
    findings.push({ label: linkLabel, detail: linkDetail, weight: 10 });
  }

  const amounts = Array.from(
    new Set(text.match(/\d[\d\s.,]*\s?(?:F\s?CFA|FCFA|XOF|F)\b/gi) ?? []),
  ).map((a) => a.trim());
  const phones = Array.from(
    new Set(text.match(/(?:\+?228[\s-]?)?\b\d{2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}\b/g) ?? []),
  );
  const senderMatch = text.match(/^(?:de|from|exp[ée]diteur|ame\s*si\s*[dɖ]oe)\s*:\s*(.+)$/im);

  if (phones.length && /appel|contact|whatsapp|joindre|call|dial|reach|ƒo\s*ka|kaƒo/i.test(text)) {
    const privLabel =
      lang === "ee"
        ? "Kaƒomɔ̃ xexlẽdzesi kpea yɔyɔ"
        : lang === "en"
          ? "Private Phone Number to Contact"
          : "Numéro personnel à contacter";
    const privDetail =
      lang === "ee"
        ? "Wole biam be nàyɔ ame ŋutɔ ƒe xexlẽdzesi tsɔ wu kɔmpani ƒe dɔwɔƒe xexlẽdzesi."
        : lang === "en"
          ? "Prompts you to contact a personal mobile line instead of an official shortcode."
          : "On vous invite à appeler un numéro privé plutôt qu'un service officiel.";
    findings.push({ label: privLabel, detail: privDetail, weight: 15 });
  }

  return finalize(
    findings,
    { sender: senderMatch?.[1]?.trim(), amounts, links, phones },
    "sms",
    lang,
  );
}

export function analyzeQrContent(content: string, lang: SupportedLang = "fr"): AnalysisResult {
  const links = extractLinks(content);
  const findings: Finding[] = [];
  if (/^https?:\/\//i.test(content.trim()) && !links.includes(content.trim())) {
    links.unshift(content.trim());
  }
  for (const l of links) {
    findings.push(...analyzeUrl(l, lang));
  }
  for (const r of MULTILINGUAL_RULES) {
    if (r.re.test(content)) {
      findings.push({
        label: r.label[lang] || r.label.fr,
        detail: r.detail[lang] || r.detail.fr,
        weight: r.weight,
      });
    }
  }
  return finalize(findings, { amounts: [], links, phones: [] }, "url", lang);
}

export function analyzeTranscript(text: string, lang: SupportedLang = "fr"): AnalysisResult {
  const r = analyzeSms(text, lang);
  return finalize(r.findings, r.extracted, "audio", lang);
}
