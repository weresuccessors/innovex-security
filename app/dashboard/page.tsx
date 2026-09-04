import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import LogoutButton from "./logout-button";
import QuickScanner from "./quick-scanner";

export const dynamic = "force-dynamic";

function NavItem({
  href,
  icon,
  label,
  active = false,
}: {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
}) {
  return (
    <a
      href={href}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
        active
          ? "border border-white/[0.08] bg-white/[0.08] text-white shadow-[0_8px_30px_rgba(0,0,0,0.15)]"
          : "text-white/45 hover:bg-white/[0.045] hover:text-white"
      }`}
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition ${
          active
            ? "bg-white text-black"
            : "bg-white/[0.035] text-white/50 group-hover:bg-white/[0.08] group-hover:text-white"
        }`}
      >
        {icon}
      </span>

      <span className="flex-1">{label}</span>

      {active && (
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
      )}
    </a>
  );
}

function SectionTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/20">
      {children}
    </div>
  );
}

type ScanRecord = {
  id: string;
  scan_type: string;
  input_value: string;
  risk_score: number;
  severity: "Low" | "Medium" | "High" | "Critical";
  confidence: number | null;
  threat_detected: boolean;
  created_at: string;
};

function clampScore(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function getSecurityStatus(score: number) {
  if (score >= 80) {
    return {
      title: "Strong protection",
      description:
        "Your recent security activity indicates a strong overall posture. Continue checking suspicious content before opening it.",
      badge: "Protected",
      badgeClass:
        "border-emerald-400/10 bg-emerald-400/[0.035] text-emerald-300/70",
      dotClass: "bg-emerald-400",
    };
  }

  if (score >= 60) {
    return {
      title: "Good protection",
      description:
        "Your security posture is generally healthy, but recent scan activity shows some areas that deserve attention.",
      badge: "Good",
      badgeClass:
        "border-yellow-400/10 bg-yellow-400/[0.035] text-yellow-300/70",
      dotClass: "bg-yellow-400",
    };
  }

  if (score >= 40) {
    return {
      title: "Needs attention",
      description:
        "Recent security activity shows elevated risk. Review detected threats and avoid opening suspicious content.",
      badge: "Attention needed",
      badgeClass:
        "border-orange-400/10 bg-orange-400/[0.035] text-orange-300/70",
      dotClass: "bg-orange-400",
    };
  }

  return {
    title: "Immediate attention",
    description:
      "Recent security activity shows significant risk. Review detected threats and take recommended protective actions.",
    badge: "Action required",
    badgeClass:
      "border-red-400/10 bg-red-400/[0.05] text-red-300/70",
    dotClass: "bg-red-400",
  };
}

function SecurityGauge({ score }: { score: number }) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference * (1 - score / 100);

  return (
    <div className="relative flex h-40 w-40 shrink-0 items-center justify-center">
      <svg
        className="absolute inset-0 h-full w-full -rotate-90"
        viewBox="0 0 120 120"
      >
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          className="text-white/[0.06]"
        />

        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          className="text-emerald-400"
        />
      </svg>

      <div className="relative text-center">
        <div className="text-4xl font-semibold tracking-tight">
          {score}
        </div>

        <div className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-white/25">
          Security
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/login");
  }

  const claims = data.claims;

  const metadata = (claims.user_metadata ?? {}) as {
    full_name?: string;
  };

  const fullName = metadata.full_name || "User";
  const firstName = fullName.split(" ")[0];

  const { data: scans, error: scansError } = await supabase
    .from("security_scans")
    .select(
      "id, scan_type, input_value, risk_score, severity, confidence, threat_detected, created_at"
    )
    .eq("user_id", claims.sub)
    .order("created_at", { ascending: false });

  const userScans: ScanRecord[] = scansError
    ? []
    : ((scans ?? []) as ScanRecord[]);

  const totalScans = userScans.length;

  const detectedThreats = userScans.filter(
    (scan) => scan.threat_detected
  ).length;

  const safeScans = totalScans - detectedThreats;

  const averageRisk =
    totalScans > 0
      ? Math.round(
          userScans.reduce(
            (sum, scan) => sum + (scan.risk_score ?? 0),
            0
          ) / totalScans
        )
      : 0;

  const scansWithConfidence = userScans.filter(
    (scan) => typeof scan.confidence === "number"
  );

  const averageConfidence =
    scansWithConfidence.length > 0
      ? Math.round(
          scansWithConfidence.reduce(
            (sum, scan) => sum + (scan.confidence ?? 0),
            0
          ) / scansWithConfidence.length
        )
      : 0;

  const threatRate =
    totalScans > 0
      ? Math.round((detectedThreats / totalScans) * 100)
      : 0;

  const securityScore =
    totalScans === 0
      ? 100
      : clampScore(100 - averageRisk * 0.6 - threatRate * 0.4);

  const securityStatus = getSecurityStatus(securityScore);

  const severityCounts = {
    Critical: userScans.filter(
      (scan) => scan.severity === "Critical"
    ).length,
    High: userScans.filter(
      (scan) => scan.severity === "High"
    ).length,
    Medium: userScans.filter(
      (scan) => scan.severity === "Medium"
    ).length,
    Low: userScans.filter(
      (scan) => scan.severity === "Low"
    ).length,
  };

  const now = new Date();

  const activityByDay = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(now.getDate() - (6 - index));

    const count = userScans.filter((scan) => {
      const scanDate = new Date(scan.created_at);

      return (
        scanDate.getFullYear() === date.getFullYear() &&
        scanDate.getMonth() === date.getMonth() &&
        scanDate.getDate() === date.getDate()
      );
    }).length;

    return {
      label: date.toLocaleDateString("en-US", {
        weekday: "short",
      }),
      count,
    };
  });

  const maxActivity = Math.max(
    1,
    ...activityByDay.map((day) => day.count)
  );

  let advisorAssessment =
    "No scans have been recorded yet. Start with a security scan to build your personalized security profile.";

  if (totalScans > 0 && securityScore >= 80) {
    advisorAssessment =
      "Your recent security activity looks healthy. Continue checking suspicious URLs, emails and messages before interacting with them.";
  } else if (totalScans > 0 && securityScore >= 60) {
    advisorAssessment =
      "Your recent security activity is generally good, but some detected risks deserve review. Open the Security Advisor for personalized guidance.";
  } else if (totalScans > 0) {
    advisorAssessment =
      "Your recent security activity shows elevated risk. Review detected threats and follow the recommendations in the Security Advisor.";
  }

  const recommendedActionTitle =
    totalScans === 0
      ? "Run your first security scan"
      : detectedThreats > 0
        ? "Review detected threats"
        : "Run another security check";

  const recommendedActionDescription =
    totalScans === 0
      ? "Analyze a suspicious URL before opening it."
      : detectedThreats > 0
        ? `${detectedThreats} threat${detectedThreats === 1 ? "" : "s"} detected in your scan history. Review the Threat Center.`
        : "Continue checking suspicious content before interacting with it.";

  const hour = new Date().getHours();

  let greeting = "Good evening";

  if (hour < 12) {
    greeting = "Good morning";
  } else if (hour < 17) {
    greeting = "Good afternoon";
  }

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[25%] top-[-250px] h-[600px] w-[800px] rounded-full bg-blue-500/[0.035] blur-3xl" />

        <div className="absolute right-[-250px] top-[20%] h-[550px] w-[550px] rounded-full bg-purple-500/[0.025] blur-3xl" />

        <div className="absolute bottom-[-300px] left-[20%] h-[500px] w-[600px] rounded-full bg-emerald-500/[0.018] blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* ================================================= */}
        {/* SIDEBAR */}
        {/* ================================================= */}

        <aside className="hidden w-[278px] shrink-0 border-r border-white/[0.07] bg-[#07090d] lg:flex lg:flex-col">
          <div className="border-b border-white/[0.07] px-5 py-5">
            <a href="/" className="group flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-white text-lg text-black shadow-lg transition duration-300 group-hover:scale-105">
                🛡️
              </div>

              <div className="min-w-0">
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
              Core protection services are currently available.
            </p>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <SectionTitle>Security Center</SectionTitle>

            <div className="space-y-1">
              <NavItem
                href="/dashboard"
                icon="⌂"
                label="Dashboard"
                active
              />

              <NavItem
                href="/dashboard/scanner"
                icon="⌕"
                label="Threat Scanner"
              />

              <NavItem
                href="/dashboard/threats"
                icon="!"
                label="Threat Center"
              />

              {/* CONNECTED: Threat Intelligence */}
              <NavItem
                href="/dashboard/intelligence"
                icon="◎"
                label="Threat Intelligence"
              />

              {/* CONNECTED: Security Analytics */}
              <NavItem
                href="/dashboard/analytics"
                icon="◫"
                label="Security Analytics"
              />

              {/* CONNECTED: Scan History */}
              <NavItem
                href="/dashboard/history"
                icon="◷"
                label="Scan History"
              />
            </div>

            <div className="mb-3 mt-9">
              <SectionTitle>Protection</SectionTitle>
            </div>

            <div className="space-y-1">
              <NavItem
                href="/dashboard/email"
                icon="✉"
                label="Email Guard"
              />

              <NavItem
                href="/dashboard/sms"
                icon="▣"
                label="SMS Guard"
              />

              <NavItem
                href="/dashboard/report"
                icon="⚑"
                label="Report & Response"
              />

              <NavItem
                href="/dashboard/advisor"
                icon="✦"
                label="AI Security Advisor"
              />

              <NavItem
                href="/dashboard/checkup"
                icon="✓"
                label="Security Checkup"
              />

              <NavItem
                href="/dashboard/about"
                icon="ℹ"
                label="About"
              />
            </div>
          </nav>

          <div className="border-t border-white/[0.07] p-4">
            <div className="mb-3 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-xs font-semibold">
                {firstName.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium">
                  {fullName}
                </div>

                <div className="mt-1 flex items-center gap-1.5 text-[9px] text-emerald-400/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Protected account
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <a
                href="/dashboard/settings"
                className="flex flex-1 items-center justify-center rounded-lg border border-white/[0.07] px-3 py-2 text-xs text-white/35 transition hover:bg-white/[0.05] hover:text-white"
              >
                ⚙ Settings
              </a>

              <LogoutButton />
            </div>
          </div>
        </aside>

        {/* ================================================= */}
        {/* MAIN */}
        {/* ================================================= */}

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-white/[0.07] bg-[#05070b]/90 px-5 backdrop-blur-xl sm:px-8">
            <div>
              <div className="text-[9px] font-medium uppercase tracking-[0.2em] text-white/20">
                Security Center
              </div>

              <div className="mt-1 text-sm font-medium">
                Dashboard
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="#notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-sm transition hover:bg-white/[0.07]"
              >
                ♢

                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </a>

              <div className="hidden text-right sm:block">
                <div className="text-xs font-medium">
                  {firstName}
                </div>

                <div className="mt-0.5 text-[9px] text-white/20">
                  Security protected
                </div>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.04] text-xs font-semibold">
                {firstName.charAt(0).toUpperCase()}
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1450px] px-5 py-7 sm:px-8 sm:py-9">
            {/* ================================================= */}
            {/* OVERVIEW */}
            {/* ================================================= */}

            <section id="overview" className="scroll-mt-24">
              <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/10 bg-emerald-400/[0.025] px-3 py-1.5 text-[9px] font-medium text-emerald-300/70">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Protection active
                  </div>

                  <p className="text-sm text-white/30">
                    {greeting}, {firstName} 👋
                  </p>

                  <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
                    Your security at a glance.
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/30">
                    Monitor your digital safety, analyze suspicious
                    content and respond to threats from one
                    intelligent security center.
                  </p>
                </div>

                <a
                  href="/dashboard/scanner"
                  className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black shadow-lg shadow-black/20 transition hover:bg-white/90"
                >
                  <span>⌕</span>
                  Start security scan
                </a>
              </div>
            </section>

            {/* ================================================= */}
            {/* SECURITY SUMMARY */}
            {/* ================================================= */}

            <div className="mt-8 grid gap-4 xl:grid-cols-[1.35fr_1fr_1fr]">
              <div className="relative overflow-hidden rounded-2xl border border-emerald-400/10 bg-gradient-to-br from-emerald-400/[0.035] to-transparent p-6">
                <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-emerald-400/[0.045] blur-3xl" />

                <div className="relative flex items-center justify-between gap-5">
                  <div>
                    <div className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/25">
                      Overall security
                    </div>

                    <h2 className="mt-2 text-lg font-semibold">
                      {securityStatus.title}
                    </h2>

                    <p className="mt-2 max-w-[230px] text-[11px] leading-5 text-white/25">
                      {securityStatus.description}
                    </p>

                    <div
                      className={`mt-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[9px] ${securityStatus.badgeClass}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${securityStatus.dotClass}`}
                      />
                      {securityStatus.badge}
                    </div>
                  </div>

                  <SecurityGauge score={securityScore} />
                </div>
              </div>

              <a
                id="threats"
                href="/dashboard/threats"
                className="scroll-mt-24 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 transition hover:border-white/[0.13] hover:bg-white/[0.04]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/25">
                    Threats detected
                  </span>

                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-400/[0.07] text-sm text-red-300/80">
                    !
                  </span>
                </div>

                <div className="mt-7 text-4xl font-semibold">
                  {detectedThreats}
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      detectedThreats > 0
                        ? "bg-red-400"
                        : "bg-emerald-400"
                    }`}
                  />

                  <span
                    className={`text-[10px] ${
                      detectedThreats > 0
                        ? "text-red-300/70"
                        : "text-emerald-300/70"
                    }`}
                  >
                    {detectedThreats > 0
                      ? `${threatRate}% of scans flagged`
                      : "No threats detected"}
                  </span>
                </div>

                <div className="mt-6 border-t border-white/[0.07] pt-4 text-[9px] text-white/20">
                  Open Threat Center →
                </div>
              </a>

              <a
                href="/dashboard/scanner"
                className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 transition hover:border-white/[0.13] hover:bg-white/[0.04]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/25">
                    Security scans
                  </span>

                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-400/[0.07] text-sm text-blue-300/80">
                    ⌕
                  </span>
                </div>

                <div className="mt-7 text-4xl font-semibold">
                  {totalScans}
                </div>

                <div className="mt-2 text-[10px] text-white/25">
                  {totalScans === 0
                    ? "No scans recorded yet"
                    : `${safeScans} safe · ${detectedThreats} flagged`}
                </div>

                <div className="mt-6 border-t border-white/[0.07] pt-4 text-[9px] text-blue-300/60">
                  {totalScans === 0
                    ? "Start your first scan →"
                    : "Open Scan History →"}
                </div>
              </a>
            </div>

            {/* ================================================= */}
            {/* QUICK SCANNER + ADVISOR */}
            {/* ================================================= */}

            <div className="mt-6 grid gap-6 xl:grid-cols-3">
              <div
                id="scanner"
                className="scroll-mt-24 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 xl:col-span-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-400/[0.08] text-blue-300">
                      ⌕
                    </div>

                    <div>
                      <h2 className="font-semibold">
                        Quick Threat Scanner
                      </h2>

                      <p className="mt-1 text-[10px] text-white/25">
                        Analyze a suspicious URL with the Innovex
                        security engine.
                      </p>
                    </div>
                  </div>

                  <span className="hidden rounded-full border border-white/[0.07] px-3 py-1.5 text-[9px] font-medium tracking-wider text-white/20 sm:block">
                    URL ENGINE
                  </span>
                </div>

                <QuickScanner />

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <a
                    href="/dashboard/scanner"
                    className="rounded-xl border border-blue-400/10 bg-blue-400/[0.025] p-3 transition hover:bg-blue-400/[0.06]"
                  >
                    <div className="text-sm">🔗</div>

                    <div className="mt-1 text-[10px] font-medium text-white/60">
                      URL Scanner
                    </div>

                    <div className="mt-1 text-[9px] text-emerald-400/60">
                      Available
                    </div>
                  </a>

                  <a
                    href="/dashboard/email"
                    className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-3 transition hover:bg-white/[0.05]"
                  >
                    <div className="text-sm">📧</div>

                    <div className="mt-1 text-[10px] font-medium text-white/40">
                      Email Analyzer
                    </div>

                    <div className="mt-1 text-[9px] text-white/20">
                      Available
                    </div>
                  </a>

                  <a
                    href="/dashboard/sms"
                    className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-3 transition hover:bg-white/[0.05]"
                  >
                    <div className="text-sm">📱</div>

                    <div className="mt-1 text-[10px] font-medium text-white/40">
                      SMS Analyzer
                    </div>

                    <div className="mt-1 text-[9px] text-white/20">
                      Available
                    </div>
                  </a>
                </div>
              </div>

              <div
                id="advisor"
                className="scroll-mt-24 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-400/[0.08] text-lg">
                    ✦
                  </div>

                  <div>
                    <h2 className="font-semibold">
                      AI Security Advisor
                    </h2>

                    <p className="mt-1 text-[10px] text-white/25">
                      Intelligent security guidance
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-xl border border-white/[0.07] bg-black/20 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                    <span className="text-[9px] uppercase tracking-wider text-white/20">
                      Current assessment
                    </span>
                  </div>

                  <p className="text-[11px] leading-6 text-white/35">
                    {advisorAssessment}
                  </p>
                </div>

                <a
                  href="/dashboard/scanner"
                  className="mt-4 flex w-full items-center justify-center rounded-xl border border-white/[0.07] px-4 py-3 text-[10px] font-medium text-white/40 transition hover:bg-white/[0.05] hover:text-white"
                >
                  Analyze something →
                </a>
              </div>
            </div>

            {/* ================================================= */}
            {/* ACTIVITY + ANALYTICS */}
            {/* ================================================= */}

            <div className="mt-6 grid gap-6 lg:grid-cols-5">
              <div
                id="history"
                className="scroll-mt-24 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 lg:col-span-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">
                      Security Activity
                    </h2>

                    <p className="mt-1 text-[10px] text-white/25">
                      Recent security events and analysis activity
                    </p>
                  </div>

                  <a
                    href="/dashboard/history"
                    className="rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-[9px] text-white/30 transition hover:bg-white/[0.07] hover:text-white"
                  >
                    View history →
                  </a>
                </div>

                <div className="mt-7">
                  <div className="flex h-[175px] items-end gap-2 border-b border-white/[0.07] px-2">
                    {activityByDay.map((day) => {
                      const height =
                        day.count === 0
                          ? 4
                          : Math.max(
                              8,
                              (day.count / maxActivity) * 100
                            );

                      return (
                        <div
                          key={day.label}
                          className="group flex flex-1 items-end"
                          title={`${day.count} scan${
                            day.count === 1 ? "" : "s"
                          }`}
                        >
                          <div
                            className="w-full rounded-t-md bg-white/[0.08] transition group-hover:bg-blue-400/40"
                            style={{ height: `${height}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 grid grid-cols-7 text-center text-[8px] text-white/15">
                    {activityByDay.map((day) => (
                      <span key={day.label}>{day.label}</span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-5 text-[9px] text-white/20">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-sm bg-white/[0.12]" />
                    Security activity
                  </div>

                  <div className="text-white/15">
                    {totalScans === 0
                      ? "Scan activity will appear here."
                      : `${totalScans} total scan${
                          totalScans === 1 ? "" : "s"
                        } recorded`}
                  </div>
                </div>
              </div>

              <div
                id="analytics"
                className="scroll-mt-24 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 lg:col-span-2"
              >
                <h2 className="font-semibold">
                  Threat Overview
                </h2>

                <p className="mt-1 text-[10px] text-white/25">
                  Current threat distribution
                </p>

                <div className="mt-7 flex items-center justify-center">
                  <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-[18px] border-white/[0.05]">
                    <div className="text-center">
                      <div className="text-2xl font-semibold">
                        {detectedThreats}
                      </div>

                      <div className="mt-1 text-[8px] uppercase tracking-widest text-white/20">
                        threats
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-7 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-400/60" />

                      <span className="text-[10px] text-white/35">
                        Critical
                      </span>
                    </div>

                    <span className="text-[10px] text-white/20">
                      {severityCounts.Critical}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-orange-400/60" />

                      <span className="text-[10px] text-white/35">
                        High
                      </span>
                    </div>

                    <span className="text-[10px] text-white/20">
                      {severityCounts.High}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-yellow-400/60" />

                      <span className="text-[10px] text-white/35">
                        Medium
                      </span>
                    </div>

                    <span className="text-[10px] text-white/20">
                      {severityCounts.Medium}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400/60" />

                      <span className="text-[10px] text-white/35">
                        Low
                      </span>
                    </div>

                    <span className="text-[10px] text-white/20">
                      {severityCounts.Low}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ================================================= */}
            {/* LIVE SECURITY STATS */}
            {/* ================================================= */}

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <div className="text-[9px] uppercase tracking-[0.16em] text-white/20">
                  Average risk
                </div>
                <div className="mt-2 text-xl font-semibold">
                  {averageRisk}/100
                </div>
                <div className="mt-1 text-[9px] text-white/20">
                  Based on saved scans
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <div className="text-[9px] uppercase tracking-[0.16em] text-white/20">
                  Threat rate
                </div>
                <div className="mt-2 text-xl font-semibold">
                  {threatRate}%
                </div>
                <div className="mt-1 text-[9px] text-white/20">
                  Flagged scans
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <div className="text-[9px] uppercase tracking-[0.16em] text-white/20">
                  Avg. confidence
                </div>
                <div className="mt-2 text-xl font-semibold">
                  {averageConfidence}%
                </div>
                <div className="mt-1 text-[9px] text-white/20">
                  Available scan confidence
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <div className="text-[9px] uppercase tracking-[0.16em] text-white/20">
                  Safe scans
                </div>
                <div className="mt-2 text-xl font-semibold">
                  {safeScans}
                </div>
                <div className="mt-1 text-[9px] text-white/20">
                  Not flagged by the engine
                </div>
              </div>
            </div>

            {/* ================================================= */}
            {/* RECENT SCANS */}
            {/* ================================================= */}

            <div className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Recent scans</h2>
                  <p className="mt-1 text-[10px] text-white/25">
                    Latest saved security analysis
                  </p>
                </div>

                <a
                  href="/dashboard/history"
                  className="rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-[9px] text-white/30 transition hover:bg-white/[0.07] hover:text-white"
                >
                  View all →
                </a>
              </div>

              <div className="mt-5 divide-y divide-white/[0.06]">
                {userScans.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/[0.07] p-5 text-center text-[10px] text-white/20">
                    No scans recorded yet.
                  </div>
                ) : (
                  userScans.slice(0, 5).map((scan) => (
                    <div
                      key={scan.id}
                      className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-[11px] font-medium text-white/70">
                          {scan.input_value}
                        </div>
                        <div className="mt-1 text-[9px] text-white/20">
                          {scan.scan_type.toUpperCase()} ·{" "}
                          {new Date(scan.created_at).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-[9px] text-white/25">
                          Risk {scan.risk_score}/100
                        </span>

                        <span
                          className={`rounded-full border px-2 py-1 text-[8px] ${
                            scan.severity === "Critical"
                              ? "border-red-400/10 bg-red-400/[0.05] text-red-300/70"
                              : scan.severity === "High"
                                ? "border-orange-400/10 bg-orange-400/[0.05] text-orange-300/70"
                                : scan.severity === "Medium"
                                  ? "border-yellow-400/10 bg-yellow-400/[0.05] text-yellow-300/70"
                                  : "border-emerald-400/10 bg-emerald-400/[0.05] text-emerald-300/70"
                          }`}
                        >
                          {scan.severity}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ================================================= */}
            {/* RECOMMENDED ACTIONS */}
            {/* ================================================= */}

            <div className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">
                    Recommended Actions
                  </h2>

                  <p className="mt-1 text-[10px] text-white/25">
                    Simple actions to maintain your security posture
                  </p>
                </div>

                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-400/[0.06]">
                  ✦
                </span>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <a
                  href={
                    detectedThreats > 0
                      ? "/dashboard/threats"
                      : "/dashboard/scanner"
                  }
                  className="flex items-center gap-4 rounded-xl border border-white/[0.07] bg-white/[0.015] p-4 transition hover:bg-white/[0.045]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-400/[0.08]">
                    {detectedThreats > 0 ? "!" : "⌕"}
                  </div>

                  <div className="flex-1">
                    <p className="text-xs font-medium">
                      {recommendedActionTitle}
                    </p>

                    <p className="mt-1 text-[10px] text-white/20">
                      {recommendedActionDescription}
                    </p>
                  </div>

                  <span className="text-xs text-white/20">
                    →
                  </span>
                </a>

                <a
                  href="/dashboard/checkup"
                  className="flex items-center gap-4 rounded-xl border border-white/[0.07] bg-white/[0.015] p-4 transition hover:bg-white/[0.045]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-400/[0.08]">
                    ✓
                  </div>

                  <div className="flex-1">
                    <p className="text-xs font-medium">
                      Review security posture
                    </p>

                    <p className="mt-1 text-[10px] text-white/20">
                      Check your current account protection status.
                    </p>
                  </div>

                  <span className="text-xs text-white/20">
                    →
                  </span>
                </a>
              </div>
            </div>

            {/* ================================================= */}
            {/* SECURITY MODULES */}
            {/* ================================================= */}

            <div className="mt-6">
              <div className="mb-4">
                <div className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/20">
                  Security modules
                </div>

                <h2 className="mt-1 text-lg font-semibold">
                  Your protection toolkit
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {/* CONNECTED: Threat Intelligence */}
                <a
                  id="intelligence"
                  href="/dashboard/intelligence"
                  className="scroll-mt-24 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 transition hover:-translate-y-0.5 hover:border-white/[0.13] hover:bg-white/[0.045]"
                >
                  <span className="text-lg">🌐</span>

                  <h3 className="mt-4 text-sm font-medium">
                    Threat Intelligence
                  </h3>

                  <p className="mt-2 text-[10px] leading-5 text-white/20">
                    Connect trusted external intelligence sources to
                    enrich threat analysis.
                  </p>

                  <span className="mt-4 inline-block text-[9px] text-emerald-400/60">
                    Open module →
                  </span>
                </a>

                <a
                  id="email"
                  href="/dashboard/email"
                  className="scroll-mt-24 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 transition hover:-translate-y-0.5 hover:border-white/[0.13] hover:bg-white/[0.045]"
                >
                  <span className="text-lg">📧</span>

                  <h3 className="mt-4 text-sm font-medium">
                    Email Guard
                  </h3>

                  <p className="mt-2 text-[10px] leading-5 text-white/20">
                    Analyze suspicious emails, phishing indicators
                    and malicious links.
                  </p>

                  <span className="mt-4 inline-block text-[9px] text-white/20">
                    Available
                  </span>
                </a>

                <a
                  id="sms"
                  href="/dashboard/sms"
                  className="scroll-mt-24 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 transition hover:-translate-y-0.5 hover:border-white/[0.13] hover:bg-white/[0.045]"
                >
                  <span className="text-lg">📱</span>

                  <h3 className="mt-4 text-sm font-medium">
                    SMS Guard
                  </h3>

                  <p className="mt-2 text-[10px] leading-5 text-white/20">
                    Detect smishing, scam messages and suspicious
                    requests.
                  </p>

                  <span className="mt-4 inline-block text-[9px] text-white/20">
                    Available
                  </span>
                </a>

                <a
                  href="/dashboard/checkup"
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 transition hover:-translate-y-0.5 hover:border-white/[0.13] hover:bg-white/[0.045]"
                >
                  <span className="text-lg">🛡️</span>

                  <h3 className="mt-4 text-sm font-medium">
                    Security Checkup
                  </h3>

                  <p className="mt-2 text-[10px] leading-5 text-white/20">
                    Review your account protection and security
                    configuration.
                  </p>

                  <span className="mt-4 inline-block text-[9px] text-emerald-400/60">
                    Protection active
                  </span>
                </a>
              </div>
            </div>

            {/* ================================================= */}
            {/* SECURITY CHECKUP */}
            {/* ================================================= */}

            <div
              id="checkup"
              className="mt-6 scroll-mt-24 rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.018] p-6"
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/[0.08]">
                    🛡️
                  </div>

                  <div>
                    <h2 className="font-semibold">
                      Security Checkup
                    </h2>

                    <p className="mt-1 text-[10px] text-white/25">
                      Score {securityScore}/100 · {securityStatus.title}.
                    </p>
                  </div>
                </div>

                <a
                  href="#overview"
                  className="w-fit rounded-xl border border-white/[0.07] px-4 py-2.5 text-[10px] text-white/35 transition hover:bg-white/[0.05] hover:text-white"
                >
                  Review protection →
                </a>
              </div>
            </div>

            <div id="notifications" className="scroll-mt-24" />

            <div id="settings" className="scroll-mt-24" />

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
        </section>
      </div>
    </main>
  );
}