import Link from "next/link";

const teamMembers = [
  {
    name: "Abir Majumdar",
    role: "Team Innovex",
    initials: "AM",
  },
  {
    name: "Sayan Senapati",
    role: "Team Innovex",
    initials: "SS",
  },
  {
    name: "Aniket Das",
    role: "Team Innovex",
    initials: "AD",
  },
  {
    name: "Dipsikha Bardhan",
    role: "Team Innovex",
    initials: "DB",
  },
  {
    name: "Vaishnavi Dubey",
    role: "Team Innovex",
    initials: "VD",
  },
  {
    name: "Raj Kumar Goala",
    role: "Team Innovex",
    initials: "RG",
  },
];

const capabilities = [
  {
    icon: "⌁",
    title: "Threat Detection",
    description:
      "Identify suspicious URLs, emails, SMS messages, and digital attack indicators using structured security analysis.",
  },
  {
    icon: "◉",
    title: "Risk Analysis",
    description:
      "Convert security indicators into understandable risk scores, severity levels, confidence, and actionable recommendations.",
  },
  {
    icon: "✦",
    title: "Threat Intelligence",
    description:
      "Use legitimate external threat intelligence to strengthen detection when supported by the available intelligence sources.",
  },
  {
    icon: "⚡",
    title: "Real-Time Response",
    description:
      "Help users understand what to do when a suspicious or dangerous digital threat is detected.",
  },
];

