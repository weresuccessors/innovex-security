const features = [
  {
    icon: "🔍",
    title: "Threat Detection",
    description:
      "Analyze suspicious URLs, messages, emails and digital activity for potential threats.",
  },
  {
    icon: "🧠",
    title: "AI Security Intelligence",
    description:
      "Combine AI analysis, security rules and threat intelligence to understand digital risks.",
  },
  {
    icon: "🛡️",
    title: "Real-Time Protection",
    description:
      "Get actionable security recommendations before a suspicious threat becomes a problem.",
  },
];

const pipeline = [
  "Detect",
  "Analyze",
  "Explain",
  "Respond",
  "Protect",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      {/* Navigation */}
      <nav className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl text-black">
              🛡️
            </div>

            <div>
              <div className="text-lg font-bold tracking-tight">
                Innovex Security
              </div>
              <div className="text-xs text-white/40">
                Personal AI Security Center
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-8 text-sm text-white/60 md:flex">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#how-it-works" className="transition hover:text-white">
              How it works
            </a>
            <a href="#about" className="transition hover:text-white">
              About
            </a>
          </div>

          <a
            href="/login"
            className="rounded-lg border border-white/15 px-5 py-2.5 text-sm font-medium transition hover:bg-white hover:text-black"
          >
            Sign in
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute left-1/2 top-20 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-24 md:pb-32 md:pt-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/60">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              AI-powered security intelligence
            </div>

            <h1 className="text-5xl font-bold tracking-tight md:text-7xl">
              Your Personal
              <span className="block text-white/50">
                AI Security Center
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-white/50 md:text-lg">
              Detect phishing, scams, suspicious messages and other digital
              threats with intelligent analysis that explains what is happening
              and what you should do next.
            </p>

            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="/login"
                className="rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                Get Protected
              </a>

              <a
                href="#how-it-works"
                className="rounded-xl border border-white/15 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
              >
                Explore Security
              </a>
            </div>
          </div>

          {/* Security preview */}
          <div className="mx-auto mt-20 max-w-5xl rounded-2xl border border-white/10 bg-white/[0.025] p-3 shadow-2xl">
            <div className="rounded-xl border border-white/10 bg-[#090c12] p-6 md:p-8">
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                <div>
                  <div className="text-sm text-white/40">
                    Security Center
                  </div>

                  <div className="mt-2 text-2xl font-semibold">
                    Good afternoon, Raj 👋
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-5 py-4">
                  <div className="text-xs uppercase tracking-wider text-white/40">
                    Security Score
                  </div>

                  <div className="mt-1 flex items-end gap-2">
                    <span className="text-4xl font-bold">92</span>
                    <span className="mb-1 text-sm text-emerald-400">
                      Well protected
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-3 md:grid-cols-3">
                {[
                  ["🔍", "Threat Scanner"],
                  ["🔗", "Link Safety"],
                  ["📧", "Email Guard"],
                  ["📱", "SMS Guard"],
                  ["🧠", "AI Advisor"],
                  ["🚨", "Threat Center"],
                ].map(([icon, title]) => (
                  <div
                    key={title}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-4 transition hover:bg-white/[0.05]"
                  >
                    <div className="text-xl">{icon}</div>
                    <div className="mt-3 text-sm font-medium">{title}</div>
                    <div className="mt-1 text-xs text-white/35">
                      Security module
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="max-w-2xl">
            <div className="text-sm font-medium text-white/40">
              SECURITY INTELLIGENCE
            </div>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Understand threats before they become problems.
            </h2>

            <p className="mt-5 leading-7 text-white/45">
              Innovex Security brings detection, intelligence and explainable
              security analysis into one personal security center.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-white/10 bg-white/[0.025] p-7"
              >
                <div className="text-3xl">{feature.icon}</div>

                <h3 className="mt-6 text-lg font-semibold">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-white/40">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="text-center">
            <div className="text-sm font-medium text-white/40">
              DETECTION PIPELINE
            </div>

            <h2 className="mt-3 text-3xl font-semibold">
              From suspicious signal to clear action.
            </h2>
          </div>

          <div className="mx-auto mt-14 flex max-w-5xl flex-col items-center gap-3 md:flex-row md:justify-center">
            {pipeline.map((step, index) => (
              <div key={step} className="flex items-center gap-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-4 text-sm font-medium">
                  <span className="mr-3 text-white/30">
                    0{index + 1}
                  </span>
                  {step}
                </div>

                {index < pipeline.length - 1 && (
                  <span className="hidden text-white/20 md:block">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-20 text-center">
          <div className="text-lg font-semibold">Team Innovex</div>

          <p className="mt-3 text-sm text-white/40">
            Building practical AI-powered cybersecurity solutions for
            real-world digital threats.
          </p>

          <p className="mt-8 text-xs text-white/25">
            Designed & Built by Team Innovex
          </p>
        </div>
      </section>
    </main>
  );
}