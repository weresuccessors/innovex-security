import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type Scan = {
  id: string;
  input_value: string;
  domain: string | null;
  risk_score: number;
  severity: "Low" | "Medium" | "High" | "Critical";
  confidence: number | null;
  threat_detected: boolean;
  created_at: string;
};

function getSeverityClass(severity: Scan["severity"]) {
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

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const { data: authData, error: authError } =
    await supabase.auth.getClaims();

  if (authError || !authData?.claims?.sub) {
    redirect("/login");
  }

  const userId = authData.claims.sub;

  const { data: scans, error: scansError } = await supabase
    .from("security_scans")
    .select(
      "id, input_value, domain, risk_score, severity, confidence, threat_detected, created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (scansError) {
    console.error("Analytics scan query failed:", scansError);
  }

  const scanData = (scans ?? []) as Scan[];

  const totalScans = scanData.length;

  const threatsDetected = scanData.filter(
    (scan) => scan.threat_detected
  ).length;

  const safeScans = scanData.filter(
    (scan) => !scan.threat_detected
  ).length;

  const criticalCount = scanData.filter(
    (scan) => scan.severity === "Critical"
  ).length;

  const highCount = scanData.filter(
    (scan) => scan.severity === "High"
  ).length;

  const mediumCount = scanData.filter(
    (scan) => scan.severity === "Medium"
  ).length;

  const lowCount = scanData.filter(
    (scan) => scan.severity === "Low"
  ).length;

  const averageRisk =
    totalScans > 0
      ? Math.round(
          scanData.reduce(
            (total, scan) => total + scan.risk_score,
            0
          ) / totalScans
        )
      : 0;

  const averageConfidence =
    totalScans > 0
      ? Math.round(
          scanData.reduce(
            (total, scan) =>
              total + (scan.confidence ?? 0),
            0
          ) / totalScans
        )
      : 0;

  const threatRate =
    totalScans > 0
      ? Math.round((threatsDetected / totalScans) * 100)
      : 0;

  const latestScans = scanData.slice(0, 8);

  const maxSeverityCount = Math.max(
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    1
  );

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-[278px] shrink-0 border-r border-white/[0.07] bg-[#07090d] lg:flex lg:flex-col">
          <div className="border-b border-white/[0.07] px-5 py-5">
            <a
              href="/dashboard"
              className="group flex items-center gap-3"
            >
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-white text-lg text-black shadow-lg transition duration-300 group-hover:scale-105">
                🛡️
              </div>

              <div>
                <div className="text-sm font-semibold tracking-tight">
                  Innovex Security
                </div>

                <div className="mt-0.5 text-[10px] text-white/25">
                  Personal AI Security Center
                </div>
              </div>
            </a>
          </div>

          <div className="mx-4 mt-5 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.025] p-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>

              <span className="text-[10px] font-medium text-emerald-300/80">
                Security system operational
              </span>
            </div>

            <p className="mt-2 text-[9px] leading-4 text-white/20">
              Analytics are connected to your security scan data.
            </p>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/20">
              Security Center
            </div>

            <div className="space-y-1">
              <a
                href="/dashboard"
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/45 transition hover:bg-white/[0.045] hover:text-white"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.035] text-white/50">
                  ⌂
                </span>

                <span>Dashboard</span>
              </a>

              <a
                href="/dashboard/scanner"
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/45 transition hover:bg-white/[0.045] hover:text-white"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.035] text-white/50">
                  ⌕
                </span>

                <span>Threat Scanner</span>
              </a>

              <a
                href="/dashboard/threats"
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/45 transition hover:bg-white/[0.045] hover:text-white"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.035] text-white/50">
                  !
                </span>

                <span>Threat Center</span>
              </a>

              <a
                href="/dashboard/analytics"
                className="group flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.08] px-3 py-2.5 text-sm text-white shadow-[0_8px_30px_rgba(0,0,0,0.15)]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black">
                  ◫
                </span>

                <span className="flex-1">Security Analytics</span>

                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
              </a>

              <a
                href="/dashboard/history"
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/45 transition hover:bg-white/[0.045] hover:text-white"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.035] text-white/50">
                  ◷
                </span>

                <span>Scan History</span>
              </a>
            </div>

            <div className="mb-3 mt-9 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/20">
              Protection
            </div>

            <div className="space-y-1">
              <a
                href="#"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/30 transition hover:bg-white/[0.045] hover:text-white"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.035]">
                  ✉
                </span>

                <span>Email Guard</span>
              </a>

              <a
                href="#"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/30 transition hover:bg-white/[0.045] hover:text-white"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.035]">
                  ▣
                </span>

                <span>SMS Guard</span>
              </a>

              <a
                href="#"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/30 transition hover:bg-white/[0.045] hover:text-white"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.035]">
                  ✦
                </span>

                <span>AI Security Advisor</span>
              </a>

              <a
                href="#"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/30 transition hover:bg-white/[0.045] hover:text-white"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.035]">
                  ✓
                </span>

                <span>Security Checkup</span>
              </a>
            </div>
          </nav>

          <div className="border-t border-white/[0.07] p-4">
            <a
              href="/dashboard"
              className="flex w-full items-center justify-center rounded-lg border border-white/[0.07] px-3 py-2 text-xs text-white/35 transition hover:bg-white/[0.05] hover:text-white"
            >
              ← Back to Dashboard
            </a>
          </div>
        </aside>

        {/* Main */}
        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-white/[0.07] bg-[#05070b]/90 px-5 backdrop-blur-xl sm:px-8">
            <div>
              <div className="text-[9px] font-medium uppercase tracking-[0.2em] text-white/20">
                Security Center
              </div>

              <div className="mt-1 text-sm font-medium">
                Security Analytics
              </div>
            </div>

            <a
              href="/dashboard"
              className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-2 text-xs text-white/40 transition hover:bg-white/[0.06] hover:text-white"
            >
              Dashboard
            </a>
          </header>

          <div className="mx-auto max-w-[1450px] px-5 py-7 sm:px-8 sm:py-9">
            {/* Header */}
            <section>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/10 bg-blue-400/[0.025] px-3 py-1.5 text-[9px] font-medium text-blue-300/70">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                Real scan analytics
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Security Analytics
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/30">
                Understand your security activity using analysis
                results recorded by Innovex Security.
              </p>
            </section>

            {/* Summary Cards */}
            <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-[0.18em] text-white/25">
                    Total scans
                  </span>

                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-400/[0.07]">
                    ⌕
                  </span>
                </div>

                <div className="mt-6 text-4xl font-semibold">
                  {totalScans}
                </div>

                <p className="mt-2 text-[10px] text-white/25">
                  All recorded security scans
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-[0.18em] text-white/25">
                    Threats detected
                  </span>

                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-400/[0.07] text-red-300">
                    !
                  </span>
                </div>

                <div className="mt-6 text-4xl font-semibold">
                  {threatsDetected}
                </div>

                <p className="mt-2 text-[10px] text-white/25">
                  {threatRate}% threat detection rate
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-[0.18em] text-white/25">
                    Average risk
                  </span>

                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-400/[0.07] text-orange-300">
                    ◫
                  </span>
                </div>

                <div className="mt-6 text-4xl font-semibold">
                  {averageRisk}
                  <span className="ml-1 text-base text-white/20">
                    /100
                  </span>
                </div>

                <p className="mt-2 text-[10px] text-white/25">
                  Across all recorded scans
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-[0.18em] text-white/25">
                    Safe scans
                  </span>

                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/[0.07] text-emerald-300">
                    ✓
                  </span>
                </div>

                <div className="mt-6 text-4xl font-semibold">
                  {safeScans}
                </div>

                <p className="mt-2 text-[10px] text-white/25">
                  Scans without detected threats
                </p>
              </div>
            </section>

            {/* Main Analytics */}
            <section className="mt-6 grid gap-6 lg:grid-cols-5">
              {/* Severity */}
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 lg:col-span-3">
                <div>
                  <h2 className="font-semibold">
                    Risk Distribution
                  </h2>

                  <p className="mt-1 text-[10px] text-white/25">
                    Distribution of your recorded scan results
                  </p>
                </div>

                <div className="mt-8 space-y-5">
                  {[
                    {
                      name: "Critical",
                      count: criticalCount,
                      label: "red",
                    },
                    {
                      name: "High",
                      count: highCount,
                      label: "orange",
                    },
                    {
                      name: "Medium",
                      count: mediumCount,
                      label: "yellow",
                    },
                    {
                      name: "Low",
                      count: lowCount,
                      label: "emerald",
                    },
                  ].map((item) => {
                    const percentage =
                      totalScans > 0
                        ? Math.round(
                            (item.count / totalScans) * 100
                          )
                        : 0;

                    return (
                      <div key={item.name}>
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                item.label === "red"
                                  ? "bg-red-400"
                                  : item.label === "orange"
                                  ? "bg-orange-400"
                                  : item.label === "yellow"
                                  ? "bg-yellow-400"
                                  : "bg-emerald-400"
                              }`}
                            />

                            <span className="text-xs text-white/50">
                              {item.name}
                            </span>
                          </div>

                          <span className="text-xs text-white/25">
                            {item.count}{" "}
                            <span className="text-white/15">
                              ({percentage}%)
                            </span>
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                          <div
                            className={`h-full rounded-full ${
                              item.label === "red"
                                ? "bg-red-400/60"
                                : item.label === "orange"
                                ? "bg-orange-400/60"
                                : item.label === "yellow"
                                ? "bg-yellow-400/60"
                                : "bg-emerald-400/60"
                            }`}
                            style={{
                              width: `${Math.max(
                                percentage,
                                item.count > 0 ? 4 : 0
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {totalScans === 0 && (
                  <div className="mt-7 rounded-xl border border-white/[0.06] bg-black/10 p-4 text-center text-[10px] text-white/20">
                    No scan data is available yet.
                  </div>
                )}
              </div>

              {/* Intelligence */}
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 lg:col-span-2">
                <h2 className="font-semibold">
                  Analysis Quality
                </h2>

                <p className="mt-1 text-[10px] text-white/25">
                  Confidence across your scan results
                </p>

                <div className="mt-8 flex items-center justify-center">
                  <div className="relative flex h-40 w-40 items-center justify-center rounded-full border-[14px] border-white/[0.05]">
                    <div
                      className="absolute inset-[-14px] rounded-full border-[14px] border-transparent border-t-blue-400/60 border-r-blue-400/60"
                      style={{
                        transform: `rotate(${
                          averageConfidence * 3.6
                        }deg)`,
                      }}
                    />

                    <div className="relative text-center">
                      <div className="text-3xl font-semibold">
                        {averageConfidence}%
                      </div>

                      <div className="mt-1 text-[8px] uppercase tracking-[0.18em] text-white/20">
                        Confidence
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-7 rounded-xl border border-white/[0.06] bg-black/10 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/30">
                      Threat detection
                    </span>

                    <span className="text-xs font-semibold">
                      {threatRate}%
                    </span>
                  </div>

                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-blue-400/60"
                      style={{
                        width: `${threatRate}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Latest Scans */}
            <section className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-semibold">
                    Recent Scan Analytics
                  </h2>

                  <p className="mt-1 text-[10px] text-white/25">
                    Latest security scans contributing to these
                    analytics
                  </p>
                </div>

                <a
                  href="/dashboard/history"
                  className="text-[10px] font-medium text-blue-300/70 transition hover:text-blue-300"
                >
                  View full history →
                </a>
              </div>

              {latestScans.length === 0 ? (
                <div className="mt-7 rounded-xl border border-white/[0.06] bg-black/10 p-8 text-center">
                  <div className="text-2xl">📊</div>

                  <h3 className="mt-3 text-sm font-medium">
                    No analytics yet
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-[10px] leading-5 text-white/20">
                    Run a security scan to generate real analytics
                    for your account.
                  </p>

                  <a
                    href="/dashboard/scanner"
                    className="mt-5 inline-flex rounded-xl bg-white px-4 py-2.5 text-[10px] font-semibold text-black transition hover:bg-white/90"
                  >
                    Start a scan
                  </a>
                </div>
              ) : (
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left">
                    <thead>
                      <tr className="border-b border-white/[0.07] text-[9px] uppercase tracking-[0.15em] text-white/20">
                        <th className="pb-3 font-medium">
                          Target
                        </th>

                        <th className="pb-3 font-medium">
                          Risk
                        </th>

                        <th className="pb-3 font-medium">
                          Severity
                        </th>

                        <th className="pb-3 font-medium">
                          Confidence
                        </th>

                        <th className="pb-3 text-right font-medium">
                          Time
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {latestScans.map((scan) => (
                        <tr
                          key={scan.id}
                          className="border-b border-white/[0.05] last:border-0"
                        >
                          <td className="py-4">
                            <div className="max-w-[320px] truncate text-xs text-white/55">
                              {scan.domain ||
                                scan.input_value}
                            </div>

                            <div className="mt-1 max-w-[320px] truncate text-[9px] text-white/15">
                              {scan.input_value}
                            </div>
                          </td>

                          <td className="py-4">
                            <span className="text-sm font-semibold">
                              {scan.risk_score}
                            </span>
                            <span className="ml-1 text-[9px] text-white/15">
                              /100
                            </span>
                          </td>

                          <td className="py-4">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-medium ${getSeverityClass(
                                scan.severity
                              )}`}
                            >
                              {scan.severity}
                            </span>
                          </td>

                          <td className="py-4 text-xs text-white/35">
                            {scan.confidence ?? 0}%
                          </td>

                          <td className="py-4 text-right text-[9px] text-white/20">
                            {formatDate(scan.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Security Insight */}
            <section className="mt-6 rounded-2xl border border-blue-400/10 bg-blue-400/[0.018] p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-400/[0.08] text-blue-300">
                  ✦
                </div>

                <div>
                  <div className="text-[9px] font-medium uppercase tracking-[0.18em] text-blue-300/50">
                    Security insight
                  </div>

                  <h2 className="mt-2 text-base font-semibold">
                    {totalScans === 0
                      ? "Start collecting security intelligence."
                      : threatsDetected === 0
                      ? "No threats have been detected in your recorded scans."
                      : `${threatsDetected} threat${
                          threatsDetected === 1 ? "" : "s"
                        } detected in your recorded scans.`}
                  </h2>

                  <p className="mt-2 max-w-3xl text-[10px] leading-5 text-white/25">
                    {totalScans === 0
                      ? "Your analytics dashboard will become more useful as you analyze URLs and build a real security scan history."
                      : "These analytics are calculated directly from your saved security scan records. They are not simulated threat statistics."}
                  </p>
                </div>
              </div>
            </section>

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
        </section>
      </div>
    </main>
  );
}