const pipeline = [
  {
    number: "01",
    title: "Detect",
    description: "Identify suspicious digital activity and security indicators.",
  },
  {
    number: "02",
    title: "Analyze",
    description: "Evaluate the evidence and calculate the associated risk.",
  },
  {
    number: "03",
    title: "Respond",
    description: "Provide clear recommendations for handling the threat.",
  },
  {
    number: "04",
    title: "Protect",
    description: "Help users improve their security awareness and posture.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-220px] h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[140px]" />
        <div className="absolute bottom-[-220px] right-[-120px] h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[140px]" />
      </div>

      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#05070b]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 transition hover:opacity-90"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-lg font-bold text-cyan-300">
              I
            </div>

            <div>
              <p className="text-sm font-semibold tracking-wide text-white">
                INNOVEX
              </p>
              <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-cyan-300">
                Security
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard"
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-white"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <div className="relative mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-7 shadow-2xl shadow-black/20 lg:p-12">
          <div className="absolute right-[-80px] top-[-80px] h-64 w-64 rounded-full border border-cyan-400/10 bg-cyan-400/[0.03]" />
          <div className="absolute bottom-[-120px] left-[-100px] h-72 w-72 rounded-full border border-blue-500/10 bg-blue-500/[0.03]" />

          <div className="relative max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.8)]" />
              About Innovex Security
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Your Personal{" "}
              <span className="text-cyan-300">AI Security Center</span>
            </h1>

            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-400 sm:text-lg">
              Innovex Security is an AI-powered security intelligence platform
              designed to help users detect, understand, and respond to
              digital threats before they become serious security incidents.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300">
                Detect
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300">
                Analyze
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300">
                Respond
              </span>
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">
                Protect
              </span>
            </div>
          </div>
        </section>

        {/* What is Innovex */}
        <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-7 lg:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
              What is Innovex Security?
            </p>

            <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
              Security intelligence made easier to understand.
            </h2>

            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-400">
              <p>
                Digital threats can appear in everyday communication: a
                suspicious website, a convincing email, a fraudulent SMS, or
                an urgent request asking for sensitive information.
              </p>

              <p>
                Innovex Security brings multiple security analysis capabilities
                together in one personal security center. Instead of simply
                telling users that something is dangerous, the platform is
                designed to show the risk, explain the indicators, and provide
                a practical next step.
              </p>

              <p>
                The goal is simple: make security intelligence more accessible
                while helping users make safer decisions online.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-cyan-400/15 bg-cyan-400/[0.045] p-7 lg:p-9">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-xl text-cyan-300">
              🛡
            </div>

            <h3 className="mt-5 text-xl font-bold text-white">
              Our Mission
            </h3>

            <p className="mt-3 text-sm leading-7 text-slate-400">
              Build a security platform that turns complex threat signals into
              clear, understandable, and actionable protection for everyday
              digital users.
            </p>
          </div>
        </section>

        {/* Problem */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.035] p-7 lg:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
            The Problem We Solve
          </p>

          <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
            Modern threats are becoming harder to recognize.
          </h2>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: "🔗",
                title: "Malicious Links",
                text: "Suspicious URLs can imitate legitimate services and hide dangerous destinations.",
              },
              {
                icon: "✉",
                title: "Phishing Emails",
                text: "Attackers use urgency, impersonation, and social engineering to manipulate users.",
              },
              {
                icon: "▣",
                title: "Smishing",
                text: "Fraudulent SMS messages can request OTPs, PINs, payments, or sensitive information.",
              },
              {
                icon: "⚠",
                title: "Digital Scams",
                text: "Users may encounter convincing messages designed to create fear, urgency, or false rewards.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-black/20 p-5"
              >
                <div className="text-2xl">{item.icon}</div>
                <h3 className="mt-4 font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mt-8">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
              How It Works
            </p>

            <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
              Detect. Analyze. Respond. Protect.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {pipeline.map((item) => (
              <div
                key={item.number}
                className="group rounded-3xl border border-white/10 bg-white/[0.035] p-6 transition hover:-translate-y-1 hover:border-cyan-400/20 hover:bg-cyan-400/[0.04]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-[0.2em] text-cyan-300">
                    {item.number}
                  </span>

                  <span className="h-2 w-2 rounded-full bg-cyan-300 opacity-70 group-hover:opacity-100" />
                </div>

                <h3 className="mt-7 text-xl font-bold text-white">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Capabilities */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.035] p-7 lg:p-9">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Security Capabilities
            </p>

            <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
              One security center. Multiple layers of analysis.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {capabilities.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-black/20 p-6"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-lg text-cyan-300">
                  {item.icon}
                </div>

                <h3 className="mt-5 text-lg font-semibold text-white">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Security Philosophy */}
        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-7 lg:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Our Approach
            </p>

            <h2 className="mt-3 text-2xl font-bold text-white">
              Explain the risk, not just the result.
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-400">
              Security decisions become more useful when users can understand
              why something was flagged. Innovex Security focuses on observable
              indicators, risk levels, confidence, and recommendations so that
              users can make informed decisions.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-7 lg:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Transparency
            </p>

            <h2 className="mt-3 text-2xl font-bold text-white">
              Security should be understandable.
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-400">
              Results are presented with clear indicators and recommendations.
              External threat intelligence is identified separately from local
              security analysis so users can understand what evidence
              contributed to a result.
            </p>
          </div>
        </section>

        {/* Future */}
        <section className="mt-8 overflow-hidden rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-cyan-400/[0.08] via-white/[0.025] to-blue-500/[0.06] p-7 lg:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
            Future Possibilities
          </p>

          <h2 className="mt-3 max-w-3xl text-2xl font-bold text-white sm:text-3xl">
            Building toward a more intelligent personal security ecosystem.
          </h2>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
            Innovex Security can continue evolving with stronger AI-assisted
            security guidance, broader threat intelligence, deeper security
            analytics, improved incident response, device and session
            protection, and additional tools that help users stay safer in a
            constantly changing digital environment.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            {[
              "AI Security Advisor",
              "Advanced Threat Intelligence",
              "Security Analytics",
              "Incident Response",
              "Device Security",
              "Continuous Protection",
            ].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs font-medium text-slate-300"
              >
                {item}
              </span>
            ))}
          </div>
        </section>

        {/* Team */}
        <section className="mt-8">
          <div className="mb-7">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Team Innovex
            </p>

            <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
              Designed & Built by Team Innovex
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              A collaborative team focused on building practical technology
              for a safer digital future.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teamMembers.map((member) => (
              <div
                key={member.name}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-cyan-400/20 hover:bg-cyan-400/[0.035]"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-sm font-bold text-cyan-300">
                  {member.initials}
                </div>

                <div>
                  <h3 className="font-semibold text-white">{member.name}</h3>
                  <p className="mt-1 text-xs text-slate-500">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.035] p-7 text-center lg:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-2xl text-cyan-300">
            🛡️
          </div>

          <h2 className="mt-5 text-2xl font-bold text-white">
            Stay aware. Stay protected.
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
            Explore your security center and use Innovex Security to
            understand suspicious digital activity before taking action.
          </p>

          <Link
            href="/dashboard"
            className="mt-7 inline-flex items-center justify-center rounded-xl bg-cyan-400 px-6 py-3 text-sm font-bold text-[#041014] transition hover:bg-cyan-300"
          >
            Open Security Center →
          </Link>
        </section>

        {/* Footer */}
        <footer className="mt-12 border-t border-white/10 pt-8">
          <div className="flex flex-col gap-5 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <div>
              <p className="text-sm font-semibold text-white">
                Innovex Security
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Your Personal AI Security Center
              </p>
            </div>

            <div className="text-xs text-slate-600">
              <p>Detect. Analyze. Respond. Protect.</p>
              <p className="mt-1">© 2026 Team Innovex</p>
            </div>
          </div>

          <div className="mt-6 text-center text-[11px] text-slate-700">
            Designed & Built by Team Innovex
          </div>
        </footer>
      </div>
    </main>
  );
}
