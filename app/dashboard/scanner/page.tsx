"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type ScanResult = {
  input: string;
  normalizedUrl: string;
  hostname: string;
  protocol: string;
  riskScore: number;
  severity: string;
  indicators: string[];
  recommendation: string;
  analysisType: string;
  confidence?: number;
  threatDetected?: boolean;
  scanId?: string;
  createdAt?: string;
  threatIntelligence?: {
    checked: boolean;
    message: string;
  };
};

export default function ThreatScannerPage() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleScan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = url.trim();

    if (!value) {
      setErrorMessage("Please enter a URL to analyze.");
      setResult(null);
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setResult(null);

    try {
      const response = await fetch("/api/scan/url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: value,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to analyze this URL.",
        );
      }

      /*
       * The API may return the scan object directly
       * or inside a "result" property.
       *
       * Supporting both keeps this page compatible
       * with the working Dashboard scanner API.
       */
      const scanData = data.result ?? data;

      const normalizedResult: ScanResult = {
        input: scanData.input ?? value,
        normalizedUrl:
          scanData.normalizedUrl ??
          scanData.url ??
          value,
        hostname:
          scanData.hostname ??
          scanData.domain ??
          "Unknown",
        protocol:
          scanData.protocol ??
          (() => {
            try {
              return new URL(value).protocol.replace(":", "");
            } catch {
              return "unknown";
            }
          })(),
        riskScore: Number(scanData.riskScore ?? 0),
        severity: scanData.severity ?? "Low",
        indicators: Array.isArray(scanData.indicators)
          ? scanData.indicators
          : [],
        recommendation:
          scanData.recommendation ??
          "No additional action is required based on the current analysis.",
        analysisType:
          scanData.analysisType ??
          "URL heuristic analysis",
        confidence:
          typeof scanData.confidence === "number"
            ? scanData.confidence
            : undefined,
        threatDetected:
          typeof scanData.threatDetected === "boolean"
            ? scanData.threatDetected
            : undefined,
        scanId: scanData.scanId,
        createdAt: scanData.createdAt,
        threatIntelligence:
          scanData.threatIntelligence,
      };

      setResult(normalizedResult);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while analyzing the URL.",
      );
    } finally {
      setLoading(false);
    }
  }

  function getSeverityClass(severity: string) {
    switch (severity.toLowerCase()) {
      case "critical":
        return "border-red-400/20 bg-red-400/[0.06] text-red-300";

      case "high":
        return "border-orange-400/20 bg-orange-400/[0.06] text-orange-300";

      case "medium":
        return "border-yellow-400/20 bg-yellow-400/[0.06] text-yellow-300";

      default:
        return "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300";
    }
  }

  function getScoreClass(score: number) {
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
    <main className="min-h-screen bg-[#05070b] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[25%] top-[-250px] h-[600px] w-[800px] rounded-full bg-blue-500/[0.035] blur-3xl" />

        <div className="absolute right-[-250px] top-[20%] h-[550px] w-[550px] rounded-full bg-purple-500/[0.025] blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen">
        {/* ================================================= */}
        {/* TOP BAR */}
        {/* ================================================= */}

        <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-white/[0.07] bg-[#05070b]/90 px-5 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-sm text-white/50 transition hover:bg-white/[0.07] hover:text-white"
            >
              ←
            </Link>

            <div>
              <div className="text-[9px] font-medium uppercase tracking-[0.2em] text-white/20">
                Security Center
              </div>

              <div className="mt-1 text-sm font-medium">
                Threat Scanner
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-emerald-400/10 bg-emerald-400/[0.025] px-3 py-1.5 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

            <span className="text-[9px] text-emerald-300/70">
              Scanner operational
            </span>
          </div>
        </header>

        {/* ================================================= */}
        {/* CONTENT */}
        {/* ================================================= */}

        <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8 sm:py-12">
          {/* Header */}
          <section>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/10 bg-blue-400/[0.025] px-3 py-1.5 text-[9px] font-medium text-blue-300/70">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              AI-assisted threat analysis
            </div>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Threat Scanner
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/30">
              Analyze suspicious URLs before you open them. Innovex
              examines security indicators and calculates a risk
              score to help you make a safer decision.
            </p>
          </section>

          {/* ================================================= */}
          {/* SCANNER TYPE */}
          {/* ================================================= */}

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* URL Scanner */}
            <div className="rounded-2xl border border-blue-400/15 bg-blue-400/[0.035] p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-400/[0.08]">
                🔗
              </div>

              <h2 className="mt-4 text-sm font-semibold">
                URL Scanner
              </h2>

              <p className="mt-1 text-[10px] leading-5 text-white/25">
                Analyze suspicious links and websites.
              </p>

              <div className="mt-4 text-[9px] text-emerald-400/70">
                ● Active scanner
              </div>
            </div>

            {/* Email Analyzer */}
            <Link
              href="/dashboard/email"
              className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 transition hover:border-blue-400/15 hover:bg-blue-400/[0.025]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04]">
                📧
              </div>

              <h2 className="mt-4 text-sm font-semibold">
                Email Analyzer
              </h2>

              <p className="mt-1 text-[10px] leading-5 text-white/25">
                Detect phishing and suspicious email content.
              </p>

              <div className="mt-4 text-[9px] text-emerald-400/70">
                ● Open Email Guard →
              </div>
            </Link>

            {/* SMS Analyzer */}
            <Link
              href="/dashboard/sms"
              className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 transition hover:border-blue-400/15 hover:bg-blue-400/[0.025]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04]">
                📱
              </div>

              <h2 className="mt-4 text-sm font-semibold">
                SMS Analyzer
              </h2>

              <p className="mt-1 text-[10px] leading-5 text-white/25">
                Detect smishing and suspicious messages.
              </p>

              <div className="mt-4 text-[9px] text-emerald-400/70">
                ● Open SMS Guard →
              </div>
            </Link>

            {/* Link Safety */}
            <Link
              href="/dashboard/link-safety"
              className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.025] p-5 transition hover:border-cyan-400/20 hover:bg-cyan-400/[0.045]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/[0.08]">
                🛡️
              </div>

              <h2 className="mt-4 text-sm font-semibold">
                Link Safety
              </h2>

              <p className="mt-1 text-[10px] leading-5 text-white/25">
                Check links with URL analysis and threat intelligence.
              </p>

              <div className="mt-4 text-[9px] text-emerald-400/70">
                ● URLhaus connected →
              </div>
            </Link>
          </div>

          {/* ================================================= */}
          {/* URL INPUT */}
          {/* ================================================= */}

          <section className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-400/[0.08] text-lg">
                🔍
              </div>

              <div>
                <h2 className="font-semibold">
                  Analyze a suspicious URL
                </h2>

                <p className="mt-1 text-[10px] leading-5 text-white/25">
                  Paste the complete URL below. Do not open the
                  website first.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleScan}
              className="mt-7"
            >
              <label
                htmlFor="url"
                className="mb-2 block text-[10px] font-medium uppercase tracking-[0.15em] text-white/25"
              >
                URL to analyze
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="url"
                  type="text"
                  value={url}
                  onChange={(event) =>
                    setUrl(event.target.value)
                  }
                  placeholder="https://example.com"
                  className="min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/15 transition focus:border-blue-400/30 focus:bg-black/40"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Analyzing..." : "Analyze URL"}
                </button>
              </div>

              {errorMessage && (
                <div className="mt-4 rounded-xl border border-red-400/15 bg-red-400/[0.04] px-4 py-3 text-xs text-red-300/80">
                  {errorMessage}
                </div>
              )}
            </form>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-[9px] text-white/20">
                HTTPS inspection
              </span>

              <span className="rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-[9px] text-white/20">
                IP detection
              </span>

              <span className="rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-[9px] text-white/20">
                Suspicious keywords
              </span>

              <span className="rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-[9px] text-white/20">
                URL structure
              </span>

              <span className="rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-[9px] text-white/20">
                Threat intelligence
              </span>
            </div>
          </section>

          {/* ================================================= */}
          {/* RESULT */}
          {/* ================================================= */}

          {result && (
            <section className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                <div>
                  <div className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/20">
                    Analysis complete
                  </div>

                  <h2 className="mt-2 text-xl font-semibold">
                    Security Analysis Result
                  </h2>

                  <p className="mt-2 max-w-2xl break-all text-[11px] text-white/25">
                    {result.normalizedUrl}
                  </p>
                </div>

                <div
                  className={`w-fit rounded-full border px-3 py-1.5 text-[9px] font-medium uppercase tracking-wider ${getSeverityClass(
                    result.severity,
                  )}`}
                >
                  {result.severity} risk
                </div>
              </div>

              {/* Result metrics */}
              <div className="mt-7 grid gap-4 md:grid-cols-4">
                {/* Risk */}
                <div className="rounded-xl border border-white/[0.07] bg-black/20 p-5">
                  <div className="text-[9px] uppercase tracking-[0.16em] text-white/20">
                    Risk score
                  </div>

                  <div
                    className={`mt-3 text-4xl font-semibold ${getScoreClass(
                      result.riskScore,
                    )}`}
                  >
                    {result.riskScore}
                    <span className="ml-1 text-sm text-white/20">
                      /100
                    </span>
                  </div>
                </div>

                {/* Domain */}
                <div className="rounded-xl border border-white/[0.07] bg-black/20 p-5">
                  <div className="text-[9px] uppercase tracking-[0.16em] text-white/20">
                    Domain
                  </div>

                  <div className="mt-3 break-all text-sm font-medium">
                    {result.hostname}
                  </div>

                  <div className="mt-2 text-[9px] text-white/20">
                    Protocol: {result.protocol}
                  </div>
                </div>

                {/* Confidence */}
                <div className="rounded-xl border border-white/[0.07] bg-black/20 p-5">
                  <div className="text-[9px] uppercase tracking-[0.16em] text-white/20">
                    Confidence
                  </div>

                  <div className="mt-3 text-4xl font-semibold text-white">
                    {result.confidence ?? "—"}
                    {typeof result.confidence === "number" && (
                      <span className="ml-1 text-sm text-white/20">
                        %
                      </span>
                    )}
                  </div>
                </div>

                {/* Analysis */}
                <div className="rounded-xl border border-white/[0.07] bg-black/20 p-5">
                  <div className="text-[9px] uppercase tracking-[0.16em] text-white/20">
                    Analysis type
                  </div>

                  <div className="mt-3 text-sm font-medium">
                    URL Analysis
                  </div>

                  <div className="mt-2 text-[9px] text-white/20">
                    {result.analysisType}
                  </div>
                </div>
              </div>

              {/* Threat status */}
              {typeof result.threatDetected === "boolean" && (
                <div
                  className={`mt-5 rounded-xl border p-5 ${
                    result.threatDetected
                      ? "border-red-400/15 bg-red-400/[0.035]"
                      : "border-emerald-400/10 bg-emerald-400/[0.025]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        result.threatDetected
                          ? "text-red-300"
                          : "text-emerald-300"
                      }
                    >
                      {result.threatDetected ? "!" : "✓"}
                    </span>

                    <div>
                      <div className="text-xs font-medium">
                        {result.threatDetected
                          ? "Potential threat detected"
                          : "No threat detected"}
                      </div>

                      <div className="mt-1 text-[9px] text-white/20">
                        Based on the current Innovex security analysis.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Risk meter */}
              <div className="mt-5 rounded-xl border border-white/[0.07] bg-black/20 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-[0.16em] text-white/20">
                    Risk level
                  </span>

                  <span className="text-[9px] text-white/25">
                    {result.riskScore}/100
                  </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className={`h-full rounded-full ${
                      result.riskScore >= 80
                        ? "bg-red-400"
                        : result.riskScore >= 60
                          ? "bg-orange-400"
                          : result.riskScore >= 30
                            ? "bg-yellow-400"
                            : "bg-emerald-400"
                    }`}
                    style={{
                      width: `${Math.max(
                        Math.min(result.riskScore, 100),
                        2,
                      )}%`,
                    }}
                  />
                </div>

                <div className="mt-2 flex justify-between text-[8px] text-white/15">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                  <span>Critical</span>
                </div>
              </div>

              {/* Indicators */}
              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <div className="rounded-xl border border-white/[0.07] bg-black/20 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">
                      Security indicators
                    </h3>

                    <span className="text-[9px] text-white/20">
                      {result.indicators.length} detected
                    </span>
                  </div>

                  {result.indicators.length === 0 ? (
                    <div className="mt-5 flex items-center gap-3 rounded-lg border border-emerald-400/10 bg-emerald-400/[0.025] p-4">
                      <span className="text-emerald-300">
                        ✓
                      </span>

                      <p className="text-[10px] leading-5 text-white/30">
                        No obvious high-risk indicators were
                        detected.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-2">
                      {result.indicators.map(
                        (indicator, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 rounded-lg border border-red-400/10 bg-red-400/[0.025] p-3"
                          >
                            <span className="mt-0.5 text-red-300">
                              !
                            </span>

                            <span className="text-[10px] leading-5 text-white/35">
                              {indicator}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>

                {/* Recommendation */}
                <div className="rounded-xl border border-white/[0.07] bg-black/20 p-5">
                  <h3 className="text-sm font-medium">
                    Recommended action
                  </h3>

                  <div className="mt-5 rounded-lg border border-blue-400/10 bg-blue-400/[0.025] p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-blue-300">
                        →
                      </span>

                      <p className="text-[10px] leading-5 text-white/35">
                        {result.recommendation}
                      </p>
                    </div>
                  </div>

                  {result.threatIntelligence && (
                    <div className="mt-4 rounded-lg border border-white/[0.06] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[9px] uppercase tracking-[0.15em] text-white/20">
                          Threat intelligence
                        </div>

                        <span
                          className={`text-[9px] ${
                            result.threatIntelligence.checked
                              ? "text-emerald-300/70"
                              : "text-yellow-300/60"
                          }`}
                        >
                          {result.threatIntelligence.checked
                            ? "Checked"
                            : "Not checked"}
                        </span>
                      </div>

                      <p className="mt-2 text-[10px] text-white/25">
                        {result.threatIntelligence.message}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ================================================= */}
          {/* HOW IT WORKS */}
          {/* ================================================= */}

          <section className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 sm:p-8">
            <div className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/20">
              How Innovex analyzes URLs
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <div>
                <div className="text-lg">01</div>

                <h3 className="mt-3 text-xs font-semibold">
                  Input
                </h3>

                <p className="mt-2 text-[10px] leading-5 text-white/20">
                  You provide a suspicious URL without opening it.
                </p>
              </div>

              <div>
                <div className="text-lg">02</div>

                <h3 className="mt-3 text-xs font-semibold">
                  Inspect
                </h3>

                <p className="mt-2 text-[10px] leading-5 text-white/20">
                  Innovex examines URL structure and security
                  indicators.
                </p>
              </div>

              <div>
                <div className="text-lg">03</div>

                <h3 className="mt-3 text-xs font-semibold">
                  Score
                </h3>

                <p className="mt-2 text-[10px] leading-5 text-white/20">
                  Detected indicators contribute to a risk score.
                </p>
              </div>

              <div>
                <div className="text-lg">04</div>

                <h3 className="mt-3 text-xs font-semibold">
                  Explain
                </h3>

                <p className="mt-2 text-[10px] leading-5 text-white/20">
                  The result explains what was detected and what to
                  do next.
                </p>
              </div>
            </div>
          </section>

          {/* ================================================= */}
          {/* FOOTER */}
          {/* ================================================= */}

          <footer className="mt-10 border-t border-white/[0.07] py-7">
            <div className="flex flex-col justify-between gap-3 text-[9px] text-white/15 sm:flex-row">
              <span>
                Innovex Security — Your Personal AI Security Center
              </span>

              <span>
                Detect. Analyze. Respond. Protect.
              </span>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}