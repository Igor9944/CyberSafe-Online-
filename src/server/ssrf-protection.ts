export interface ExtractedUrlInfo {
  rawUrl: string;
  normalizedUrl: string;
  domain: string;
  isSensitive: boolean;
  sensitiveReason?: string | undefined;
}

const PRIVATE_IPV4: RegExp[] = [
  /^(127\.)/, /^10\./, /^172\.(1[6-9]|2[0-9]|3[0-1])\./, /^192\.168\./,
  /^169\.254\./, /^100\.(6[4-9]|7[0-1])\./, /^0\./, /^100\.(0\.|255\.)/,
  /^192\.0\.(0|2)\./, /^192\.88\.([0-9]{1,3})\./, /^198\.(18|19)\./,
  /^224\./, /^240\./, /^255\.255\.255\.255$/,
];

const PRIVATE_IPV6 = [
  /^::1$/, /^::$/, /^fc[0-9a-f]{2}:/, /^fd[0-9a-f]{2}:/,
  /^fe80:/, /^ff[0-9a-f]{2}:/, /^::f[0-9a-f]{3}:/, /^::[fF]{4}:/,
];

const SENSITIVE_PARAM_KEYWORDS = [
  "token",
  "access_token",
  "id_token",
  "jwt",
  "otp",
  "pin",
  "password",
  "pwd",
  "secret",
  "key",
  "api_key",
  "auth",
  "code",
  "session",
];

function isIpv4Private(ip: string): boolean {
  return PRIVATE_IPV4.some(re => re.test(ip));
}

function isIpv6Private(ip: string): boolean {
  return PRIVATE_IPV6.some(re => re.test(ip));
}

function isReservedIpv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some(p => isNaN(p))) return true;
  const p0 = parts[0] ?? 0;
  const p1 = parts[1] ?? 0;
  if (p0 === 0) return true;
  if (p0 === 100 && (p1 >= 64 && p1 <= 127)) return true;
  if (p0 === 127) return true;
  if (p0 === 169 && p1 === 254) return true;
  if (p0 >= 224 && p0 <= 239) return true;
  if (p0 >= 240) return true;
  return false;
}

function isReservedIpv6(ip: string): boolean {
  const parts = ip.split(":");
  if (parts.length > 8) return true;
  if (ip === "::1") return true;
  if (ip === "::") return true;
  if (parts[0] && parts[0].startsWith("fe8")) return true;
  if (parts[0] && parts[0].startsWith("ff")) return true;
  return false;
}

function isPrivateIp(ip: string): boolean {
  // Return false if the input is not a valid IP address string
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(ip) && !/^[\da-f:]+$/i.test(ip)) {
    return false;
  }
  if (ip.includes(":")) return isIpv6Private(ip);
  return isIpv4Private(ip) || isReservedIpv4(ip);
}

export function isValidUrlForAnalysis(urlString: string): { valid: boolean; reason?: string } {
  try {
    new URL(urlString);
  } catch {
    return { valid: false, reason: "URL invalide" };
  }

  const url = new URL(urlString);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { valid: false, reason: `Protocole non autorisé : ${url.protocol}` };
  }

  if (url.username !== "" || url.password !== "") {
    return { valid: false, reason: "Identifiants intégrés non autorisés" };
  }

  const hostname = url.hostname.toLowerCase();
  // Handle bracketed IPv6 (e.g., "[::1]")
  const hostnameNoBrackets = hostname.replace(/^\[/, "").replace(/\]$/, "");
  if (hostname === "localhost" || hostname === "localhost.localdomain" || hostname === "::1" || hostnameNoBrackets === "::1") {
    return { valid: false, reason: "localhost non autorisé" };
  }

  const reservedDomains = [".internal", ".local", ".localhost"];
  for (const reserved of reservedDomains) {
    if (hostname.endsWith(reserved)) {
      return { valid: false, reason: `Domaine réservé interdit : ${hostname}` };
    }
  }

  const parts = hostname.split(".") as string[];
  const isIpAddress = parts.length === 4 && parts.every(p => !isNaN(Number(p)));
  
  if (isIpAddress && isPrivateIp(hostname)) {
    return { valid: false, reason: `IP privée ou réservée interdite : ${hostname}` };
  }

  const dangerousPorts = [22, 23, 25, 445, 1433, 3306, 5432, 6379, 27017, 11211];
  const portNum = Number(url.port);
  if (dangerousPorts.includes(portNum)) {
    return { valid: false, reason: "Port non autorisé" };
  }

  return { valid: true };
}

export function extractUrlsFromText(text: string): ExtractedUrlInfo[] {
  if (!text || typeof text !== "string") return [];

  const urlRegex =
    /\b((?:https?:\/\/|www\.)[^\s<>\"']+|(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d)|[a-zA-Z0-9-]+\.(?:com|org|net|tg|xyz|top|live|site|online|info|me|ly|co|io|tk|ml|ga|cf|gq|biz|icu|buzz)(?:\/[^\s<>\"']*)?)/gi;

  const matches = text.match(urlRegex) ?? [];
  const results: ExtractedUrlInfo[] = [];
  const seen = new Set<string>();

  for (const raw of matches) {
    const cleaned = raw.replace(/[.,;:!?)]+$/, "").trim();
    if (!cleaned) continue;

    const urlStatus = isValidUrlForAnalysis(cleaned);
    if (!urlStatus.valid) {
      const withProto = cleaned.startsWith("http") ? cleaned : "https://" + cleaned;
      try {
        const parsed = new URL(withProto);
        const normalizedUrl = parsed.toString();
        if (seen.has(normalizedUrl)) continue;
        seen.add(normalizedUrl);

        results.push({
          rawUrl: cleaned,
          normalizedUrl,
          domain: parsed.hostname.toLowerCase(),
          isSensitive: true,
          sensitiveReason: `URL bloquée par sécurité : ${urlStatus.reason || "protocole non autorisé"}`,
        });
        continue;
      } catch {
        continue;
      }
    }

    let withProto = cleaned;
    if (!/^https?:\/\//i.test(withProto)) {
      withProto = "https://" + withProto;
    }

    try {
      const parsed = new URL(withProto);
      const normalizedUrl = parsed.toString();
      const domain = parsed.hostname.toLowerCase();

      if (seen.has(normalizedUrl)) continue;
      seen.add(normalizedUrl);

      let isSensitive = false;
      let sensitiveReason: string | undefined;

      // Check for private IPs in domain
      if (isPrivateIp(domain)) {
        isSensitive = true;
        sensitiveReason = "IP privée ou réservée interdite";
      }

      // Check for sensitive parameters in URL
      for (const [key, val] of parsed.searchParams.entries()) {
        const lowerKey = key.toLowerCase();
        if (SENSITIVE_PARAM_KEYWORDS.some((kw) => lowerKey.includes(kw))) {
          isSensitive = true;
          sensitiveReason = `Paramètre sensible détecté (?${key}=...) non soumis à un tiers`;
          break;
        }
      }

      // Check for reserved domains
      for (const reserved of [".internal", ".local", ".localhost"]) {
        if (domain.endsWith(reserved) || domain === reserved.slice(1)) {
          isSensitive = true;
          sensitiveReason = "Domaine réservé interdit";
          break;
        }
      }

      results.push({
        rawUrl: cleaned,
        normalizedUrl,
        domain,
        isSensitive,
        ...(sensitiveReason !== undefined ? { sensitiveReason } : {}),
      });
    } catch {
      continue;
    }
  }

  return results;
}

export function encodeUrlForVirusTotal(url: string): string {
  return Buffer.from(url).toString("base64url");
}
