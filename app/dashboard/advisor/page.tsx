import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

type Severity = "Low" | "Medium" | "High" | "Critical";

type SecurityScan = {
  id: string;
  scan_type: string;
  input_value: string;
  risk_score: number;
  severity: Severity;
  confidence: number | null;
  threat_detected: boolean;
  recommendation: string | null;
  analysis_type: string | null;
  created_at: string;
};

function getSeverityClass(severity: Severity) {
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

function getScanTypeLabel(scanType: string) {
  switch (scanType.toLowerCase()) {
    case "url":
      return "URL Scan";
    case "email":
      return "Email Scan";
    case "sms":
      return "SMS Scan";
    default:
      return "Security Scan";
  }
}

function getScanIcon(scanType: string) {
  switch (scanType.toLowerCase()) {
    case "url":
      return "🔗";
    case "email":
      return "📧";
    case "sms":
      return "📱";
    default:
      return "🛡️";
  }
}

function getAdvice(
  threatCount: number,
  criticalCount: number,
  highCount: number,
  averageRisk: number,
  totalScans: number,
) {
  if (totalScans === 0) {
    return {
      title: "Start building your security profile",
      message:
        "You have not completed any security scans yet. Analyze a suspicious URL, email, or SMS to give Innovex Security real security activity to evaluate.",
      action: "Run a Security Scan",
      href: "/dashboard/scanner",
    };
  }

  if (criticalCount > 0) {
    return {
      title: "Immediate attention recommended",
      message:
        "Your recent security activity contains critical findings. Avoid interacting with the affected content and review the Threat Center for the details and recommendations.",
      action: "Open Threat Center",
      href: "/dashboard/threats",
    };
  }

  if (highCount > 0) {
    return {
      title: "Review high-risk findings",
      message:
        "Your security history contains high-risk findings. Be cautious with suspicious links, messages, and requests for credentials, OTPs, payments, or other sensitive information.",
      action: "Review Threats",
      href: "/dashboard/threats",
    };
  }

  if (averageRisk >= 50 || threatCount >= 3) {
    return {
      title: "Your security profile needs attention",
      message:
        "Several security findings have appeared in your recent activity. Review your scan history and use the security tools before interacting with suspicious content.",
      action: "Review Scan History",
      href: "/dashboard/history",
    };
  }

  if (threatCount > 0) {
    return {
      title: "Stay cautious",
      message:
        "Some suspicious activity has been detected in your security history. Continue checking unfamiliar links and messages before opening, replying, or sharing sensitive information.",
      action: "Review Security History",
      href: "/dashboard/history",
    };
  }

  return {
    title: "Your recent security activity looks healthy",
    message:
      "No significant threats have been detected in your current scan history. Continue checking suspicious content before interacting with it.",
    action: "Run Another Scan",
    href: "/dashboard/scanner",
  };
}

export default async function AdvisorPage() {
  const supabase = await createClient();

  const { data: authData, error: authError } =
    await supabase.auth.getClaims();

  if (authError || !authData?.claims) {
    redirect("/login");
  }

  const claims = authData.claims;

  const metadata = (claims.user_metadata ?? {}) as {
    full_name?: string;
  };

  const fullName = metadata.full_name || "User";
  const firstName = fullName.split(" ")[0];

  const { data: scans, error: scansError } = await supabase
    .from("security_scans")
    .select(
      "id, scan_type, input_value, risk_score, severity, confidence, threat_detected, recommendation, analysis_type, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (scansError) {
    console.error("AI Security Advisor scan query error:", scansError);
  }

  const securityScans = (scans ?? []) as SecurityScan[];

  const totalScans = securityScans.length;
  const threatCount = securityScans.filter(
    (scan) => scan.threat_detected,
  ).length;

  const criticalCount = securityScans.filter(
    (scan) => scan.severity === "Critical",
  ).length;

  const highCount = securityScans.filter(
    (scan) => scan.severity === "High",
  ).length;

  const mediumCount = securityScans.filter(
    (scan) => scan.severity === "Medium",
  ).length;

  const lowCount = securityScans.filter(
    (scan) => scan.severity === "Low",
  ).length;

  const averageRisk =
    totalScans > 0
      ? Math.round(
          securityScans.reduce((sum, scan) => sum + scan.risk_score, 0) /
            totalScans,
        )
      : 0;

  const confidenceValues = securityScans
    .map((scan) => scan.confidence)
    .filter((value): value is number => typeof value === "number");

  const averageConfidence =
    confidenceValues.length > 0
      ? Math.round(
          confidenceValues.reduce((sum, value) => sum + value, 0) /
            confidenceValues.length,
        )
      : 0;

  const threatRate =
    totalScans > 0 ? Math.round((threatCount / totalScans) * 100) : 0;

  const advice = getAdvice(
    threatCount,
    criticalCount,
    highCount,
    averageRisk,
    totalScans,
  );

  const latestScans = securityScans.slice(0, 5);

  const securityScore = Math.max(
    0,
    Math.min(
      100,
      100 -
        Math.round(averageRisk * 0.55) -
        Math.round(threatRate * 0.25) -
        Math.min((criticalCount + highCount) * 5, 20),
    ),
  );

  let scoreStatus = "Strong";
  let scoreDescription = "Your recent security activity looks healthy.";

  if (securityScore < 40) {
    scoreStatus = "At Risk";
    scoreDescription =
      "Your recent activity shows several security concerns that need attention.";
  } else if (securityScore < 60) {
    scoreStatus = "Needs Attention";
    scoreDescription =
      "Your security profile contains findings that should be reviewed.";
  } else if (securityScore < 80) {
    scoreStatus = "Good";
    scoreDescription =
      "Your security profile is reasonably healthy, with some areas to monitor.";
  }

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[30%] top-[-240px] h-[560px] w-[760px] rounded-full bg-purple-500/[0.045] blur-3xl" />
        <div className="absolute right-[-220px] top-[25%] h-[520px] w-[520px] rounded-full bg-cyan-500/[0.035] blur-3xl" />
        <div className="absolute bottom-[-260px] left-[15%] h-[500px] w-[600px] rounded-full bg-blue-500/[0.025] blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#05070b]/90 backdrop-blur-xl">
          <div className="mx-auto flex h-[68px] max-w-[1450px] items-center justify-between px-5 sm:px-8">
            <div>
              <Link
                href="/dashboard"
                className="text-[9px] font-medium uppercase tracking-[0.2em] text-white/25 transition hover:text-white/50"
              >
                Security Center
              </Link>

              <div className="mt-1 text-sm font-medium">
                AI Security Advisor
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <div className="text-xs font-medium">{firstName}</div>
                <div className="mt-0.5 text-[9px] text-white/20">
                  Security protected
                </div>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.04] text-xs font-semibold">
                {firstName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1450px] px-5 py-7 sm:px-8 sm:py-9">
          {/* Hero */}
          <section className="rounded-3xl border border-purple-400/15 bg-gradient-to-br from-purple-400/[0.07] via-white/[0.025] to-cyan-400/[0.035] p-7 lg:p-10">
            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
              <div className="max-w-3xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-purple-400/20 bg-purple-400/[0.07] px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.18em] text-purple-300/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-300" />
                  Security intelligence
                </div>

                <p className="text-sm text-white/30">
                  {firstName}, your security advisor
                </p>

                <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Understand your security.{" "}
                  <span className="text-purple-300">
                    Know what to do next.
                  </span>
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/35">
                  Innovex Security Advisor evaluates your real saved scan
                  activity and turns the findings into clear security
                  guidance.
                </p>
              </div>

              <Link
                href="/dashboard/scanner"
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black shadow-lg shadow-black/20 transition hover:bg-white/90"
              >
                <span>⌕</span>
                Run Security Scan
              </Link>
            </div>
          </section>

          {/* Current Assessment */}
          <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <div className="rounded-3xl border border-white/[0.07] bg-white/[0.025] p-7 lg:p-8">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <div className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/25">
                    Current assessment
                  </div>

                  <h2 className="mt-2 text-2xl font-semibold">
                    {advice.title}
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm leading-7 text-white/35">
                    {advice.message}
                  </p>
                </div>

                <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-purple-400/20 bg-purple-400/[0.08] text-xl text-purple-300 sm:flex">
                  ✦
                </div>
              </div>

              <Link
                href={advice.href}
                className="mt-6 inline-flex rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-white/60 transition hover:bg-white/[0.07] hover:text-white"
              >
                {advice.action} →
              </Link>
            </div>

            <div className="rounded-3xl border border-white/[0.07] bg-white/[0.025] p-7 lg:p-8">
              <div className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/25">
                Security score
              </div>

              <div className="mt-4 flex items-center gap-5">
                <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-[9px] border-white/[0.06]">
                  <div className="text-center">
                    <div className="text-2xl font-semibold">
                      {securityScore}
                    </div>
                    <div className="text-[7px] uppercase tracking-widest text-white/20">
                      score
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-lg font-semibold">{scoreStatus}</div>
                  <p className="mt-1 text-[10px] leading-5 text-white/25">
                    {scoreDescription}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              {
                label: "Total scans",
                value: totalScans,
                icon: "⌕",
              },
              {
                label: "Threats found",
                value: threatCount,
                icon: "!",
              },
              {
                label: "Average risk",
                value: `${averageRisk}/100`,
                icon: "◈",
              },
              {
                label: "Threat rate",
                value: `${threatRate}%`,
                icon: "⚠",
              },
              {
                label: "Avg confidence",
                value:
                  confidenceValues.length > 0
                    ? `${averageConfidence}%`
                    : "—",
                icon: "✓",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-white/20">
                    {item.label}
                  </span>

                  <span className="text-xs text-white/25">{item.icon}</span>
                </div>

                <div className="mt-5 text-2xl font-semibold">
                  {item.value}
                </div>
              </div>
            ))}
          </section>

          {/* Risk Overview */}
          <section className="mt-6 rounded-3xl border border-white/[0.07] bg-white/[0.025] p-7 lg:p-8">
            <div>
              <div className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/25">
                Risk overview
              </div>

              <h2 className="mt-2 text-xl font-semibold">
                What your scan history is telling you
              </h2>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "Critical",
                  value: criticalCount,
                  severity: "Critical" as Severity,
                },
                {
                  label: "High",
                  value: highCount,
                  severity: "High" as Severity,
                },
                {
                  label: "Medium",
                  value: mediumCount,
                  severity: "Medium" as Severity,
                },
                {
                  label: "Low",
                  value: lowCount,
                  severity: "Low" as Severity,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`rounded-2xl border p-5 ${getSeverityClass(
                    item.severity,
                  )}`}
                >
                  <div className="text-[9px] font-medium uppercase tracking-[0.16em] opacity-70">
                    {item.label}
                  </div>

                  <div className="mt-4 text-3xl font-semibold">
                    {item.value}
                  </div>

                  <div className="mt-1 text-[9px] opacity-50">
                    findings in saved scan history
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Guidance */}
          <section className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-white/[0.07] bg-white/[0.025] p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.06] text-cyan-300">
                🔍
              </div>

              <h3 className="mt-5 font-semibold">Before you interact</h3>

              <p className="mt-2 text-[11px] leading-6 text-white/25">
                Check unfamiliar links, emails, and messages before clicking,
                replying, downloading files, or sharing sensitive information.
              </p>

              <Link
                href="/dashboard/scanner"
                className="mt-5 inline-block text-[10px] text-cyan-300/70 transition hover:text-cyan-300"
              >
                Scan suspicious content →
              </Link>
            </div>

            <div className="rounded-3xl border border-white/[0.07] bg-white/[0.025] p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-400/15 bg-purple-400/[0.06] text-purple-300">
                🧠
              </div>

              <h3 className="mt-5 font-semibold">Understand the evidence</h3>

              <p className="mt-2 text-[11px] leading-6 text-white/25">
                Risk scores and security findings are based on observable
                indicators from your scans. Review the details instead of
                relying only on a single score.
              </p>

              <Link
                href="/dashboard/history"
                className="mt-5 inline-block text-[10px] text-purple-300/70 transition hover:text-purple-300"
              >
                Review scan history →
              </Link>
            </div>

            <div className="rounded-3xl border border-white/[0.07] bg-white/[0.025] p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-300">
                🛡️
              </div>

              <h3 className="mt-5 font-semibold">Take the safer action</h3>

              <p className="mt-2 text-[11px] leading-6 text-white/25">
                When a threat is detected, avoid the suspicious content and
                follow the recommendation provided by the security analysis.
              </p>

              <Link
                href="/dashboard/checkup"
                className="mt-5 inline-block text-[10px] text-emerald-300/70 transition hover:text-emerald-300"
              >
                Review security checkup →
              </Link>
            </div>
          </section>

          {/* Recent Activity */}
          <section className="mt-6 rounded-3xl border border-white/[0.07] bg-white/[0.025] p-7 lg:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <div className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/25">
                  Recent activity
                </div>

                <h2 className="mt-2 text-xl font-semibold">
                  Recent security findings
                </h2>

                <p className="mt-1 text-[10px] text-white/20">
                  Based on your latest saved security scans.
                </p>
              </div>

              <Link
                href="/dashboard/history"
                className="text-[10px] text-white/30 transition hover:text-white"
              >
                View full history →
              </Link>
            </div>

            {latestScans.length === 0 ? (
              <div className="mt-7 rounded-2xl border border-dashed border-white/[0.08] bg-black/10 p-8 text-center">
                <div className="text-2xl">🛡️</div>

                <h3 className="mt-3 text-sm font-medium">
                  No security scans yet
                </h3>

                <p className="mx-auto mt-2 max-w-md text-[10px] leading-5 text-white/20">
                  Run a URL, Email, or SMS scan and the Security Advisor will
                  use that real activity to provide guidance.
                </p>

                <Link
                  href="/dashboard/scanner"
                  className="mt-5 inline-flex rounded-xl bg-white px-4 py-2.5 text-[10px] font-semibold text-black transition hover:bg-white/90"
                >
                  Start a scan
                </Link>
              </div>
            ) : (
              <div className="mt-7 space-y-3">
                {latestScans.map((scan) => (
                  <div
                    key={scan.id}
                    className="flex flex-col gap-4 rounded-2xl border border-white/[0.07] bg-black/10 p-4 sm:flex-row sm:items-center"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-sm">
                      {getScanIcon(scan.scan_type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium">
                          {getScanTypeLabel(scan.scan_type)}
                        </span>

                        <span
                          className={`rounded-full border px-2 py-1 text-[8px] font-medium uppercase tracking-wider ${getSeverityClass(
                            scan.severity,
                          )}`}
                        >
                          {scan.severity}
                        </span>
                      </div>

                      <p className="mt-1 truncate text-[10px] text-white/20">
                        {scan.input_value}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-sm font-semibold">
                        {scan.risk_score}/100
                      </div>

                      <div className="mt-1 text-[8px] text-white/20">
                        {new Date(scan.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Transparency */}
          <section className="mt-6 rounded-3xl border border-cyan-400/10 bg-cyan-400/[0.018] p-7 lg:p-8">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.05] text-cyan-300">
                ℹ
              </div>

              <div>
                <h2 className="font-semibold">Advisor transparency</h2>

                <p className="mt-2 text-[10px] leading-6 text-white/25">
                  This version of the Security Advisor generates guidance from
                  your real saved scan data and the security analysis already
                  performed by Innovex Security. It does not claim to be a
                  generative AI model until an AI model is explicitly connected
                  to the application.
                </p>

                <p className="mt-3 text-[10px] leading-6 text-white/20">
                  Threat intelligence and local security analysis are kept
                  distinguishable so you can understand what information is
                  being used.
                </p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-10 border-t border-white/[0.07] py-7">
            <div className="flex flex-col justify-between gap-3 text-[9px] text-white/15 sm:flex-row">
              <span>
                Innovex Security — Your Personal AI Security Center
              </span>

              <span>Detect. Analyze. Respond. Protect.</span>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}