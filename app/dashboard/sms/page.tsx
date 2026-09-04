"use client";

import { useMemo, useState } from "react";

type Severity = "Low" | "Medium" | "High" | "Critical";

type Indicator = {
  title: string;
  detail: string;
  points: number;
};

type AnalysisResult = {
  riskScore: number;
  severity: Severity;
  threatDetected: boolean;
  confidence: number;
  indicators: Indicator[];
  explanation: string;
  recommendation: string;
  scanId?: string;
};

function getSeverityClass(severity: Severity) {
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

function getRiskRingClass(riskScore: number) {
  if (riskScore >= 80) return "border-red-400 text-red-300";
  if (riskScore >= 60) return "border-orange-400 text-orange-300";
  if (riskScore >= 30) return "border-yellow-400 text-yellow-300";
  return "border-emerald-400 text-emerald-300";
}

function RiskCircle({ riskScore }: { riskScore: number }) {
  return (
    <div
      className={`flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-4 bg-black/30 ${getRiskRingClass(
        riskScore,
      )}`}
    >
      <div className="text-center">
        <div className="text-3xl font-bold">{riskScore}</div>
        <div className="text-[9px] uppercase tracking-widest text-slate-500">
          Risk
        </div>
      </div>
    </div>
  );
}

function AnalysisResultCard({
  result,
}: {
  result: AnalysisResult;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Analysis Result
          </p>

          <h2 className="mt-1 text-xl font-semibold">
            SMS Security Assessment
          </h2>
        </div>

        <span
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getSeverityClass(
            result.severity,
          )}`}
        >
          {result.severity}
        </span>
      </div>

      <div className="flex items-center gap-5 rounded-2xl border border-white/10 bg-black/20 p-5">
        <RiskCircle riskScore={result.riskScore} />

        <div className="min-w-0">
          <div
            className={`text-lg font-semibold ${
              result.threatDetected
                ? "text-orange-300"
                : "text-emerald-300"
            }`}
          >
            {result.threatDetected
              ? "Threat Detected"
              : "No Strong Threat Detected"}
          </div>

          <p className="mt-1 text-sm leading-6 text-slate-400">
            {result.threatDetected
              ? "The submitted SMS contains multiple observable signals that require caution."
              : "The current checks did not identify strong suspicious indicators."}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-600">
            Confidence
          </p>

          <p className="mt-1 text-xl font-semibold text-white">
            {result.confidence}%
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Based on observable signal coverage, not an AI probability.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-600">
            Indicators
          </p>

          <p className="mt-1 text-xl font-semibold text-white">
            {result.indicators.length}
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Observable security signals found in the submitted SMS.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-600">
          Why this result?
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-300">
          {result.explanation}
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-4">
        <p className="text-[10px] font-medium uppercase tracking-wider text-cyan-400/70">
          Recommended Action
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-300">
          {result.recommendation}
        </p>
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Detected Indicators
          </p>

          <span className="text-[10px] text-slate-600">
            {result.indicators.length} signal
            {result.indicators.length === 1 ? "" : "s"}
          </span>
        </div>

        {result.indicators.length > 0 ? (
          <div className="space-y-3">
            {result.indicators.map((indicator, index) => (
              <div
                key={`${indicator.title}-${index}`}
                className="rounded-xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {indicator.title}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {indicator.detail}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full border border-orange-400/20 bg-orange-400/[0.06] px-2 py-1 text-[10px] font-medium text-orange-300">
                    +{indicator.points}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] p-4">
            <p className="text-sm text-emerald-300">
              No strong suspicious indicators were detected.
            </p>
          </div>
        )}
      </div>

      {result.scanId && (
        <div className="mt-5 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-emerald-400/60">
                Scan Saved
              </p>

              <p className="mt-1 text-sm font-medium text-emerald-300">
                This SMS analysis has been saved to your security history.
              </p>
            </div>

            <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-medium text-emerald-300">
              Saved
            </span>
          </div>

          <p className="mt-3 break-all text-[10px] text-slate-600">
            Scan ID: {result.scanId}
          </p>
        </div>
      )}
    </div>
  );
}

function EmptyAnalysisState() {
  return (
    <div className="flex min-h-[500px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.05] text-2xl">
        📱
      </div>

      <h2 className="mt-5 text-lg font-semibold text-white">
        Ready to analyze
      </h2>

      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        Enter an SMS on the left and run the security analysis to see risk,
        indicators, explanation, and recommended actions.
      </p>
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
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] text-lg">
        {icon}
      </div>

      <h3 className="mt-4 text-sm font-semibold text-white">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function PipelineStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/[0.05] text-xs font-semibold text-cyan-300">
        {number}
      </div>

      <div>
        <p className="text-sm font-medium text-white">{title}</p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

export default function SMSGuardPage() {
  const [sender, setSender] = useState("");
  const [message, setMessage] = useState("");

  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const characterCount = message.length;

  const canAnalyze = useMemo(() => {
    return (
      sender.trim().length > 0 ||
      message.trim().length > 0
    );
  }, [sender, message]);

  async function handleAnalyze(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setErrorMessage("");
    setResult(null);

    if (!canAnalyze) {
      setErrorMessage(
        "Enter a sender or SMS message before analyzing.",
      );
      return;
    }

    if (!sender.trim() || !message.trim()) {
      setErrorMessage(
        "Please enter both the sender and SMS message before analyzing.",
      );
      return;
    }

    setAnalyzing(true);

    try {
      const response = await fetch("/api/scan/sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: sender.trim(),
          message: message.trim(),
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
          indicators: Indicator[];
          explanation: string;
          recommendation: string;
        };
        riskScore?: number;
        severity?: Severity;
        threatDetected?: boolean;
        confidence?: number;
        indicators?: Indicator[];
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
            `SMS analysis failed (HTTP ${response.status}).`,
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
          "The SMS was analyzed by the SMS Guard security engine.",

        recommendation:
          serverAnalysis?.recommendation ??
          data.recommendation ??
          "Treat unexpected messages cautiously and independently verify suspicious requests.",

        scanId: data.scanId,
      };

      setResult(normalizedResult);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to analyze the SMS. Please try again.",
      );
    } finally {
      setAnalyzing(false);
    }
  }

  function handleClear() {
    setSender("");
    setMessage("");
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
              📱
            </div>

            <div>
              <p className="text-sm font-medium text-cyan-400">
                INNOVEX SECURITY
              </p>

              <h1 className="text-3xl font-bold tracking-tight">
                SMS Guard
              </h1>
            </div>
          </div>

          <p className="max-w-3xl text-sm leading-6 text-slate-400">
            Analyze suspicious SMS messages for smishing signals,
            scam patterns, malicious links, credential requests,
            impersonation, and other security indicators.
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
                SMS analysis engine ready
              </h2>

              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
                Innovex Security examines the sender and message you
                provide and looks for observable smishing and scam
                indicators. Results are based on the submitted SMS
                content and are not fabricated.
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
                  Analyze an SMS
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Enter the sender and SMS message below to run a
                  security analysis.
                </p>
              </div>

              <span className="rounded-full border border-cyan-400/15 bg-cyan-400/[0.05] px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-cyan-300/70">
                SMS Engine
              </span>
            </div>

            <form
              onSubmit={handleAnalyze}
              className="space-y-5"
            >
              {/* Sender */}
              <div>
                <label
                  htmlFor="sms-sender"
                  className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500"
                >
                  Sender / Number
                </label>

                <input
                  id="sms-sender"
                  type="text"
                  value={sender}
                  onChange={(event) =>
                    setSender(event.target.value)
                  }
                  placeholder="+91 98765 43210 or BANK-ALERT"
                  className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50"
                />
              </div>

              {/* Message */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="sms-message"
                    className="text-xs font-medium uppercase tracking-wider text-slate-500"
                  >
                    SMS Message
                  </label>

                  <span className="text-[10px] text-slate-600">
                    {characterCount.toLocaleString()} characters
                  </span>
                </div>

                <textarea
                  id="sms-message"
                  value={message}
                  onChange={(event) =>
                    setMessage(event.target.value)
                  }
                  placeholder={`Paste the SMS message here...

Example:
Your bank account requires immediate verification.
Click the link below and confirm your account.`}
                  rows={12}
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
                    ? "Analyzing SMS..."
                    : "Analyze SMS"}
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

          {/* Result */}
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
              SMS Security Checks
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Observable signals currently examined by the SMS Guard
              analysis engine.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <CapabilityCard
              icon="🔗"
              title="Suspicious Links"
              description="Looks for links and potentially deceptive URL patterns."
            />

            <CapabilityCard
              icon="💳"
              title="Payment Scams"
              description="Detects requests involving payments, banking, cards, or financial information."
            />

            <CapabilityCard
              icon="⚡"
              title="Urgency Signals"
              description="Identifies pressure tactics commonly used in smishing and scam messages."
            />

            <CapabilityCard
              icon="🎭"
              title="Impersonation"
              description="Looks for language that attempts to imitate banks, companies, services, or authorities."
            />
          </div>
        </section>

        {/* Workflow */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              SMS Guard Pipeline
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              How the submitted SMS moves through the Innovex Security
              analysis process.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <PipelineStep
              number="01"
              title="Input"
              description="The sender and SMS content are submitted to the SMS Guard."
            />

            <PipelineStep
              number="02"
              title="Preprocess"
              description="The submitted text is normalized and examined for observable patterns."
            />

            <PipelineStep
              number="03"
              title="Analyze"
              description="The security engine checks urgency, links, sensitive requests, impersonation, and scam signals."
            />

            <PipelineStep
              number="04"
              title="Risk Score"
              description="Detected signals are combined into a transparent 0–100 risk score and severity."
            />

            <PipelineStep
              number="05"
              title="Explain"
              description="Detected indicators are shown so the user can understand why the result was produced."
            />

            <PipelineStep
              number="06"
              title="Protect"
              description="Innovex Security provides a practical recommendation based on the calculated severity."
            />
          </div>
        </section>

        {/* Transparency */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-sm">ℹ️</div>

            <div>
              <h2 className="text-sm font-semibold text-slate-300">
                Analysis transparency
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                SMS Guard currently uses observable heuristic security
                checks. A detected threat means the submitted message
                matched suspicious patterns; it does not by itself prove
                that the sender or message is malicious. Confidence
                represents signal coverage rather than a machine-learning
                probability.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}