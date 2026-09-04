import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type Severity = "Low" | "Medium" | "High" | "Critical";

type ScanRecord = {
  id: string;
  scan_type: string;
  input_value: string;
  normalized_url: string | null;
  domain: string | null;
  risk_score: number;
  severity: Severity;
  confidence: number | null;
  threat_detected: boolean;
  indicators: unknown;
  recommendation: string | null;
  analysis_type: string | null;
  threat_intelligence_checked: boolean;
  threat_intelligence_message: string | null;
  response_status: "pending" | "reviewed";
  report_status: "not_reported" | "reported";
  report_reason: string | null;
  created_at: string;
};

function getSeverityClasses(severity: Severity) {
  if (severity === "Critical") {
    return {
      badge:
        "border-red-400/15 bg-red-400/[0.06] text-red-300/80",
      dot: "bg-red-400",
      icon: "bg-red-400/[0.08] text-red-300",
    };
  }

  if (severity === "High") {
    return {
      badge:
        "border-orange-400/15 bg-orange-400/[0.06] text-orange-300/80",
      dot: "bg-orange-400",
      icon: "bg-orange-400/[0.08] text-orange-300",
    };
  }

  if (severity === "Medium") {
    return {
      badge:
        "border-yellow-400/15 bg-yellow-400/[0.06] text-yellow-300/80",
      dot: "bg-yellow-400",
      icon: "bg-yellow-400/[0.08] text-yellow-300",
    };
  }

  return {
    badge:
      "border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-300/80",
    dot: "bg-emerald-400",
    icon: "bg-emerald-400/[0.08] text-emerald-300",
  };
}

function getResponseAction(scan: ScanRecord) {
  if (scan.severity === "Critical") {
    return {
      title: "Do not interact",
      description:
        "Do not open the content or enter credentials, payment information, or other sensitive information.",
      action: "Block / Avoid",
    };
  }

  if (scan.severity === "High") {
    return {
      title: "Avoid until verified",
      description:
        "Do not continue until the source has been independently verified.",
      action: "Review / Avoid",
    };
  }

  if (scan.severity === "Medium") {
    return {
      title: "Review carefully",
      description:
        "Check the sender, destination and surrounding context before taking further action.",
      action: "Review",
    };
  }

  return {
    title: "Continue with caution",
    description:
      "No significant threat was identified by the available checks, but normal security precautions still apply.",
    action: "Review",
  };
}

function formatScanType(type: string) {
  if (type === "url") return "URL";
  if (type === "email") return "EMAIL";
  if (type === "sms") return "SMS";

  return type.toUpperCase();
}

async function markThreatReviewed(formData: FormData) {
  "use server";

  const scanId = formData.get("scanId");

  if (typeof scanId !== "string" || !scanId) {
    return;
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect("/login");
  }

  const { error: updateError } = await supabase
    .from("security_scans")
    .update({ response_status: "reviewed" })
    .eq("id", scanId)
    .eq("user_id", data.claims.sub)
    .eq("threat_detected", true);

  if (updateError) {
    console.error("Failed to mark threat as reviewed:", updateError);
    return;
  }

  redirect("/dashboard/report");
}

async function reportThreat(formData: FormData) {
  "use server";

  const scanId = formData.get("scanId");
  const reason = formData.get("reason");

  if (typeof scanId !== "string" || !scanId) {
    return;
  }

  const allowedReasons = new Set([
    "Phishing",
    "Scam",
    "Malicious content",
    "Suspicious message",
    "Other",
  ]);

  const selectedReason =
    typeof reason === "string" && allowedReasons.has(reason)
      ? reason
      : "Other";

  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect("/login");
  }

  const { error: updateError } = await supabase
    .from("security_scans")
    .update({
      report_status: "reported",
      report_reason: selectedReason,
    })
    .eq("id", scanId)
    .eq("user_id", data.claims.sub)
    .eq("threat_detected", true);

  if (updateError) {
    console.error("Failed to report threat:", updateError);
    return;
  }

  redirect("/dashboard/report");
}

