import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type Indicator = {
  title: string;
  detail: string;
  points: number;
};

type SecurityScan = {
  id: string;
  scan_type: string;
  input_value: string;
  normalized_url: string | null;
  domain: string | null;
  protocol: string | null;
  risk_score: number;
  severity: "Low" | "Medium" | "High" | "Critical";
  confidence: number | null;
  threat_detected: boolean;
  indicators: Array<string | Indicator>;
  recommendation: string | null;
  analysis_type: string | null;
  created_at: string;
};

function formatDate(date: string) {
  return new Date(date).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function severityClasses(
  severity: SecurityScan["severity"],
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

function scoreClasses(score: number) {
  if (score >= 80) return "text-red-300";
  if (score >= 60) return "text-orange-300";
  if (score >= 30) return "text-yellow-300";

  return "text-emerald-300";
}

function getIndicatorTitle(indicator: string | Indicator) {
  if (typeof indicator === "string") {
    return indicator;
  }

  return indicator.title;
}

function getIndicatorDetail(indicator: string | Indicator) {
  if (typeof indicator === "string") {
    return null;
  }

  return indicator.detail;
}

function getIndicatorPoints(indicator: string | Indicator) {
  if (typeof indicator === "string") {
    return null;
  }

  return indicator.points;
}

function getScanDisplayValue(scan: SecurityScan) {
  if (scan.scan_type === "url") {
    return scan.normalized_url || scan.input_value;
  }

  return scan.input_value;
}

export default async function ScanHistoryPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect("/login");
  }

  const userId = data.claims.sub;

  const { data: scans, error: scansError } = await supabase
    .from("security_scans")
    .select(
      `
        id,
        scan_type,
        input_value,
        normalized_url,
        domain,
        protocol,
        risk_score,
        severity,
        confidence,
        threat_detected,
        indicators,
        recommendation,
        analysis_type,
        created_at
      `,
    )
    .eq("user_id", userId)
    .order("created_at", {
      ascending: false,
    });

  if (scansError) {
    console.error(
      "Scan History database error:",
      scansError,
    );
  }

  const securityScans =
    (scans ?? []) as SecurityScan[];

  const totalScans = securityScans.length;

  const safeScans = securityScans.filter(
    (scan) =>
      scan.severity === "Low" &&
      !scan.threat_detected,
  ).length;

  const mediumScans = securityScans.filter(
    (scan) => scan.severity === "Medium",
  ).length;

  const highScans = securityScans.filter(
    (scan) => scan.severity === "High",
  ).length;

  const criticalScans = securityScans.filter(
    (scan) => scan.severity === "Critical",
  ).length;

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[25%] top-[-250px] h-[600px] w-[800px] rounded-full bg-blue-500/[0.025] blur-3xl" />

        <div className="absolute right-[-250px] top-[20%] h-[550px] w-[550px] rounded-full bg-purple-500/[0.025] blur-3xl" />

        <div className="absolute bottom-[-300px] left-[20%] h-[500px] w-[600px] rounded-full bg-emerald-500/[0.018] blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen">
        {/* Top bar */}
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
                Scan History
              </div>
            </div>
          </div>

          <div className="rounded-full border border-blue-400/10 bg-blue-400/[0.025] px-3 py-1.5 text-[8px] uppercase tracking-wider text-blue-300/60">
            Live account data
          </div>
        </header>

        {/* Content */}
        <div className="mx-auto max-w-[1250px] px-5 py-8 sm:px-8 sm:py-12">
          {/* Page heading */}
          <section>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/10 bg-blue-400/[0.025] px-3 py-1.5 text-[9px] font-medium text-blue-300/70">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              Security activity
            </div>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Scan History
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/30">
              Review your previous security scans, risk scores,
              and analysis results. This history is loaded from
              your authenticated Innovex Security account.
            </p>
          </section>

          {/* Summary */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {/* Total */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
              <div className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/25">
                Total scans
              </div>

              <div className="mt-6 text-4xl font-semibold">
                {totalScans}
              </div>

              <p className="mt-2 text-[10px] text-white/20">
                All saved scans
              </p>
            </div>

            {/* Safe */}
            <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.018] p-5">
              <div className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/25">
                Safe
              </div>

              <div className="mt-6 text-4xl font-semibold text-emerald-300">
                {safeScans}
              </div>

              <p className="mt-2 text-[10px] text-emerald-300/50">
                Low-risk scans
              </p>
            </div>

            {/* Medium */}
            <div className="rounded-2xl border border-yellow-400/10 bg-yellow-400/[0.018] p-5">
              <div className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/25">
                Medium
              </div>

              <div className="mt-6 text-4xl font-semibold text-yellow-300">
                {mediumScans}
              </div>

              <p className="mt-2 text-[10px] text-yellow-300/50">
                Medium-risk scans
              </p>
            </div>

            {/* High */}
            <div className="rounded-2xl border border-orange-400/10 bg-orange-400/[0.018] p-5">
              <div className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/25">
                High
              </div>

              <div className="mt-6 text-4xl font-semibold text-orange-300">
                {highScans}
              </div>

              <p className="mt-2 text-[10px] text-orange-300/50">
                High-risk scans
              </p>
            </div>

            {/* Critical */}
            <div className="rounded-2xl border border-red-400/10 bg-red-400/[0.018] p-5">
              <div className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/25">
                Critical
              </div>

              <div className="mt-6 text-4xl font-semibold text-red-300">
                {criticalScans}
              </div>

              <p className="mt-2 text-[10px] text-red-300/50">
                Critical-risk scans
              </p>
            </div>
          </div>

          {/* History */}
          <section className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 sm:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-semibold">
                  All Security Scans
                </h2>

                <p className="mt-1 text-[10px] text-white/25">
                  Your most recent URL, Email, and SMS security
                  analyses
                </p>
              </div>

              <Link
                href="/dashboard/scanner"
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[10px] font-semibold text-black transition hover:bg-white/90"
              >
                🔍 New scan
              </Link>
            </div>

            {/* Empty state */}
            {securityScans.length === 0 && (
              <div className="mt-7 flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-black/10 px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-400/10 bg-blue-400/[0.025] text-2xl">
                  ◷
                </div>

                <h3 className="mt-5 text-lg font-semibold">
                  No scans yet
                </h3>

                <p className="mt-2 max-w-md text-xs leading-6 text-white/25">
                  Your security scans will appear here after you
                  analyze a URL, Email, or SMS with Innovex
                  Security.
                </p>

                <Link
                  href="/dashboard/scanner"
                  className="mt-6 rounded-xl bg-white px-5 py-3 text-xs font-semibold text-black transition hover:bg-white/90"
                >
                  Start your first scan
                </Link>
              </div>
            )}

            {/* Scan list */}
            {securityScans.length > 0 && (
              <div className="mt-7 space-y-3">
                {securityScans.map((scan, index) => (
                  <article
                    key={scan.id}
                    className="overflow-hidden rounded-2xl border border-white/[0.07] bg-black/15 transition hover:border-white/[0.12]"
                  >
                    <div className="p-5">
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                        {/* Number */}
                        <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.02] text-[10px] text-white/20 lg:flex">
                          {(index + 1)
                            .toString()
                            .padStart(2, "0")}
                        </div>

                        {/* Score */}
                        <div
                          className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border ${severityClasses(
                            scan.severity,
                          )}`}
                        >
                          <span
                            className={`text-lg font-semibold ${scoreClasses(
                              scan.risk_score,
                            )}`}
                          >
                            {scan.risk_score}
                          </span>

                          <span className="text-[7px] uppercase tracking-wider opacity-50">
                            risk
                          </span>
                        </div>

                        {/* Main information */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-white/[0.07] bg-white/[0.02] px-2.5 py-1 text-[8px] uppercase tracking-wider text-white/25">
                              {scan.scan_type}
                            </span>

                            <span
                              className={`rounded-full border px-2.5 py-1 text-[8px] font-semibold uppercase tracking-wider ${severityClasses(
                                scan.severity,
                              )}`}
                            >
                              {scan.severity}
                            </span>

                            {scan.threat_detected && (
                              <span className="rounded-full border border-red-400/15 bg-red-400/[0.035] px-2.5 py-1 text-[8px] uppercase tracking-wider text-red-300/60">
                                Threat detected
                              </span>
                            )}
                          </div>

                          <div className="mt-3 break-all text-xs text-white/55">
                            {getScanDisplayValue(scan)}
                          </div>

                          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[9px] text-white/20">
                            {scan.scan_type === "url" && (
                              <>
                                <span>
                                  Domain:{" "}
                                  {scan.domain || "—"}
                                </span>

                                <span>
                                  Protocol:{" "}
                                  {scan.protocol || "—"}
                                </span>
                              </>
                            )}

                            {scan.scan_type !== "url" && (
                              <span>
                                Analysis:{" "}
                                {scan.analysis_type ||
                                  `${scan.scan_type} analysis`}
                              </span>
                            )}

                            <span>
                              Confidence:{" "}
                              {scan.confidence ?? "—"}
                              {scan.confidence !== null
                                ? "%"
                                : ""}
                            </span>
                          </div>
                        </div>

                        {/* Date */}
                        <div className="shrink-0 lg:text-right">
                          <div className="text-[8px] uppercase tracking-wider text-white/15">
                            Scanned
                          </div>

                          <div className="mt-1 text-[9px] text-white/25">
                            {formatDate(scan.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Indicators */}
                    {scan.indicators &&
                      scan.indicators.length > 0 && (
                        <div className="border-t border-white/[0.06] px-5 py-4">
                          <div className="mb-3 text-[8px] font-medium uppercase tracking-[0.18em] text-white/15">
                            Detected indicators
                          </div>

                          <div className="space-y-2">
                            {scan.indicators.map(
                              (
                                indicator,
                                indicatorIndex,
                              ) => {
                                const title =
                                  getIndicatorTitle(
                                    indicator,
                                  );

                                const detail =
                                  getIndicatorDetail(
                                    indicator,
                                  );

                                const points =
                                  getIndicatorPoints(
                                    indicator,
                                  );

                                return (
                                  <div
                                    key={`${scan.id}-${indicatorIndex}`}
                                    className="rounded-xl border border-white/[0.06] bg-white/[0.015] px-3 py-3"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <p className="text-[10px] font-medium text-white/50">
                                          {title}
                                        </p>

                                        {detail && (
                                          <p className="mt-1 text-[9px] leading-5 text-white/25">
                                            {detail}
                                          </p>
                                        )}
                                      </div>

                                      {points !== null && (
                                        <span className="shrink-0 rounded-full border border-orange-400/15 bg-orange-400/[0.035] px-2 py-1 text-[8px] text-orange-300/60">
                                          +{points}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>
                      )}

                    {/* Recommendation */}
                    {scan.recommendation && (
                      <div className="border-t border-white/[0.06] bg-white/[0.008] px-5 py-4">
                        <span className="text-[8px] font-medium uppercase tracking-[0.18em] text-white/15">
                          Recommendation
                        </span>

                        <p className="mt-2 text-[9px] leading-5 text-white/25">
                          {scan.recommendation}
                        </p>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Information */}
          <section className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <div className="text-lg">🔐</div>

              <h3 className="mt-4 text-sm font-medium">
                Private history
              </h3>

              <p className="mt-2 text-[10px] leading-5 text-white/20">
                Your scan records are protected by Supabase Row
                Level Security.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <div className="text-lg">🧠</div>

              <h3 className="mt-4 text-sm font-medium">
                Explainable analysis
              </h3>

              <p className="mt-2 text-[10px] leading-5 text-white/20">
                Each scan stores the security indicators used by
                the current analysis engine.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <div className="text-lg">📊</div>

              <h3 className="mt-4 text-sm font-medium">
                Security visibility
              </h3>

              <p className="mt-2 text-[10px] leading-5 text-white/20">
                Review URL, Email, and SMS activity together to
                understand your security posture over time.
              </p>
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-10 border-t border-white/[0.06] pt-6 text-center">
            <p className="text-[9px] tracking-wide text-white/15">
              Innovex Security • Detect. Analyze. Respond. Protect.
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}