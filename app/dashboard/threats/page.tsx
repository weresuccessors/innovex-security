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

export default async function ThreatCenterPage() {
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
      "Threat Center database error:",
      scansError,
    );
  }

  const securityScans =
    (scans ?? []) as SecurityScan[];

  const activeThreats = securityScans.filter(
    (scan) => scan.threat_detected,
  );

  const criticalThreats = securityScans.filter(
    (scan) => scan.severity === "Critical",
  );

  const highThreats = securityScans.filter(
    (scan) => scan.severity === "High",
  );

  const mediumThreats = securityScans.filter(
    (scan) => scan.severity === "Medium",
  );

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      {/* ================================================= */}
      {/* BACKGROUND */}
      {/* ================================================= */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[25%] top-[-250px] h-[600px] w-[800px] rounded-full bg-red-500/[0.025] blur-3xl" />

        <div className="absolute right-[-250px] top-[20%] h-[550px] w-[550px] rounded-full bg-purple-500/[0.025] blur-3xl" />

        <div className="absolute bottom-[-300px] left-[20%] h-[500px] w-[600px] rounded-full bg-blue-500/[0.018] blur-3xl" />
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
                Threat Center
              </div>
            </div>
          </div>

          <div className="text-[9px] text-white/20">
            Live account data
          </div>
        </header>

        {/* ================================================= */}
        {/* CONTENT */}
        {/* ================================================= */}

        <div className="mx-auto max-w-[1250px] px-5 py-8 sm:px-8 sm:py-12">
          {/* Header */}

          <section>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-400/10 bg-red-400/[0.025] px-3 py-1.5 text-[9px] font-medium text-red-300/70">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              Threat monitoring
            </div>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Threat Center
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/30">
              Review security threats detected by Innovex
              Security. Results below are loaded directly from
              your saved security scans.
            </p>
          </section>

          {/* ================================================= */}
          {/* SUMMARY */}
          {/* ================================================= */}

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {/* Active */}

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/25">
                  Active threats
                </span>

                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-400/[0.07] text-red-300/80">
                  !
                </span>
              </div>

              <div className="mt-6 text-4xl font-semibold">
                {activeThreats.length}
              </div>

              <p
                className={`mt-2 text-[10px] ${
                  activeThreats.length > 0
                    ? "text-orange-300/70"
                    : "text-emerald-300/60"
                }`}
              >
                {activeThreats.length > 0
                  ? "Threats require attention"
                  : "No active threats"}
              </p>
            </div>

            {/* Critical */}

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/25">
                  Critical
                </span>

                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/[0.07] text-red-300/80">
                  ●
                </span>
              </div>

              <div className="mt-6 text-4xl font-semibold">
                {criticalThreats.length}
              </div>

              <p className="mt-2 text-[10px] text-white/20">
                Critical findings
              </p>
            </div>

            {/* High */}

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/25">
                  High
                </span>

                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-400/[0.07] text-orange-300/80">
                  ▲
                </span>
              </div>

              <div className="mt-6 text-4xl font-semibold">
                {highThreats.length}
              </div>

              <p className="mt-2 text-[10px] text-white/20">
                High-risk findings
              </p>
            </div>

            {/* Medium */}

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/25">
                  Medium
                </span>

                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-400/[0.07] text-yellow-300/80">
                  ◆
                </span>
              </div>

              <div className="mt-6 text-4xl font-semibold">
                {mediumThreats.length}
              </div>

              <p className="mt-2 text-[10px] text-white/20">
                Medium-risk findings
              </p>
            </div>
          </div>

          {/* ================================================= */}
          {/* DETECTED THREATS */}
          {/* ================================================= */}

          <section className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 sm:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-semibold">
                  Detected Threats
                </h2>

                <p className="mt-1 text-[10px] text-white/25">
                  Real results from your Innovex security scans
                </p>
              </div>

              <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-[9px] text-white/20">
                {securityScans.length} total scan
                {securityScans.length === 1 ? "" : "s"}
              </div>
            </div>

            {/* ================================================= */}
            {/* NO THREATS */}
            {/* ================================================= */}

            {activeThreats.length === 0 && (
              <div className="mt-7 flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-black/10 px-6 text-center">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.025]">
                  <div className="absolute inset-0 rounded-2xl bg-emerald-400/[0.025] blur-xl" />

                  <span className="relative text-3xl">
                    🛡️
                  </span>
                </div>

                <h3 className="mt-6 text-lg font-semibold">
                  No threats detected
                </h3>

                <p className="mt-2 max-w-md text-xs leading-6 text-white/25">
                  Your current saved scans contain no detected
                  threats.
                </p>

                <Link
                  href="/dashboard/scanner"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-semibold text-black transition hover:bg-white/90"
                >
                  🔍 Scan something
                </Link>
              </div>
            )}

            {/* ================================================= */}
            {/* THREAT CARDS */}
            {/* ================================================= */}

            {activeThreats.length > 0 && (
              <div className="mt-7 space-y-4">
                {activeThreats.map((scan) => (
                  <article
                    key={scan.id}
                    className="overflow-hidden rounded-2xl border border-white/[0.08] bg-black/20"
                  >
                    {/* Card header */}

                    <div className="flex flex-col justify-between gap-4 border-b border-white/[0.07] p-5 sm:flex-row sm:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-orange-400/20 bg-orange-400/[0.05] px-3 py-1.5 text-[8px] uppercase tracking-wider text-orange-300/70">
                            {scan.scan_type} threat
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1.5 text-[8px] font-semibold uppercase tracking-wider ${severityClasses(
                              scan.severity,
                            )}`}
                          >
                            {scan.severity}
                          </span>
                        </div>

                        <h3 className="mt-3 break-all text-sm font-medium text-white/70">
                          {getScanDisplayValue(scan)}
                        </h3>
                      </div>

                      <div className="shrink-0 text-left sm:text-right">
                        <div className="text-[8px] uppercase tracking-wider text-white/15">
                          Risk score
                        </div>

                        <div
                          className={`mt-1 text-3xl font-semibold ${scoreClasses(
                            scan.risk_score,
                          )}`}
                        >
                          {scan.risk_score}
                        </div>
                      </div>
                    </div>

                    {/* Details */}

                    <div className="grid gap-4 p-5 sm:grid-cols-3">
                      <div>
                        <div className="text-[8px] uppercase tracking-wider text-white/15">
                          {scan.scan_type === "url"
                            ? "Domain"
                            : "Scan type"}
                        </div>

                        <div className="mt-1 truncate text-[10px] text-white/40">
                          {scan.scan_type === "url"
                            ? scan.domain || "—"
                            : scan.scan_type.toUpperCase()}
                        </div>
                      </div>

                      <div>
                        <div className="text-[8px] uppercase tracking-wider text-white/15">
                          Confidence
                        </div>

                        <div className="mt-1 text-[10px] text-white/40">
                          {scan.confidence ?? "—"}
                          {scan.confidence !== null
                            ? "%"
                            : ""}
                        </div>
                      </div>

                      <div>
                        <div className="text-[8px] uppercase tracking-wider text-white/15">
                          Detected
                        </div>

                        <div className="mt-1 text-[10px] text-orange-300/60">
                          Threat indicators found
                        </div>
                      </div>
                    </div>

                    {/* Indicators */}

                    {scan.indicators &&
                      scan.indicators.length > 0 && (
                        <div className="border-t border-white/[0.07] p-5">
                          <div className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/20">
                            Indicators
                          </div>

                          <div className="mt-3 space-y-2">
                            {scan.indicators.map(
                              (
                                indicator,
                                index,
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
                                    key={`${scan.id}-${index}`}
                                    className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3"
                                  >
                                    <div className="flex items-start gap-3">
                                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400/70" />

                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-3">
                                          <span className="text-[10px] font-medium leading-5 text-white/45">
                                            {title}
                                          </span>

                                          {points !== null && (
                                            <span className="shrink-0 rounded-full border border-orange-400/15 bg-orange-400/[0.035] px-2 py-1 text-[8px] text-orange-300/60">
                                              +{points}
                                            </span>
                                          )}
                                        </div>

                                        {detail && (
                                          <p className="mt-1 text-[9px] leading-5 text-white/25">
                                            {detail}
                                          </p>
                                        )}
                                      </div>
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
                      <div className="border-t border-white/[0.07] p-5">
                        <div className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/20">
                          Recommended action
                        </div>

                        <div className="mt-3 rounded-xl border border-orange-400/10 bg-orange-400/[0.025] p-4">
                          <p className="text-[10px] leading-5 text-white/40">
                            {scan.recommendation}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Footer */}

                    <div className="border-t border-white/[0.07] bg-white/[0.01] px-5 py-3">
                      <div className="flex flex-col gap-1 text-[8px] text-white/15 sm:flex-row sm:items-center sm:justify-between">
                        <span>
                          {scan.analysis_type ||
                            "Security analysis"}
                        </span>

                        <span>
                          {formatDate(scan.created_at)}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* ================================================= */}
          {/* ALL SCANS */}
          {/* ================================================= */}

          <section className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 sm:p-8">
            <div>
              <div className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/20">
                Scan activity
              </div>

              <h2 className="mt-2 text-lg font-semibold">
                Recent security scans
              </h2>

              <p className="mt-1 text-[10px] text-white/25">
                Every scan saved to your authenticated account.
              </p>
            </div>

            {securityScans.length === 0 ? (
              <div className="mt-6 rounded-xl border border-white/[0.06] bg-black/10 p-5 text-center text-[10px] text-white/20">
                No scans have been saved yet.
              </div>
            ) : (
              <div className="mt-6 space-y-2">
                {securityScans.slice(0, 10).map((scan) => (
                  <div
                    key={`history-${scan.id}`}
                    className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-black/10 p-4 sm:flex-row sm:items-center"
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold ${severityClasses(
                        scan.severity,
                      )}`}
                    >
                      {scan.risk_score}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs text-white/45">
                        {getScanDisplayValue(scan)}
                      </div>

                      <div className="mt-1 text-[9px] text-white/15">
                        {formatDate(scan.created_at)}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-[8px] uppercase tracking-wider text-white/20">
                        {scan.scan_type}
                      </span>

                      <div
                        className={`w-fit rounded-full border px-3 py-1.5 text-[8px] font-semibold uppercase tracking-wider ${severityClasses(
                          scan.severity,
                        )}`}
                      >
                        {scan.severity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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