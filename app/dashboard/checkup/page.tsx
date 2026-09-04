"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase-client";

type Scan = {
  id: string;
  scan_type: string;
  input_value: string;
  risk_score: number;
  severity: "Low" | "Medium" | "High" | "Critical";
  confidence: number | null;
  threat_detected: boolean;
  indicators: unknown;
  recommendation: string | null;
  created_at: string;
};

type CheckupData = {
  totalScans: number;
  threats: number;
  safeScans: number;
  highCritical: number;
  medium: number;
  low: number;
  averageRisk: number;
  averageConfidence: number;
  securityScore: number;
};

export default function SecurityCheckupPage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadScans() {
      try {
        setLoading(true);
        setErrorMessage("");

        const supabase = createClient();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setErrorMessage(
            "Your session could not be verified. Please log in again.",
          );
          return;
        }

        const { data, error } = await supabase
          .from("security_scans")
          .select(
            `
              id,
              scan_type,
              input_value,
              risk_score,
              severity,
              confidence,
              threat_detected,
              indicators,
              recommendation,
              created_at
            `,
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Security checkup database error:", error);

          setErrorMessage(
            "Unable to load your security activity right now.",
          );

          return;
        }

        setScans((data ?? []) as Scan[]);
      } catch (error) {
        console.error("Security checkup error:", error);

        setErrorMessage(
          "Something went wrong while loading your security checkup.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadScans();
  }, []);

  const checkup = useMemo<CheckupData>(() => {
    const totalScans = scans.length;

    if (totalScans === 0) {
      return {
        totalScans: 0,
        threats: 0,
        safeScans: 0,
        highCritical: 0,
        medium: 0,
        low: 0,
        averageRisk: 0,
        averageConfidence: 0,
        securityScore: 100,
      };
    }

    const threats = scans.filter(
      (scan) => scan.threat_detected,
    ).length;

    const safeScans = totalScans - threats;

    const highCritical = scans.filter(
      (scan) =>
        scan.severity === "High" ||
        scan.severity === "Critical",
    ).length;

    const medium = scans.filter(
      (scan) => scan.severity === "Medium",
    ).length;

    const low = scans.filter(
      (scan) => scan.severity === "Low",
    ).length;

    const totalRisk = scans.reduce(
      (sum, scan) => sum + Number(scan.risk_score || 0),
      0,
    );

    const scansWithConfidence = scans.filter(
      (scan) =>
        typeof scan.confidence === "number",
    );

    const totalConfidence = scansWithConfidence.reduce(
      (sum, scan) =>
        sum + Number(scan.confidence || 0),
      0,
    );

    const averageRisk = Math.round(
      totalRisk / totalScans,
    );

    const averageConfidence =
      scansWithConfidence.length > 0
        ? Math.round(
            totalConfidence /
              scansWithConfidence.length,
          )
        : 0;

    /*
     * Security score:
     *
     * Start at 100.
     * Higher average risk reduces the score.
     * Threat frequency reduces the score.
     * High/Critical findings apply an additional penalty.
     *
     * This is a transparent application score based
     * entirely on the user's real scan history.
     */

    const riskPenalty = Math.round(
      averageRisk * 0.55,
    );

    const threatPenalty = Math.round(
      (threats / totalScans) * 25,
    );

    const severePenalty = Math.min(
      highCritical * 5,
      20,
    );

    const calculatedScore =
      100 -
      riskPenalty -
      threatPenalty -
      severePenalty;

    const securityScore = Math.max(
      0,
      Math.min(100, calculatedScore),
    );

    return {
      totalScans,
      threats,
      safeScans,
      highCritical,
      medium,
      low,
      averageRisk,
      averageConfidence,
      securityScore,
    };
  }, [scans]);

  const status = getSecurityStatus(
    checkup.securityScore,
  );

  const recommendations = getRecommendations(
    checkup,
  );

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-xl">
              🛡️
            </div>

            <div>
              <p className="text-sm font-medium text-emerald-400">
                INNOVEX SECURITY
              </p>

              <h1 className="text-3xl font-bold tracking-tight">
                Security Checkup
              </h1>
            </div>
          </div>

          <p className="max-w-3xl text-sm leading-6 text-slate-400">
            Review your security activity, understand your current
            security posture, and get recommendations based on your
            actual scan history.
          </p>
        </div>

        {/* Error */}
        {errorMessage && (
          <section className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/5 p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-400/10 text-lg">
                ⚠️
              </div>

              <div>
                <h2 className="font-semibold text-red-300">
                  Checkup unavailable
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-400">
                  {errorMessage}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Loading */}
        {loading ? (
          <LoadingState />
        ) : (
          <>
            {/* Security Score */}
            <section className="mb-6 grid gap-6 lg:grid-cols-[1.1fr_1.9fr]">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-7">
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Overall Security Score
                  </p>

                  <p className="mt-2 text-sm text-slate-400">
                    Based on your real Innovex Security scan activity.
                  </p>
                </div>

                <div className="flex items-center gap-7">
                  <ScoreCircle score={checkup.securityScore} />

                  <div>
                    <div
                      className={`text-xl font-bold ${status.textClass}`}
                    >
                      {status.label}
                    </div>

                    <p className="mt-2 max-w-xs text-sm leading-6 text-slate-400">
                      {status.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Activity Overview */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-7">
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Security Activity
                  </p>

                  <p className="mt-2 text-sm text-slate-400">
                    Your current security posture from recorded scans.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    icon="🔍"
                    label="Total Scans"
                    value={checkup.totalScans}
                  />

                  <MetricCard
                    icon="🚨"
                    label="Threats"
                    value={checkup.threats}
                    danger={checkup.threats > 0}
                  />

                  <MetricCard
                    icon="⚠️"
                    label="High / Critical"
                    value={checkup.highCritical}
                    danger={checkup.highCritical > 0}
                  />

                  <MetricCard
                    icon="✓"
                    label="Safe Scans"
                    value={checkup.safeScans}
                  />
                </div>
              </div>
            </section>

            {/* Risk Breakdown */}
            <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold">
                  Risk Breakdown
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Severity distribution across your actual scan history.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <RiskCard
                  label="Low"
                  value={checkup.low}
                  description="Low-risk findings"
                />

                <RiskCard
                  label="Medium"
                  value={checkup.medium}
                  description="Needs attention"
                />

                <RiskCard
                  label="High"
                  value={
                    scans.filter(
                      (scan) => scan.severity === "High",
                    ).length
                  }
                  description="High-risk findings"
                />

                <RiskCard
                  label="Critical"
                  value={
                    scans.filter(
                      (scan) => scan.severity === "Critical",
                    ).length
                  }
                  description="Critical findings"
                />
              </div>
            </section>

            {/* Security Metrics */}
            <section className="mb-6 grid gap-4 md:grid-cols-3">
              <InfoCard
                label="Average Risk"
                value={`${checkup.averageRisk}/100`}
                description="Average risk score across recorded scans."
              />

              <InfoCard
                label="Average Confidence"
                value={`${checkup.averageConfidence}%`}
                description="Average analysis confidence where available."
              />

              <InfoCard
                label="Threat Detection Rate"
                value={
                  checkup.totalScans > 0
                    ? `${Math.round(
                        (checkup.threats /
                          checkup.totalScans) *
                          100,
                      )}%`
                    : "0%"
                }
                description="Percentage of scans that detected a threat."
              />
            </section>

            {/* Recommendations */}
            <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-lg">
                    💡
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold">
                      Recommended Actions
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                      Actions generated from your current security activity.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                {recommendations.map(
                  (recommendation, index) => (
                    <Recommendation
                      key={`${recommendation.title}-${index}`}
                      number={index + 1}
                      title={recommendation.title}
                      description={
                        recommendation.description
                      }
                    />
                  ),
                )}
              </div>
            </section>

            {/* Recent Activity */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold">
                  Recent Security Activity
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Your latest recorded security scans.
                </p>
              </div>

              {scans.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="space-y-3">
                  {scans.slice(0, 6).map((scan) => (
                    <RecentScan
                      key={scan.id}
                      scan={scan}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Transparency Note */}
            <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] px-5 py-4">
              <p className="text-xs leading-5 text-slate-500">
                Security Checkup uses your recorded Innovex Security
                scan history. It does not create fictional threats,
                alerts, or security events.
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function ScoreCircle({
  score,
}: {
  score: number;
}) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const progress =
    circumference -
    (score / 100) * circumference;

  const status = getSecurityStatus(score);

  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg
        viewBox="0 0 120 120"
        className="h-full w-full -rotate-90"
      >
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="9"
        />

        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          className={status.strokeClass}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">
          {score}
        </span>

        <span className="text-[10px] uppercase tracking-widest text-slate-500">
          / 100
        </span>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  danger = false,
}: {
  icon: string;
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-lg">{icon}</span>

        <span
          className={`text-2xl font-bold ${
            danger
              ? "text-red-400"
              : "text-white"
          }`}
        >
          {value}
        </span>
      </div>

      <p className="text-xs text-slate-500">
        {label}
      </p>
    </div>
  );
}

function RiskCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-300">
            {label}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <span className="text-3xl font-bold text-white">
          {value}
        </span>
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-2xl font-bold text-white">
        {value}
      </p>

      <p className="mt-2 text-sm leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function Recommendation({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 text-xs font-bold text-cyan-400">
        {String(number).padStart(2, "0")}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-200">
          {title}
        </h3>

        <p className="mt-1 text-sm leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function RecentScan({
  scan,
}: {
  scan: Scan;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/20 p-4 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm">
            {scan.threat_detected
              ? "🚨"
              : "✓"}
          </span>

          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
            {scan.scan_type || "Scan"}
          </span>

          <span className="text-xs text-slate-600">
            •
          </span>

          <span className="text-xs text-slate-500">
            {formatDate(scan.created_at)}
          </span>
        </div>

        <p className="mt-2 truncate text-sm text-slate-300">
          {scan.input_value}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${getSeverityClass(
            scan.severity,
          )}`}
        >
          {scan.severity}
        </span>

        <span className="text-sm font-semibold text-slate-300">
          {scan.risk_score}/100
        </span>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-10">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400" />

        <h2 className="font-semibold">
          Analyzing your security activity
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Loading your real scan history from Innovex Security.
        </p>
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-8 text-center">
      <div className="text-3xl">🔍</div>

      <h3 className="mt-3 font-semibold">
        No security scans yet
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        Run your first URL scan to start building your
        personalized security checkup.
      </p>
    </div>
  );
}

function getSecurityStatus(score: number) {
  if (score >= 80) {
    return {
      label: "Strong",
      description:
        "Your recent security activity shows a strong overall security posture.",
      textClass: "text-emerald-400",
      strokeClass: "text-emerald-400",
    };
  }

  if (score >= 60) {
    return {
      label: "Good",
      description:
        "Your security posture is generally good, but there are areas worth improving.",
      textClass: "text-cyan-400",
      strokeClass: "text-cyan-400",
    };
  }

  if (score >= 40) {
    return {
      label: "Needs Attention",
      description:
        "Your recent activity contains findings that should receive additional attention.",
      textClass: "text-yellow-400",
      strokeClass: "text-yellow-400",
    };
  }

  return {
    label: "At Risk",
    description:
      "Your recent scan history contains significant security risks that should be addressed.",
    textClass: "text-red-400",
    strokeClass: "text-red-400",
  };
}

function getRecommendations(
  data: CheckupData,
) {
  const recommendations: {
    title: string;
    description: string;
  }[] = [];

  if (data.totalScans === 0) {
    recommendations.push({
      title: "Run your first security scan",
      description:
        "Start with the Threat Scanner to establish your initial security baseline.",
    });

    recommendations.push({
      title: "Use Innovex before opening suspicious links",
      description:
        "Scan unfamiliar URLs before visiting them, especially when they arrive through unexpected messages.",
    });

    return recommendations;
  }

  if (data.highCritical > 0) {
    recommendations.push({
      title: "Review high and critical findings",
      description:
        `You have ${data.highCritical} high or critical finding${
          data.highCritical === 1 ? "" : "s"
        }. Review those results and follow the recommended response actions.`,
    });
  }

  if (data.threats > 0) {
    recommendations.push({
      title: "Review detected threats",
      description:
        `Innovex Security detected ${data.threats} threat${
          data.threats === 1 ? "" : "s"
        } in your recorded scans. Check the Threat Center for more detail.`,
    });
  }

  if (data.averageRisk >= 30) {
    recommendations.push({
      title: "Pay closer attention to suspicious indicators",
      description:
        `Your average recorded risk score is ${data.averageRisk}/100. Investigate unfamiliar URLs before interacting with them.`,
    });
  }

  if (data.threats === 0) {
    recommendations.push({
      title: "Continue scanning suspicious links",
      description:
        "No threats have been detected in your recorded scans so far. Continue using the scanner when you encounter unfamiliar links.",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      title: "Maintain your current security habits",
      description:
        "Your recorded scan activity currently shows a healthy security posture. Continue checking suspicious links before opening them.",
    });
  }

  return recommendations.slice(0, 4);
}

function getSeverityClass(
  severity: Scan["severity"],
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

function formatDate(
  value: string,
) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}