export default async function ReportResponsePage() {
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
        risk_score,
        severity,
        confidence,
        threat_detected,
        indicators,
        recommendation,
        analysis_type,
        threat_intelligence_checked,
        threat_intelligence_message,
        response_status,
        report_status,
        report_reason,
        created_at
      `
    )
    .eq("user_id", userId)
    .eq("threat_detected", true)
    .order("created_at", { ascending: false });

  const threats: ScanRecord[] = scansError
    ? []
    : ((scans ?? []) as ScanRecord[]);

  const criticalCount = threats.filter(
    (scan) => scan.severity === "Critical"
  ).length;

  const highCount = threats.filter(
    (scan) => scan.severity === "High"
  ).length;

  const mediumCount = threats.filter(
    (scan) => scan.severity === "Medium"
  ).length;

  const latestThreat = threats[0] ?? null;

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[25%] top-[-250px] h-[600px] w-[800px] rounded-full bg-red-500/[0.025] blur-3xl" />

        <div className="absolute right-[-250px] top-[20%] h-[550px] w-[550px] rounded-full bg-purple-500/[0.025] blur-3xl" />

        <div className="absolute bottom-[-300px] left-[20%] h-[500px] w-[600px] rounded-full bg-blue-500/[0.018] blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen">
        {/* HEADER */}

        <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-white/[0.07] bg-[#05070b]/90 px-5 backdrop-blur-xl sm:px-8">
          <div>
            <div className="text-[9px] font-medium uppercase tracking-[0.2em] text-white/20">
              Security Center
            </div>

            <div className="mt-1 text-sm font-medium">
              Report & Response
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/dashboard"
              className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-[10px] text-white/35 transition hover:bg-white/[0.06] hover:text-white"
            >
              Dashboard
            </a>

            <a
              href="/dashboard/threats"
              className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-[10px] text-white/35 transition hover:bg-white/[0.06] hover:text-white"
            >
              Threat Center
            </a>
          </div>
        </header>

        <div className="mx-auto max-w-[1250px] px-5 py-8 sm:px-8 sm:py-10">
          {/* INTRO */}

          <section>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-400/10 bg-red-400/[0.025] px-3 py-1.5 text-[9px] font-medium text-red-300/70">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              Response Center
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Report & Response
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/30">
              Review detected threats, understand the recommended response
              and take the safest next step based on your real security
              scan history.
            </p>
          </section>

          {/* SUMMARY */}

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-red-400/10 bg-red-400/[0.025] p-5">
              <div className="text-[9px] uppercase tracking-[0.18em] text-white/20">
                Detected threats
              </div>

              <div className="mt-3 text-3xl font-semibold">
                {threats.length}
              </div>

              <div className="mt-2 text-[10px] text-white/25">
                From your saved security scans
              </div>
            </div>

            <div className="rounded-2xl border border-red-400/10 bg-white/[0.025] p-5">
              <div className="text-[9px] uppercase tracking-[0.18em] text-white/20">
                Critical
              </div>

              <div className="mt-3 text-3xl font-semibold">
                {criticalCount}
              </div>

              <div className="mt-2 text-[10px] text-red-300/50">
                Immediate attention
              </div>
            </div>

            <div className="rounded-2xl border border-orange-400/10 bg-white/[0.025] p-5">
              <div className="text-[9px] uppercase tracking-[0.18em] text-white/20">
                High
              </div>

              <div className="mt-3 text-3xl font-semibold">
                {highCount}
              </div>

              <div className="mt-2 text-[10px] text-orange-300/50">
                Avoid until verified
              </div>
            </div>

            <div className="rounded-2xl border border-yellow-400/10 bg-white/[0.025] p-5">
              <div className="text-[9px] uppercase tracking-[0.18em] text-white/20">
                Medium
              </div>

              <div className="mt-3 text-3xl font-semibold">
                {mediumCount}
              </div>

              <div className="mt-2 text-[10px] text-yellow-300/50">
                Review carefully
              </div>
            </div>
          </div>

          {/* LATEST THREAT */}

          {latestThreat && (
            <section className="mt-6 rounded-2xl border border-red-400/10 bg-red-400/[0.018] p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />

                    <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-red-300/60">
                      Latest detected threat
                    </span>
                  </div>

                  <h2 className="mt-3 text-lg font-semibold">
                    Immediate response recommended
                  </h2>

                  <p className="mt-2 max-w-2xl break-all text-[11px] leading-5 text-white/30">
                    {latestThreat.input_value}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`w-fit rounded-full border px-3 py-1.5 text-[9px] ${getSeverityClasses(latestThreat.severity).badge}`}
                  >
                    {latestThreat.severity} · Risk{" "}
                    {latestThreat.risk_score}/100
                  </span>

                  <span
                    className={`w-fit rounded-full border px-3 py-1.5 text-[9px] ${
                      latestThreat.response_status === "reviewed"
                        ? "border-emerald-400/10 bg-emerald-400/[0.04] text-emerald-300/70"
                        : "border-yellow-400/10 bg-yellow-400/[0.04] text-yellow-300/70"
                    }`}
                  >
                    {latestThreat.response_status === "reviewed"
                      ? "Reviewed"
                      : "Pending review"}
                  </span>

                  {latestThreat.report_status === "reported" && (
                    <span className="w-fit rounded-full border border-blue-400/10 bg-blue-400/[0.04] px-3 py-1.5 text-[9px] text-blue-300/70">
                      Reported
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                  <div className="text-[9px] uppercase tracking-[0.15em] text-white/20">
                    Recommended response
                  </div>

                  <div className="mt-2 text-sm font-medium">
                    {getResponseAction(latestThreat).title}
                  </div>

                  <p className="mt-2 text-[10px] leading-5 text-white/25">
                    {getResponseAction(latestThreat).description}
                  </p>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                  <div className="text-[9px] uppercase tracking-[0.15em] text-white/20">
                    Analysis
                  </div>

                  <div className="mt-2 text-sm font-medium">
                    {latestThreat.analysis_type || "Security analysis"}
                  </div>

                  <p className="mt-2 text-[10px] leading-5 text-white/25">
                    Confidence{" "}
                    {latestThreat.confidence ?? "Not available"}%.
                  </p>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                  <div className="text-[9px] uppercase tracking-[0.15em] text-white/20">
                    Threat intelligence
                  </div>

                  <div className="mt-2 text-sm font-medium">
                    {latestThreat.threat_intelligence_checked
                      ? "Checked"
                      : "Not checked"}
                  </div>

                  <p className="mt-2 text-[10px] leading-5 text-white/25">
                    {latestThreat.threat_intelligence_message ||
                      "No external intelligence status was recorded."}
                  </p>
                </div>
              </div>

              {latestThreat.recommendation && (
                <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/20 p-4">
                  <div className="text-[9px] uppercase tracking-[0.15em] text-white/20">
                    Engine recommendation
                  </div>

                  <p className="mt-2 text-[11px] leading-6 text-white/35">
                    {latestThreat.recommendation}
                  </p>
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                <a
                  href="/dashboard/threats"
                  className="rounded-xl bg-white px-4 py-2.5 text-[10px] font-semibold text-black transition hover:bg-white/90"
                >
                  Open Threat Center →
                </a>

                {latestThreat.response_status === "pending" ? (
                  <form action={markThreatReviewed}>
                    <input
                      type="hidden"
                      name="scanId"
                      value={latestThreat.id}
                    />

                    <button
                      type="submit"
                      className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.035] px-4 py-2.5 text-[10px] text-emerald-300/70 transition hover:bg-emerald-400/[0.08]"
                    >
                      Mark as Reviewed
                    </button>
                  </form>
                ) : (
                  <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.035] px-4 py-2.5 text-[10px] text-emerald-300/70">
                    ✓ Reviewed
                  </div>
                )}

                {latestThreat.report_status === "not_reported" ? (
                  <form
                    action={reportThreat}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <input
                      type="hidden"
                      name="scanId"
                      value={latestThreat.id}
                    />

                    <select
                      name="reason"
                      defaultValue="Suspicious message"
                      className="rounded-xl border border-blue-400/10 bg-[#080b10] px-3 py-2.5 text-[10px] text-white/50 outline-none transition focus:border-blue-400/30"
                      aria-label="Report reason"
                    >
                      <option value="Phishing">Phishing</option>
                      <option value="Scam">Scam</option>
                      <option value="Malicious content">
                        Malicious content
                      </option>
                      <option value="Suspicious message">
                        Suspicious message
                      </option>
                      <option value="Other">Other</option>
                    </select>

                    <button
                      type="submit"
                      className="rounded-xl border border-blue-400/10 bg-blue-400/[0.035] px-4 py-2.5 text-[10px] text-blue-300/70 transition hover:bg-blue-400/[0.08]"
                    >
                      Report Threat
                    </button>
                  </form>
                ) : (
                  <div className="rounded-xl border border-blue-400/10 bg-blue-400/[0.035] px-4 py-2.5 text-[10px] text-blue-300/70">
                    ✓ Reported
                    {latestThreat.report_reason
                      ? ` · ${latestThreat.report_reason}`
                      : ""}
                  </div>
                )}

                <a
                  href="/dashboard/history"
                  className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-2.5 text-[10px] text-white/40 transition hover:bg-white/[0.06] hover:text-white"
                >
                  View Scan History
                </a>
              </div>
            </section>
          )}

          {/* THREAT LIST */}

          <section className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">
                  Detected Threats
                </h2>

                <p className="mt-1 text-[10px] text-white/25">
                  Real threats recorded by your security analysis
                </p>
              </div>

              <span className="rounded-full border border-white/[0.07] px-3 py-1.5 text-[9px] text-white/25">
                {threats.length} recorded
              </span>
            </div>

            <div className="mt-6">
              {threats.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/[0.07] p-8 text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/[0.06]">
                    ✓
                  </div>

                  <h3 className="mt-4 text-sm font-medium">
                    No detected threats
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-[10px] leading-5 text-white/20">
                    No threat has been recorded in your current security
                    scan history.
                  </p>

                  <a
                    href="/dashboard/scanner"
                    className="mt-5 inline-flex rounded-xl border border-white/[0.07] px-4 py-2.5 text-[10px] text-white/35 transition hover:bg-white/[0.05] hover:text-white"
                  >
                    Run a security scan →
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  {threats.map((scan) => {
                    const severityStyle =
                      getSeverityClasses(scan.severity);

                    const response = getResponseAction(scan);

                    return (
                      <div
                        key={scan.id}
                        className="rounded-xl border border-white/[0.07] bg-black/15 p-4 transition hover:border-white/[0.12]"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex min-w-0 gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${severityStyle.icon}`}
                            >
                              !
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded-full border px-2 py-1 text-[8px] ${severityStyle.badge}`}
                                >
                                  {scan.severity}
                                </span>

                                <span className="rounded-full border border-white/[0.06] px-2 py-1 text-[8px] text-white/20">
                                  {formatScanType(scan.scan_type)}
                                </span>
                              </div>

                              <div className="mt-2 break-all text-[11px] font-medium text-white/65">
                                {scan.input_value}
                              </div>

                              <div className="mt-1 flex flex-wrap items-center gap-2 text-[9px] text-white/20">
                                <span>
                                  {new Date(
                                    scan.created_at
                                  ).toLocaleString()}
                                </span>

                                <span className="text-white/10">·</span>

                                <span
                                  className={
                                    scan.response_status === "reviewed"
                                      ? "text-emerald-300/60"
                                      : "text-yellow-300/60"
                                  }
                                >
                                  {scan.response_status === "reviewed"
                                    ? "Reviewed"
                                    : "Pending review"}
                                </span>

                                {scan.report_status === "reported" && (
                                  <>
                                    <span className="text-white/10">·</span>
                                    <span className="text-blue-300/60">
                                      Reported
                                      {scan.report_reason
                                        ? ` · ${scan.report_reason}`
                                        : ""}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-4">
                            <div className="text-right">
                              <div className="text-[8px] uppercase tracking-wider text-white/15">
                                Risk
                              </div>

                              <div className="mt-1 text-sm font-semibold">
                                {scan.risk_score}/100
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-[8px] uppercase tracking-wider text-white/15">
                                Confidence
                              </div>

                              <div className="mt-1 text-sm font-semibold">
                                {scan.confidence ?? "—"}
                                {scan.confidence !== null ? "%" : ""}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div className="rounded-lg border border-white/[0.05] bg-white/[0.015] p-3">
                            <div className="text-[8px] uppercase tracking-[0.15em] text-white/15">
                              Response
                            </div>

                            <div className="mt-1 text-[10px] font-medium text-white/50">
                              {response.title}
                            </div>

                            <p className="mt-1 text-[9px] leading-4 text-white/20">
                              {response.description}
                            </p>
                          </div>

                          <div className="rounded-lg border border-white/[0.05] bg-white/[0.015] p-3">
                            <div className="text-[8px] uppercase tracking-[0.15em] text-white/15">
                              Recommended action
                            </div>

                            <div className="mt-1 text-[10px] font-medium text-white/50">
                              {response.action}
                            </div>

                            <p className="mt-1 text-[9px] leading-4 text-white/20">
                              {scan.recommendation ||
                                "Follow the security guidance associated with this scan."}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.05] pt-3">
                          <span className="text-[9px] text-white/15">
                            Response status:{" "}
                            {scan.response_status === "reviewed"
                              ? "Reviewed"
                              : "Pending review"}
                          </span>

                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {scan.response_status === "pending" ? (
                              <form action={markThreatReviewed}>
                                <input
                                  type="hidden"
                                  name="scanId"
                                  value={scan.id}
                                />

                                <button
                                  type="submit"
                                  className="rounded-lg border border-emerald-400/10 bg-emerald-400/[0.035] px-3 py-2 text-[9px] text-emerald-300/70 transition hover:bg-emerald-400/[0.08]"
                                >
                                  Mark as Reviewed
                                </button>
                              </form>
                            ) : (
                              <span className="rounded-lg border border-emerald-400/10 bg-emerald-400/[0.035] px-3 py-2 text-[9px] text-emerald-300/70">
                                ✓ Reviewed
                              </span>
                            )}

                            {scan.report_status === "not_reported" ? (
                              <form
                                action={reportThreat}
                                className="flex flex-wrap items-center gap-2"
                              >
                                <input
                                  type="hidden"
                                  name="scanId"
                                  value={scan.id}
                                />

                                <select
                                  name="reason"
                                  defaultValue={
                                    scan.scan_type === "sms"
                                      ? "Suspicious message"
                                      : scan.scan_type === "email"
                                        ? "Phishing"
                                        : "Malicious content"
                                  }
                                  className="rounded-lg border border-blue-400/10 bg-[#080b10] px-2.5 py-2 text-[9px] text-white/50 outline-none transition focus:border-blue-400/30"
                                  aria-label="Report reason"
                                >
                                  <option value="Phishing">Phishing</option>
                                  <option value="Scam">Scam</option>
                                  <option value="Malicious content">
                                    Malicious content
                                  </option>
                                  <option value="Suspicious message">
                                    Suspicious message
                                  </option>
                                  <option value="Other">Other</option>
                                </select>

                                <button
                                  type="submit"
                                  className="rounded-lg border border-blue-400/10 bg-blue-400/[0.035] px-3 py-2 text-[9px] text-blue-300/70 transition hover:bg-blue-400/[0.08]"
                                >
                                  Report Threat
                                </button>
                              </form>
                            ) : (
                              <span className="rounded-lg border border-blue-400/10 bg-blue-400/[0.035] px-3 py-2 text-[9px] text-blue-300/70">
                                ✓ Reported
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* SAFE RESPONSE GUIDANCE */}

          <section className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
              <div className="text-lg">🛑</div>

              <h3 className="mt-4 text-sm font-medium">
                Stop
              </h3>

              <p className="mt-2 text-[10px] leading-5 text-white/20">
                Do not interact with a critical or high-risk item until
                it has been independently verified.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
              <div className="text-lg">🔎</div>

              <h3 className="mt-4 text-sm font-medium">
                Verify
              </h3>

              <p className="mt-2 text-[10px] leading-5 text-white/20">
                Check the sender, domain and surrounding context using
                a trusted source.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
              <div className="text-lg">🛡️</div>

              <h3 className="mt-4 text-sm font-medium">
                Protect
              </h3>

              <p className="mt-2 text-[10px] leading-5 text-white/20">
                If you already interacted with suspicious content,
                follow your organization's security or account-recovery
                procedures.
              </p>
            </div>
          </section>

          {/* FOOTER */}

          <footer className="mt-10 border-t border-white/[0.07] py-7">
            <div className="flex flex-col justify-between gap-3 text-[9px] text-white/15 sm:flex-row">
              <span>
                Innovex Security — Report & Response
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