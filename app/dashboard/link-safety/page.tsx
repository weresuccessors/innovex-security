"use client";

import { useState } from "react";

type Indicator = string | Record<string, unknown>;

type ScanResult = {
  riskScore: number;
  severity: string;
  confidence: number;
  threatDetected: boolean;
  indicators: Indicator[];
  recommendation: string;
  scanId?: string;
  createdAt?: string;
};

type IntelligenceResult = {
  success: boolean;
  found: boolean;
  provider?: string;
  message?: string;
  queryStatus?: string;
  input?: string;
  intelligence?: {
    id?: string | null;
    reference?: string | null;
    url?: string | null;
    status?: string | null;
    host?: string | null;
    dateAdded?: string | null;
    lastOnline?: string | null;
    threat?: string | null;
    reporter?: string | null;
    tags?: string[];
  };
};

function getIndicatorText(indicator: Indicator) {
  if (typeof indicator === "string") {
    return indicator;
  }

  const possibleFields = [
    "message",
    "description",
    "reason",
    "indicator",
    "name",
    "type",
  ];

  for (const field of possibleFields) {
    const value = indicator[field];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return JSON.stringify(indicator);
}

export default function LinkSafetyPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [intelligenceLoading, setIntelligenceLoading] =
    useState(false);

  const [error, setError] = useState("");
  const [result, setResult] = useState<ScanResult | null>(
    null,
  );
  const [intelligence, setIntelligence] =
    useState<IntelligenceResult | null>(null);

  async function handleScan() {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setError("Please enter a URL to scan.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setIntelligence(null);

    try {
      /*
       * STEP 1
       * Run the main Innovex Security URL analysis.
       */
      const scanResponse = await fetch("/api/scan/url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: trimmedUrl,
        }),
      });

      const scanData = await scanResponse.json();

      if (!scanResponse.ok) {
        throw new Error(
          typeof scanData?.error === "string"
            ? scanData.error
            : "URL scan failed.",
        );
      }

      const normalizedResult: ScanResult = {
        riskScore:
          typeof scanData.riskScore === "number"
            ? scanData.riskScore
            : 0,

        severity:
          typeof scanData.severity === "string"
            ? scanData.severity
            : "Low",

        confidence:
          typeof scanData.confidence === "number"
            ? scanData.confidence
            : 0,

        threatDetected:
          scanData.threatDetected === true,

        indicators: Array.isArray(scanData.indicators)
          ? scanData.indicators
          : [],

        recommendation:
          typeof scanData.recommendation === "string"
            ? scanData.recommendation
            : "Review the complete scan result before interacting with the link.",

        scanId:
          typeof scanData.scanId === "string"
            ? scanData.scanId
            : undefined,

        createdAt:
          typeof scanData.createdAt === "string"
            ? scanData.createdAt
            : undefined,
      };

      setResult(normalizedResult);

      /*
       * STEP 2
       * Check the URL against URLhaus.
       *
       * IMPORTANT:
       * The API expects { input: trimmedUrl },
       * NOT { url: trimmedUrl }.
       */
      setIntelligenceLoading(true);

      try {
        const intelligenceResponse = await fetch(
          "/api/threat-intelligence",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              input: trimmedUrl,
            }),
          },
        );

        const intelligenceData =
          (await intelligenceResponse.json()) as IntelligenceResult;

        if (!intelligenceResponse.ok) {
          setIntelligence({
            success: false,
            found: false,
            message:
              typeof intelligenceData?.message === "string"
                ? intelligenceData.message
                : "Threat intelligence lookup failed.",
          });
        } else {
          setIntelligence(intelligenceData);
        }
      } catch {
        setIntelligence({
          success: false,
          found: false,
          message:
            "Unable to complete the external threat-intelligence lookup.",
        });
      } finally {
        setIntelligenceLoading(false);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while scanning the URL.",
      );
    } finally {
      setLoading(false);
    }
  }

  const risk = result?.riskScore ?? 0;

  const severityClass =
    result?.severity === "Critical"
      ? "border-red-500/30 bg-red-500/10 text-red-300"
      : result?.severity === "High"
        ? "border-orange-500/30 bg-orange-500/10 text-orange-300"
        : result?.severity === "Medium"
          ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-300"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <header className="border-b border-white/5 bg-black/20">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-6 py-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/30">
              Security Center
            </p>

            <h1 className="mt-2 text-xl font-semibold">
              Link Safety
            </h1>
          </div>

          <a
            href="/dashboard"
            className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-white/60 transition hover:bg-white/[0.05] hover:text-white"
          >
            ← Dashboard
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-[1180px] px-6 py-8">
        {!result && (
          <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 shadow-2xl shadow-black/20">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-400/70">
                Link Protection
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Check a link before you open it.
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
                Innovex Security analyzes suspicious URL patterns
                and checks available external threat intelligence
                to help determine whether a link may be dangerous.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <input
                  value={url}
                  onChange={(event) =>
                    setUrl(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleScan();
                    }
                  }}
                  placeholder="https://example.com"
                  className="min-h-14 flex-1 rounded-2xl border border-white/10 bg-black/30 px-5 text-sm text-white outline-none placeholder:text-white/25 focus:border-cyan-400/40"
                />

                <button
                  onClick={handleScan}
                  disabled={loading}
                  className="min-h-14 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-7 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Analyzing..." : "Check Link"}
                </button>
              </div>

              {error && (
                <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}
            </div>
          </section>
        )}

        {result && (
          <div className="space-y-6">
            {/* SECURITY RESULT */}
            <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 shadow-2xl shadow-black/20">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/30">
                    Security Result
                  </p>

                  <h2 className="mt-3 text-2xl font-semibold">
                    {result.threatDetected
                      ? "Potential threat detected"
                      : "No significant threat detected"}
                  </h2>

                  <p className="mt-2 break-all text-sm text-white/30">
                    {url}
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wider ${severityClass}`}
                >
                  {result.severity}
                </span>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/25">
                    Risk Score
                  </p>

                  <p className="mt-4 text-3xl font-semibold">
                    {risk}
                    <span className="text-base text-white/25">
                      /100
                    </span>
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/25">
                    Threat Detected
                  </p>

                  <p
                    className={`mt-4 text-2xl font-semibold ${
                      result.threatDetected
                        ? "text-red-300"
                        : "text-emerald-300"
                    }`}
                  >
                    {result.threatDetected ? "Yes" : "No"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/25">
                    Confidence
                  </p>

                  <p className="mt-4 text-3xl font-semibold">
                    {result.confidence}%
                  </p>
                </div>
              </div>
            </section>

            {/* ANALYSIS */}
            <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/30">
                Analysis
              </p>

              <h2 className="mt-3 text-xl font-semibold">
                Why this link received this result
              </h2>

              <div className="mt-6 space-y-3">
                {result.indicators.length > 0 ? (
                  result.indicators.map((indicator, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-orange-500/10 bg-orange-500/5 p-4"
                    >
                      <div className="flex gap-3">
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-300">
                          !
                        </span>

                        <p className="text-sm leading-6 text-white/70">
                          {getIndicatorText(indicator)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-5">
                    <div className="flex gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
                        ✓
                      </span>

                      <div>
                        <p className="text-sm font-medium text-emerald-300">
                          No suspicious indicators were identified.
                        </p>

                        <p className="mt-1 text-xs leading-5 text-white/35">
                          This does not guarantee a website is
                          universally safe. Review the complete
                          result before interacting with an
                          unfamiliar link.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* EXTERNAL THREAT INTELLIGENCE */}
            <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/5 text-cyan-300">
                  ◎
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/30">
                    External Threat Intelligence
                  </p>

                  <h2 className="mt-2 text-xl font-semibold">
                    Intelligence lookup
                  </h2>

                  {intelligenceLoading && (
                    <div className="mt-4 rounded-2xl border border-cyan-400/10 bg-cyan-400/5 p-4">
                      <p className="text-sm text-cyan-300">
                        Checking URLhaus threat intelligence...
                      </p>
                    </div>
                  )}

                  {!intelligenceLoading && intelligence && (
                    <div
                      className={`mt-4 rounded-2xl border p-5 ${
                        intelligence.found
                          ? "border-red-500/20 bg-red-500/5"
                          : intelligence.success
                            ? "border-emerald-500/10 bg-emerald-500/5"
                            : "border-yellow-500/10 bg-yellow-500/5"
                      }`}
                    >
                      <p
                        className={`text-sm font-medium ${
                          intelligence.found
                            ? "text-red-300"
                            : intelligence.success
                              ? "text-emerald-300"
                              : "text-yellow-300"
                        }`}
                      >
                        {intelligence.message ??
                          (intelligence.found
                            ? "URLhaus found a matching malicious URL."
                            : "URLhaus returned no matching malicious URL.")}
                      </p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-white/25">
                            Provider
                          </p>

                          <p className="mt-1 text-sm text-white/60">
                            {intelligence.provider ??
                              "URLhaus"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-white/25">
                            Lookup Status
                          </p>

                          <p className="mt-1 text-sm text-white/60">
                            {intelligence.queryStatus ??
                              "Completed"}
                          </p>
                        </div>
                      </div>

                      {intelligence.found &&
                        intelligence.intelligence && (
                          <div className="mt-5 space-y-2 border-t border-white/5 pt-5">
                            {intelligence.intelligence.threat && (
                              <p className="text-xs text-white/50">
                                <span className="text-white/25">
                                  Threat:
                                </span>{" "}
                                {intelligence.intelligence.threat}
                              </p>
                            )}

                            {intelligence.intelligence.status && (
                              <p className="text-xs text-white/50">
                                <span className="text-white/25">
                                  URL Status:
                                </span>{" "}
                                {intelligence.intelligence.status}
                              </p>
                            )}

                            {intelligence.intelligence.host && (
                              <p className="text-xs text-white/50">
                                <span className="text-white/25">
                                  Host:
                                </span>{" "}
                                {intelligence.intelligence.host}
                              </p>
                            )}

                            {intelligence.intelligence.dateAdded && (
                              <p className="text-xs text-white/50">
                                <span className="text-white/25">
                                  Added:
                                </span>{" "}
                                {intelligence.intelligence.dateAdded}
                              </p>
                            )}

                            {intelligence.intelligence.tags &&
                              intelligence.intelligence.tags
                                .length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-2">
                                  {intelligence.intelligence.tags.map(
                                    (tag) => (
                                      <span
                                        key={tag}
                                        className="rounded-full border border-red-500/10 bg-red-500/5 px-3 py-1 text-[11px] text-red-300"
                                      >
                                        {tag}
                                      </span>
                                    ),
                                  )}
                                </div>
                              )}
                          </div>
                        )}
                    </div>
                  )}

                  {!intelligenceLoading && !intelligence && (
                    <p className="mt-4 text-sm text-white/40">
                      No external intelligence result was returned.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* RECOMMENDED ACTION */}
            <section className="rounded-3xl border border-cyan-400/10 bg-cyan-400/[0.03] p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-300/50">
                Recommended Action
              </p>

              <p className="mt-3 text-sm leading-7 text-white/70">
                {result.recommendation}
              </p>
            </section>

            {/* SCAN DETAILS */}
            <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/30">
                Scan Details
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs text-white/25">
                    Scan ID
                  </p>

                  <p className="mt-1 break-all text-sm text-white/55">
                    {result.scanId ?? "Not available"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-white/25">
                    Scan Time
                  </p>

                  <p className="mt-1 text-sm text-white/55">
                    {result.createdAt
                      ? new Date(
                          result.createdAt,
                        ).toLocaleString()
                      : "Not available"}
                  </p>
                </div>
              </div>
            </section>

            {/* ACTIONS */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => {
                  setResult(null);
                  setIntelligence(null);
                  setError("");
                }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-medium text-white/70 transition hover:bg-white/[0.06] hover:text-white"
              >
                Scan another link
              </button>

              <a
                href="/dashboard/history"
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-3 text-center text-sm font-medium text-white/70 transition hover:bg-white/[0.06] hover:text-white"
              >
                View Scan History
              </a>

              <a
                href="/dashboard/threats"
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-3 text-center text-sm font-medium text-white/70 transition hover:bg-white/[0.06] hover:text-white"
              >
                Open Threat Center
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}