import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase-server";

type Severity = "Low" | "Medium" | "High" | "Critical";

type URLhausResult = {
  checked: boolean;
  found: boolean;
  message: string;
  reference?: string;
  urlStatus?: string;
  threat?: string;
  tags?: string[];
};

function getSeverity(score: number): Severity {
  if (score >= 80) return "Critical";
  if (score >= 60) return "High";
  if (score >= 30) return "Medium";
  return "Low";
}

async function checkURLhaus(url: string): Promise<URLhausResult> {
  const authKey = process.env.URLHAUS_AUTH_KEY;

  if (!authKey) {
    return {
      checked: false,
      found: false,
      message:
        "URLhaus lookup is unavailable because the server configuration is missing the threat-intelligence key.",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const body = new URLSearchParams();
    body.set("url", url);

    const response = await fetch("https://urlhaus-api.abuse.ch/v1/url/", {
      method: "POST",
      headers: {
        "Auth-Key": authKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        "URLhaus request failed:",
        response.status,
        response.statusText,
      );

      return {
        checked: false,
        found: false,
        message:
          "URLhaus could not be reached right now. The heuristic URL analysis was still completed.",
      };
    }

    const data = await response.json();

    if (data?.query_status === "ok") {
      const tags = Array.isArray(data?.tags)
        ? data.tags.filter(
            (tag: unknown): tag is string => typeof tag === "string",
          )
        : [];

      return {
        checked: true,
        found: true,
        message:
          "URLhaus has a malicious URL record matching this URL.",
        reference:
          typeof data?.urlhaus_reference === "string"
            ? data.urlhaus_reference
            : undefined,
        urlStatus:
          typeof data?.url_status === "string"
            ? data.url_status
            : undefined,
        threat:
          typeof data?.threat === "string"
            ? data.threat
            : undefined,
        tags,
      };
    }

    if (data?.query_status === "no_results") {
      return {
        checked: true,
        found: false,
        message:
          "URLhaus returned no matching malicious URL record. This does not guarantee that the URL is safe.",
      };
    }

    if (data?.query_status === "invalid_url") {
      return {
        checked: false,
        found: false,
        message:
          "URLhaus could not process this URL. The local heuristic analysis was still completed.",
      };
    }

    return {
      checked: false,
      found: false,
      message:
        "URLhaus returned an unexpected response. The local heuristic analysis was still completed.",
    };
  } catch (error) {
    console.error("URLhaus lookup error:", error);

    return {
      checked: false,
      found: false,
      message:
        "URLhaus lookup could not be completed. The heuristic URL analysis was still completed.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  try {
    // ============================================================
    // AUTHENTICATION
    // ============================================================

    const supabase = await createClient();

    const { data: authData, error: authError } =
      await supabase.auth.getClaims();

    if (authError || !authData?.claims?.sub) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required.",
        },
        { status: 401 },
      );
    }

    const userId = authData.claims.sub;

    // ============================================================
    // READ REQUEST
    // ============================================================

    const body = await request.json();

    const rawUrl =
      typeof body?.url === "string"
        ? body.url.trim()
        : "";

    if (!rawUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide a URL.",
        },
        { status: 400 },
      );
    }

    if (rawUrl.length > 2048) {
      return NextResponse.json(
        {
          success: false,
          error: "URL is too long.",
        },
        { status: 400 },
      );
    }

    // ============================================================
    // URL PARSING
    // ============================================================

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(rawUrl);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid URL.",
        },
        { status: 400 },
      );
    }

    const protocol = parsedUrl.protocol
      .replace(":", "")
      .toLowerCase();

    const hostname = parsedUrl.hostname.toLowerCase();

    const normalizedUrl = parsedUrl.toString();

    // ============================================================
    // SECURITY ANALYSIS
    // ============================================================

    let riskScore = 0;

    const indicators: string[] = [];

    // HTTPS check
    if (protocol !== "https") {
      riskScore += 20;

      indicators.push(
        "The URL does not use HTTPS.",
      );
    }

    // IP address check
    const ipv4Pattern =
      /^(?:\d{1,3}\.){3}\d{1,3}$/;

    const ipv6Pattern = /:/;

    if (
      ipv4Pattern.test(hostname) ||
      ipv6Pattern.test(hostname)
    ) {
      riskScore += 25;

      indicators.push(
        "The URL uses an IP address instead of a normal domain name.",
      );
    }

    // Punycode check
    if (hostname.includes("xn--")) {
      riskScore += 20;

      indicators.push(
        "The domain uses punycode, which can sometimes be used in lookalike-domain attacks.",
      );
    }

    // Subdomain check
    const hostnameParts = hostname
      .split(".")
      .filter(Boolean);

    if (hostnameParts.length >= 4) {
      riskScore += 10;

      indicators.push(
        "The URL contains an unusually large number of subdomains.",
      );
    }

    // Suspicious keyword check
    const suspiciousKeywords = [
      "login",
      "verify",
      "verification",
      "account",
      "secure",
      "security",
      "update",
      "password",
      "signin",
      "sign-in",
      "confirm",
      "bank",
      "wallet",
      "payment",
      "invoice",
      "unlock",
      "suspended",
      "urgent",
    ];

    const urlLower = normalizedUrl.toLowerCase();

    const matchedKeywords =
      suspiciousKeywords.filter(
        (keyword) =>
          urlLower.includes(keyword),
      );

    if (matchedKeywords.length >= 3) {
      riskScore += 20;

      indicators.push(
        `Multiple security-sensitive terms detected: ${matchedKeywords
          .slice(0, 6)
          .join(", ")}.`,
      );
    } else if (matchedKeywords.length > 0) {
      riskScore += 5;

      indicators.push(
        `Security-sensitive term detected: ${matchedKeywords
          .slice(0, 4)
          .join(", ")}.`,
      );
    }

    // URL length
    if (normalizedUrl.length > 180) {
      riskScore += 10;

      indicators.push(
        "The URL is unusually long.",
      );
    }

    // Embedded credentials / @ symbol
    if (normalizedUrl.includes("@")) {
      riskScore += 20;

      indicators.push(
        "The URL contains an @ symbol or embedded credential-like information.",
      );
    }

    // Non-standard port
    if (
      parsedUrl.port &&
      parsedUrl.port !== "80" &&
      parsedUrl.port !== "443"
    ) {
      riskScore += 15;

      indicators.push(
        "The URL uses a non-standard network port.",
      );
    }

    // Query parameters
    const queryParameterCount = [
      ...parsedUrl.searchParams.keys(),
    ].length;

    if (queryParameterCount >= 5) {
      riskScore += 10;

      indicators.push(
        "The URL contains many query parameters.",
      );
    }

    // Keep heuristic score inside 0-100
    riskScore = Math.min(
      100,
      Math.max(0, riskScore),
    );

    // ============================================================
    // THREAT INTELLIGENCE — URLHAUS
    // ============================================================

    const threatIntelligence =
      await checkURLhaus(normalizedUrl);

    // If URLhaus has a confirmed malicious record,
    // the URL receives the highest risk classification.
    if (threatIntelligence.found) {
      riskScore = 100;

      indicators.push(
        "URLhaus identified this URL as a known malicious URL.",
      );

      if (threatIntelligence.threat) {
        indicators.push(
          `URLhaus threat classification: ${threatIntelligence.threat}.`,
        );
      }

      if (
        threatIntelligence.urlStatus
      ) {
        indicators.push(
          `URLhaus status: ${threatIntelligence.urlStatus}.`,
        );
      }
    }

    // ============================================================
    // FINAL CLASSIFICATION
    // ============================================================

    riskScore = Math.min(
      100,
      Math.max(0, riskScore),
    );

    const severity = getSeverity(riskScore);

    const threatDetected =
      riskScore >= 30 ||
      threatIntelligence.found;

    // Deterministic confidence for the current
    // heuristic + threat-intelligence engine.
    let confidence = Math.min(
      99,
      Math.max(
        70,
        100 - Math.abs(50 - riskScore),
      ),
    );

    // A confirmed URLhaus match provides
    // substantially stronger evidence.
    if (threatIntelligence.found) {
      confidence = 99;
    }

    // ============================================================
    // RECOMMENDATION
    // ============================================================

    let recommendation =
      "The URL appears relatively low risk based on the available heuristic checks. Continue to verify the source before opening it.";

    if (threatIntelligence.found) {
      recommendation =
        "Do not open this URL. URLhaus identified it as a known malicious URL. Avoid entering credentials, payment information or other sensitive data.";
    } else if (severity === "Medium") {
      recommendation =
        "Use caution. Review the URL and verify the sender or website independently before continuing.";
    }

    if (severity === "High") {
      recommendation =
        "Avoid opening this URL until it has been independently verified. Do not enter passwords, payment information or other sensitive data.";
    }

    if (severity === "Critical") {
      recommendation =
        "Do not open this URL. Treat it as potentially dangerous and avoid entering credentials or sensitive information.";
    }

    // Keep the strongest recommendation for
    // confirmed URLhaus malicious URLs.
    if (threatIntelligence.found) {
      recommendation =
        "Do not open this URL. URLhaus identified it as a known malicious URL. Avoid entering credentials, payment information or other sensitive data.";
    }

    // ============================================================
    // SAVE SCAN TO SUPABASE
    // ============================================================

    const { data: savedScan, error: saveError } =
      await supabase
        .from("security_scans")
        .insert({
          user_id: userId,
          scan_type: "url",
          input_value: rawUrl,
          normalized_url: normalizedUrl,
          domain: hostname,
          protocol,
          risk_score: riskScore,
          severity,
          confidence,
          threat_detected: threatDetected,
          indicators,
          recommendation,
          analysis_type:
            threatIntelligence.checked
              ? "URL heuristic analysis + URLhaus threat intelligence"
              : "URL heuristic analysis",
          threat_intelligence_checked:
            threatIntelligence.checked,
          threat_intelligence_message:
            threatIntelligence.message,
        })
        .select("id, created_at")
        .single();

    if (saveError) {
      console.error(
        "Failed to save security scan:",
        saveError,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "The URL was analyzed, but the scan could not be saved.",
        },
        { status: 500 },
      );
    }

    // ============================================================
    // RESPONSE
    // ============================================================

    return NextResponse.json({
      success: true,

      scanId: savedScan.id,

      createdAt: savedScan.created_at,

      url: normalizedUrl,

      riskScore,

      severity,

      confidence,

      threatDetected,

      domain: hostname,

      protocol,

      analysisType:
        threatIntelligence.checked
          ? "URL heuristic analysis + URLhaus threat intelligence"
          : "URL heuristic analysis",

      indicators,

      recommendation,

      threatIntelligence: {
        checked:
          threatIntelligence.checked,

        found:
          threatIntelligence.found,

        message:
          threatIntelligence.message,

        reference:
          threatIntelligence.reference,

        urlStatus:
          threatIntelligence.urlStatus,

        threat:
          threatIntelligence.threat,

        tags:
          threatIntelligence.tags ?? [],
      },
    });
  } catch (error) {
    console.error(
      "URL scan error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Something went wrong while analyzing the URL.",
      },
      { status: 500 },
    );
  }
}