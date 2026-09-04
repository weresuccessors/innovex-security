"use client";

import { useMemo, useState } from "react";

type Severity = "Low" | "Medium" | "High" | "Critical";

type AnalysisResult = {
  riskScore: number;
  severity: Severity;
  threatDetected: boolean;
  confidence: number;
  indicators: string[];
  explanation: string;
  recommendation: string;
  scanId?: string;
  createdAt?: string;
};

export default function EmailGuardPage() {
  const [sender, setSender] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] =
    useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const characterCount = content.length;

  const canAnalyze = useMemo(() => {
    return (
      sender.trim().length > 0 ||
      subject.trim().length > 0 ||
      content.trim().length > 0
    );
  }, [sender, subject, content]);

  async function handleAnalyze(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setErrorMessage("");
    setResult(null);

    if (!canAnalyze) {
      setErrorMessage(
        "Enter at least a sender, subject, or email message before analyzing.",
      );
      return;
    }

    setAnalyzing(true);

    try {
      const response = await fetch("/api/scan/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: sender.trim(),
          subject: subject.trim(),
          content: content.trim(),
        }),
      });

      const responseText = await response.text();

      let data: {
        success?: boolean;
        error?: string;
        scanId?: string;
        createdAt?: string;
        analysis?: {
          riskScore: number;
          severity: Severity;
          threatDetected: boolean;
          confidence: number;
          indicators: string[];
          explanation: string;
          recommendation: string;
        };
        riskScore?: number;
        severity?: Severity;
        threatDetected?: boolean;
        confidence?: number;
        indicators?: string[];
        explanation?: string;
        recommendation?: string;
      } = {};

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error(
            `Server returned an unexpected response (HTTP ${response.status}).`,
          );
        }
      }

      if (!response.ok || data.success === false) {
        throw new Error(
          data.error ||
            `Email analysis failed (HTTP ${response.status}).`,
        );
      }

      const serverAnalysis = data.analysis;

      const normalizedResult: AnalysisResult = {
        riskScore:
          serverAnalysis?.riskScore ??
          data.riskScore ??
          0,

        severity:
          serverAnalysis?.severity ??
          data.severity ??
          "Low",

        threatDetected:
          serverAnalysis?.threatDetected ??
          data.threatDetected ??
          false,

        confidence:
          serverAnalysis?.confidence ??
          data.confidence ??
          0,

        indicators:
          serverAnalysis?.indicators ??
          data.indicators ??
          [],

        explanation:
          serverAnalysis?.explanation ??
          data.explanation ??
          "The email was analyzed by the Email Guard security engine.",

        recommendation:
          serverAnalysis?.recommendation ??
          data.recommendation ??
          "Treat unexpected messages cautiously and independently verify suspicious requests.",

        scanId: data.scanId,
        createdAt: data.createdAt,
      };

      setResult(normalizedResult);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to analyze the email. Please try again.",
      );
    } finally {
      setAnalyzing(false);
    }
  }

  function handleClear() {
    setSender("");
    setSubject("");
    setContent("");
    setResult(null);
    setErrorMessage("");
  }

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        {/* Header */}
        <header className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-xl">
              📧
            </div>

            <div>
              <p className="text-sm font-medium text-cyan-400">
                INNOVEX SECURITY
              </p>

              <h1 className="text-3xl font-bold tracking-tight">
                Email Guard
              </h1>
            </div>
          </div>

          <p className="max-w-3xl text-sm leading-6 text-slate-400">
            Analyze suspicious emails for phishing signals, social
            engineering patterns, malicious links, credential requests,
            and other security indicators.
          </p>
        </header>

        {/* Status */}
        <section className="mb-6 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.04] p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-lg">
              🛡️
            </div>

            <div>
              <h2 className="font-semibold text-emerald-300">
                Email analysis engine ready
              </h2>

              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
                Innovex Security examines the information you provide and
                looks for observable security indicators. Results are based
                on the submitted email content and are not fabricated.
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          {/* Analyzer */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  Analyze an Email
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Paste the email details below and run a security
                  analysis.
                </p>
              </div>

              <span className="rounded-full border border-cyan-400/15 bg-cyan-400/[0.05] px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-cyan-300/70">
                Email Engine
              </span>
            </div>

            <form
              onSubmit={handleAnalyze}
              className="space-y-5"
            >
              {/* Sender */}
              <div>
                <label
                  htmlFor="sender"
                  className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500"
                >
                  Sender
                </label>

                <input
                  id="sender"
                  type="text"
                  value={sender}
                  onChange={(event) =>
                    setSender(event.target.value)
                  }
                  placeholder="security@example.com"
                  className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50"
                />
              </div>

              {/* Subject */}
              <div>
                <label
                  htmlFor="subject"
                  className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500"
                >
                  Subject
                </label>

                <input
                  id="subject"
                  type="text"
                  value={subject}
                  onChange={(event) =>
                    setSubject(event.target.value)
                  }
                  placeholder="Urgent: Verify your account"
                  className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50"
                />
              </div>

              {/* Email Content */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="content"
                    className="text-xs font-medium uppercase tracking-wider text-slate-500"
                  >
                    Email Content
                  </label>

                  <span className="text-[10px] text-slate-600">
                    {characterCount.toLocaleString()} characters
                  </span>
                </div>

                <textarea
                  id="content"
                  value={content}
                  onChange={(event) =>
                    setContent(event.target.value)
                  }
                  placeholder={`Paste the email message here...

Example:
Dear customer,

Your account requires immediate verification.
Please click the link below to confirm your identity.

Thank you.`}
                  rows={14}
                  className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-4 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50"
                />
              </div>

              {/* Error */}
              {errorMessage && (
                <div className="rounded-xl border border-red-400/20 bg-red-400/[0.05] px-4 py-3">
                  <p className="text-sm text-red-300">
                    {errorMessage}
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={analyzing}
                  className="h-12 flex-1 rounded-xl bg-cyan-400 px-6 text-sm font-semibold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {analyzing
                    ? "Analyzing email..."
                    : "Analyze Email"}
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  className="h-12 rounded-xl border border-white/10 bg-white/[0.03] px-6 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                >
                  Clear
                </button>
              </div>
            </form>
          </section>

          {/* Analysis Result / Information */}
          <section>
            {result ? (
              <AnalysisResultCard result={result} />
            ) : (
              <EmptyAnalysisState />
            )}
          </section>
        </div>

        {/* Detection Capabilities */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Email Security Checks
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Observable signals currently examined by the Email Guard
              analysis engine.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <CapabilityCard
              icon="🔗"
              title="Suspicious Links"
              description="Looks for URLs and potentially deceptive link patterns."
            />

            <CapabilityCard
              icon="🔐"
              title="Credential Requests"
              description="Detects requests for passwords, OTPs, card details, or credentials."
            />

            <CapabilityCard
              icon="⚡"
              title="Urgency Signals"
              description="Identifies pressure tactics commonly used in social engineering."
            />

            <CapabilityCard
              icon="🎭"
              title="Impersonation"
              description="Looks for language that attempts to imitate trusted organizations."
            />
          </div>
        </section>

        {/* Workflow */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Email Guard Pipeline
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              How Innovex Security processes an email analysis.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            <PipelineStep
              number="01"
              title="Email Input"
            />

            <PipelineStep
              number="02"
              title="Preprocess"
            />

            <PipelineStep
              number="03"
              title="Security Signals"
            />

            <PipelineStep
              number="04"
              title="Risk Analysis"
            />

            <PipelineStep
              number="05"
              title="Security Result"
            />
          </div>
        </section>

        {/* Transparency */}
        <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] px-5 py-4">
          <p className="text-xs leading-5 text-slate-500">
            Current Email Guard analysis uses transparent security
            heuristics applied to the email information you submit.
            Results are processed by the Innovex Security server and
            saved to your security scan history. Future versions can
            combine this analysis with the Innovex AI engine and
            external threat intelligence without presenting unverified
            intelligence as fact.
          </p>
        </div>
      </div>
    </main>
  );
}

function AnalysisResultCard({
  result,
}: {
  result: AnalysisResult;
}) {
  const severityClass =
    getSeverityClass(result.severity);

  return (
    <div className="space-y-4">
      {/* Main Result */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Analysis Result
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              Email Security Assessment
            </h2>
          </div>

          <span
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${severityClass}`}
          >
            {result.severity}
          </span>
        </div>

        <div className="flex items-center gap-6">
          <RiskCircle score={result.riskScore} />

          <div>
            <p className="text-sm text-slate-400">
              Risk score
            </p>

            <p className="mt-1 text-2xl font-bold">
              {result.riskScore}
              <span className="ml-1 text-sm font-normal text-slate-600">
                / 100
              </span>
            </p>

            <p
              className={`mt-2 text-xs font-medium ${
                result.threatDetected
                  ? "text-red-400"
                  : "text-emerald-400"
              }`}
            >
              {result.threatDetected
                ? "Threat detected"
                : "No high-risk threat detected"}
            </p>
          </div>
        </div>
      </div>

      {/* Scan ID */}
      {result.scanId && (
        <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.025] px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                Scan ID
              </p>

              <p className="mt-1 break-all font-mono text-xs text-cyan-300/70">
                {result.scanId}
              </p>
            </div>

            <span className="shrink-0 rounded-full border border-emerald-400/15 bg-emerald-400/[0.04] px-3 py-1 text-[10px] font-medium text-emerald-300">
              Saved
            </span>
          </div>
        </div>
      )}

      {/* Explanation */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/10">
            🧠
          </div>

          <h3 className="font-semibold">
            Why this result?
          </h3>
        </div>

        <p className="text-sm leading-6 text-slate-400">
          {result.explanation}
        </p>
      </div>

      {/* Indicators */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">
            Detected Indicators
          </h3>

          <span className="text-xs text-slate-600">
            {result.indicators.length} found
          </span>
        </div>

        {result.indicators.length === 0 ? (
          <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.03] p-4">
            <p className="text-sm text-emerald-300">
              No observable security indicators were found.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {result.indicators.map(
              (indicator, index) => (
                <div
                  key={`${indicator}-${index}`}
                  className="flex gap-3 rounded-xl border border-white/10 bg-black/20 p-3"
                >
                  <span className="text-xs text-yellow-400">
                    ⚠
                  </span>

                  <p className="text-xs leading-5 text-slate-400">
                    {indicator}
                  </p>
                </div>
              ),
            )}
          </div>
        )}
      </div>

      {/* Confidence */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">
              Analysis Confidence
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Confidence reflects the number of observable signals
              available to the current rule-based analyzer.
            </p>
          </div>

          <span className="text-xl font-bold text-cyan-400">
            {result.confidence}%
          </span>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-cyan-400 transition-all"
            style={{
              width: `${result.confidence}%`,
            }}
          />
        </div>
      </div>

      {/* Recommendation */}
      <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.025] p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400/10">
            🛡️
          </div>

          <h3 className="font-semibold">
            Recommended Action
          </h3>
        </div>

        <p className="text-sm leading-6 text-slate-400">
          {result.recommendation}
        </p>
      </div>
    </div>
  );
}

function RiskCircle({
  score,
}: {
  score: number;
}) {
  const radius = 43;
  const circumference =
    2 * Math.PI * radius;

  const offset =
    circumference -
    (score / 100) * circumference;

  const colorClass =
    score >= 80
      ? "text-red-400"
      : score >= 60
        ? "text-orange-400"
        : score >= 30
          ? "text-yellow-400"
          : "text-emerald-400";

  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg
        viewBox="0 0 110 110"
        className="h-full w-full -rotate-90"
      >
        <circle
          cx="55"
          cy="55"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="8"
        />

        <circle
          cx="55"
          cy="55"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={colorClass}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">
          {score}
        </span>

        <span className="text-[9px] uppercase tracking-widest text-slate-600">
          risk
        </span>
      </div>
    </div>
  );
}

function EmptyAnalysisState() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
      <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-3xl">
          📧
        </div>

        <h2 className="mt-5 text-lg font-semibold">
          Ready to analyze
        </h2>

        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
          Enter the sender, subject, and email content on the left.
          Your analysis result will appear here.
        </p>

        <div className="mt-6 rounded-xl border border-white/5 bg-black/20 px-4 py-3">
          <p className="text-xs text-slate-600">
            Analyze suspicious emails before clicking links,
            opening attachments, or sharing sensitive information.
          </p>
        </div>
      </div>
    </div>
  );
}

function CapabilityCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-5">
      <div className="mb-4 text-2xl">
        {icon}
      </div>

      <h3 className="text-sm font-semibold">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function PipelineStep({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="mb-3 text-xs font-semibold tracking-widest text-cyan-400">
        {number}
      </div>

      <div className="text-sm font-medium text-slate-200">
        {title}
      </div>
    </div>
  );
}

function getSeverityClass(
  severity: Severity,
) {
  switch (severity) {
    case "Critical":
      return "border-red-400/30 bg-red-400/10 text-red-300";

    case "High":
      return "border-orange-400/30 bg-orange-400/10 text-orange-300";

    case "Medium":
      return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";

    default:
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }
}