"use client";

import { FormEvent, useState } from "react";

type ScanResult = {
  success: boolean;
  scanId?: string;
  createdAt?: string;
  url?: string;
  riskScore?: number;
  severity?: "Low" | "Medium" | "High" | "Critical";
  confidence?: number;
  threatDetected?: boolean;
  domain?: string;
  protocol?: string;
  analysisType?: string;
  indicators?: string[];
  recommendation?: string;
  threatIntelligence?: {
    checked: boolean;
    message: string;
  };
  error?: string;
};

export default function QuickScanner() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setResult(null);

    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setError("Please enter a URL to analyze.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/scan/url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: trimmedUrl,
        }),
      });

      const data: ScanResult = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to analyze this URL."
        );
      }

      setResult(data);
    } catch (err) {
      console.error("Scanner error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while analyzing the URL."
      );
    } finally {
      setLoading(false);
    }
  }

  function getSeverityClass(
    severity?: ScanResult["severity"]
  ) {
    switch (severity) {
      case "Critical":
        return "border-red-400/20 bg-red-400/[0.06] text-red-300";

      case "High":
        return "border-orange-400/20 bg-orange-400/[0.06] text-orange-300";

      case "Medium":
        return "border-yellow-400/20 bg-yellow-400/[0.06] text-yellow-300";

      default:
        return "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300";
    }
  }

  function getScoreClass(score?: number) {
    if (score === undefined) {
      return "text-white";
    }

    if (score >= 80) {
      return "text-red-300";
    }

    if (score >= 60) {
      return "text-orange-300";
    }

    if (score >= 30) {
      return "text-yellow-300";
    }

    return "text-emerald-300";
  }

  return (
    <div className="mt-7">
      {/* ===================================================== */}
      {/* SCAN FORM */}
      {/* ===================================================== */}

      <form
        onSubmit={handleSubmit}
        className="relative z-20"
      >
        <label
          htmlFor="quick-scanner-url"
          className="mb-2 block text-[9px] font-medium uppercase tracking-[0.18em] text-white/25"
        >
          URL to analyze
        </label>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="quick-scanner-url"
            type="text"
            value={url}
            onChange={(event) =>
              setUrl(event.target.value)
            }
            placeholder="https://example.com"
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/20 transition focus:border-blue-400/30 focus:bg-black/30"
          />

          <button
            type="submit"
            disabled={loading}
            className="relative z-30 inline-flex min-h-[50px] shrink-0 cursor-pointer items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Analyzing..." : "Analyze URL"}
          </button>
        </div>
      </form>

      {/* ===================================================== */}
      {/* ERROR */}
      {/* ===================================================== */}

      {error && (
        <div className="mt-5 rounded-xl border border-red-400/15 bg-red-400/[0.04] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-400/[0.08] text-sm text-red-300">
              !
            </div>

            <div>
              <p className="text-xs font-medium text-red-300">
                Scan could not be completed
              </p>

              <p className="mt-1 text-[10px] leading-5 text-red-200/50">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* LOADING */}
      {/* ===================================================== */}

      {loading && (
        <div className="mt-5 rounded-xl border border-blue-400/10 bg-blue-400/[0.025] p-4">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />

            <div>
              <p className="text-xs font-medium text-blue-200/80">
                Innovex Security is analyzing the URL
              </p>

              <p className="mt-1 text-[10px] text-white/20">
                Inspecting URL structure and security indicators...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* RESULT */}
      {/* ===================================================== */}

      {result && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-black/20">
          {/* Result Header */}
          <div className="border-b border-white/[0.07] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/20">
                  Analysis complete
                </div>

                <h3 className="mt-1 text-sm font-semibold">
                  Security analysis result
                </h3>
              </div>

              <div
                className={`w-fit rounded-full border px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wider ${getSeverityClass(
                  result.severity
                )}`}
              >
                {result.severity || "Unknown"} risk
              </div>
            </div>
          </div>

          {/* Score + URL */}
          <div className="grid gap-4 p-5 sm:grid-cols-[180px_1fr]">
            {/* Score */}
            <div className="flex min-h-[150px] flex-col items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.02]">
              <div className="text-[9px] uppercase tracking-[0.18em] text-white/20">
                Risk score
              </div>

              <div
                className={`mt-2 text-5xl font-semibold ${getScoreClass(
                  result.riskScore
                )}`}
              >
                {result.riskScore ?? 0}
              </div>

              <div className="mt-1 text-[9px] text-white/20">
                out of 100
              </div>
            </div>

            {/* URL Details */}
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <div className="text-[9px] uppercase tracking-[0.18em] text-white/20">
                Analyzed URL
              </div>

              <p className="mt-3 break-all text-xs leading-5 text-white/60">
                {result.url}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div>
                  <div className="text-[8px] uppercase tracking-wider text-white/15">
                    Domain
                  </div>

                  <div className="mt-1 truncate text-[10px] text-white/40">
                    {result.domain || "—"}
                  </div>
                </div>

                <div>
                  <div className="text-[8px] uppercase tracking-wider text-white/15">
                    Protocol
                  </div>

                  <div className="mt-1 text-[10px] uppercase text-white/40">
                    {result.protocol || "—"}
                  </div>
                </div>

                <div>
                  <div className="text-[8px] uppercase tracking-wider text-white/15">
                    Confidence
                  </div>

                  <div className="mt-1 text-[10px] text-white/40">
                    {result.confidence ?? 0}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Threat Status */}
          <div className="px-5 pb-5">
            <div
              className={`rounded-xl border p-4 ${
                result.threatDetected
                  ? "border-orange-400/15 bg-orange-400/[0.035]"
                  : "border-emerald-400/15 bg-emerald-400/[0.035]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    result.threatDetected
                      ? "bg-orange-400/[0.08] text-orange-300"
                      : "bg-emerald-400/[0.08] text-emerald-300"
                  }`}
                >
                  {result.threatDetected ? "!" : "✓"}
                </div>

                <div>
                  <div
                    className={`text-xs font-medium ${
                      result.threatDetected
                        ? "text-orange-200/80"
                        : "text-emerald-200/80"
                    }`}
                  >
                    {result.threatDetected
                      ? "Potential threat indicators detected"
                      : "No significant threat indicators detected"}
                  </div>

                  <div className="mt-1 text-[9px] text-white/20">
                    {result.analysisType ||
                      "URL security analysis"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Indicators */}
          <div className="border-t border-white/[0.07] p-5">
            <div className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/20">
              Security indicators
            </div>

            {result.indicators &&
            result.indicators.length > 0 ? (
              <div className="mt-4 space-y-2">
                {result.indicators.map(
                  (indicator, index) => (
                    <div
                      key={`${indicator}-${index}`}
                      className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.015] p-3"
                    >
                      <span className="mt-1 flex h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400/70" />

                      <span className="text-[10px] leading-5 text-white/35">
                        {indicator}
                      </span>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.025] p-4">
                <p className="text-[10px] text-emerald-300/60">
                  No suspicious indicators were detected by the
                  current heuristic checks.
                </p>
              </div>
            )}
          </div>

          {/* Recommendation */}
          <div className="border-t border-white/[0.07] p-5">
            <div className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/20">
              Recommended action
            </div>

            <div className="mt-3 rounded-xl border border-blue-400/10 bg-blue-400/[0.025] p-4">
              <p className="text-[10px] leading-5 text-white/40">
                {result.recommendation ||
                  "Review the result carefully before interacting with the URL."}
              </p>
            </div>
          </div>

          {/* Threat Intelligence */}
          <div className="border-t border-white/[0.07] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/20">
                  Threat intelligence
                </div>

                <p className="mt-2 text-[10px] leading-5 text-white/25">
                  {result.threatIntelligence?.message ||
                    "External threat intelligence is not connected yet."}
                </p>
              </div>

              <span className="shrink-0 rounded-full border border-white/[0.07] px-3 py-1.5 text-[8px] uppercase tracking-wider text-white/20">
                {result.threatIntelligence?.checked
                  ? "Checked"
                  : "Not connected"}
              </span>
            </div>
          </div>

          {/* Saved Scan */}
          {result.scanId && (
            <div className="border-t border-white/[0.07] bg-white/[0.01] px-5 py-4">
              <div className="flex flex-col gap-1 text-[8px] text-white/15 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Scan saved to your Innovex Security account
                </span>

                <span className="font-mono">
                  {result.scanId}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================== */}
      {/* SECURITY CHECKS */}
      {/* ===================================================== */}

      {!result && !error && !loading && (
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/[0.07] bg-white/[0.015] px-3 py-1.5 text-[8px] text-white/20">
            HTTPS inspection
          </span>

          <span className="rounded-full border border-white/[0.07] bg-white/[0.015] px-3 py-1.5 text-[8px] text-white/20">
            IP detection
          </span>

          <span className="rounded-full border border-white/[0.07] bg-white/[0.015] px-3 py-1.5 text-[8px] text-white/20">
            Suspicious keywords
          </span>

          <span className="rounded-full border border-white/[0.07] bg-white/[0.015] px-3 py-1.5 text-[8px] text-white/20">
            URL structure
          </span>
        </div>
      )}
    </div>
  );
}