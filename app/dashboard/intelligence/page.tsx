"use client";

import { useState } from "react";

type IntelligenceResult = {
  id: string | null;
  reference: string | null;
  url: string;
  status: string | null;
  host: string | null;
  dateAdded: string | null;
  lastOnline: string | null;
  threat: string | null;
  blacklists: unknown;
  reporter: string | null;
  reportedToHostingProvider: string | null;
  takedownTimeSeconds: number | null;
  tags: string[];
  payloads: unknown[];
};

type ApiResponse = {
  success?: boolean;
  found?: boolean;
  provider?: string;
  message?: string;
  error?: string;
  queryStatus?: string;
  input?: string;
  providerStatus?: number;
  intelligence?: IntelligenceResult;
};

export default function ThreatIntelligencePage() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] =
    useState<IntelligenceResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [provider, setProvider] = useState("");
  const [httpStatus, setHttpStatus] = useState<number | null>(
    null,
  );

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();

    const value = query.trim();

    setMessage("");
    setResult(null);
    setNotFound(false);
    setProvider("");
    setHttpStatus(null);

    if (!value) {
      setMessage(
        "Enter a URL to investigate.",
      );
      return;
    }

    setSearching(true);

    try {
      console.log(
        "[Innovex Threat Intelligence] Sending lookup:",
        value,
      );

      const response = await fetch(
        "/api/threat-intelligence",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            input: value,
          }),
          cache: "no-store",
        },
      );

      setHttpStatus(response.status);

      /*
       * IMPORTANT:
       * Read the response as text first.
       *
       * This prevents Safari from throwing:
       * "The string did not match the expected pattern"
       * when the server returns something that isn't JSON.
       */
      const responseText = await response.text();

      console.log(
        "[Innovex Threat Intelligence] HTTP status:",
        response.status,
      );

      console.log(
        "[Innovex Threat Intelligence] Raw response:",
        responseText,
      );

      let data: ApiResponse;

      try {
        data = JSON.parse(responseText) as ApiResponse;
      } catch (parseError) {
        console.error(
          "[Innovex Threat Intelligence] JSON parse error:",
          parseError,
        );

        setMessage(
          `The server returned an unexpected response (HTTP ${response.status}). Check the Terminal running Next.js for the exact API error.`,
        );

        return;
      }

      if (!response.ok || data.success === false) {
        setMessage(
          data.error ||
            data.message ||
            `Threat-intelligence request failed (HTTP ${response.status}).`,
        );

        return;
      }

      setProvider(
        data.provider || "URLhaus",
      );

      if (
        data.found &&
        data.intelligence
      ) {
        setResult(data.intelligence);

        setMessage(
          "Live threat-intelligence data was returned by URLhaus.",
        );

        return;
      }

      setNotFound(true);

      setMessage(
        data.message ||
          "URLhaus returned no matching malware URL.",
      );
    } catch (error) {
      console.error(
        "[Innovex Threat Intelligence] Request error:",
        error,
      );

      const errorText =
        error instanceof Error
          ? error.message
          : String(error);

      setMessage(
        `Request failed: ${errorText}`,
      );
    } finally {
      setSearching(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        {/* ===================================================== */}
        {/* HEADER */}
        {/* ===================================================== */}

        <div className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-xl">
              🌐
            </div>

            <div>
              <p className="text-sm font-medium text-cyan-400">
                INNOVEX SECURITY
              </p>

              <h1 className="text-3xl font-bold tracking-tight">
                Threat Intelligence
              </h1>
            </div>
          </div>

          <p className="max-w-3xl text-sm leading-6 text-slate-400">
            Investigate suspicious URLs using trusted external
            threat-intelligence sources and return verified intelligence
            results.
          </p>
        </div>

        {/* ===================================================== */}
        {/* CONNECTION STATUS */}
        {/* ===================================================== */}

        <section className="mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-lg">
              ✓
            </div>

            <div>
              <h2 className="font-semibold text-emerald-300">
                Live intelligence connected
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-400">
                Innovex Security uses the URLhaus threat-intelligence
                API for malicious-URL lookups. Results displayed after
                an investigation come from the external provider.
              </p>
            </div>
          </div>
        </section>

        {/* ===================================================== */}
        {/* SEARCH */}
        {/* ===================================================== */}

        <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">
              Investigate an Indicator
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Enter a suspicious URL and check whether URLhaus has
              recorded it as a malware-distribution URL.
            </p>
          </div>

          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-3 md:flex-row"
          >
            <input
              type="text"
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="https://example.com"
              className="h-12 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50"
            />

            <button
              type="submit"
              disabled={searching}
              className="h-12 rounded-xl bg-cyan-400 px-6 text-sm font-semibold text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {searching
                ? "Checking..."
                : "Investigate"}
            </button>
          </form>

          {/* HTTP STATUS */}
          {httpStatus !== null && (
            <div className="mt-3 text-[10px] text-white/20">
              API response status: HTTP {httpStatus}
            </div>
          )}

          {/* MESSAGE */}
          {message && (
            <div
              className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                result
                  ? "border-red-400/20 bg-red-400/[0.04] text-red-300"
                  : notFound
                    ? "border-emerald-400/20 bg-emerald-400/[0.04] text-emerald-300"
                    : "border-white/10 bg-black/20 text-slate-300"
              }`}
            >
              {message}
            </div>
          )}
        </section>

        {/* ===================================================== */}
        {/* LIVE RESULT */}
        {/* ===================================================== */}

        {result && (
          <section className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/[0.025] p-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-red-300/60">
                  Threat intelligence match
                </div>

                <h2 className="mt-2 text-xl font-semibold text-red-200">
                  Malicious URL Found
                </h2>

                <p className="mt-2 break-all text-sm text-slate-400">
                  {result.url}
                </p>
              </div>

              <div className="w-fit rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1.5 text-xs font-medium text-red-300">
                VERIFIED INTELLIGENCE
              </div>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <InfoCard
                label="Provider"
                value={provider || "URLhaus"}
              />

              <InfoCard
                label="URL Status"
                value={result.status || "Unknown"}
              />

              <InfoCard
                label="Threat"
                value={result.threat || "Unknown"}
              />

              <InfoCard
                label="Host"
                value={result.host || "Unknown"}
              />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <DetailCard
                label="URLhaus ID"
                value={result.id || "Not available"}
              />

              <DetailCard
                label="Reporter"
                value={result.reporter || "Not available"}
              />

              <DetailCard
                label="Date Added"
                value={result.dateAdded || "Not available"}
              />

              <DetailCard
                label="Last Online"
                value={result.lastOnline || "Not available"}
              />

              <DetailCard
                label="Reported to Hosting Provider"
                value={
                  result.reportedToHostingProvider ||
                  "Not available"
                }
              />

              <DetailCard
                label="Takedown Time"
                value={
                  result.takedownTimeSeconds !== null
                    ? `${result.takedownTimeSeconds} seconds`
                    : "Not available"
                }
              />
            </div>

            {result.tags.length > 0 && (
              <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-5">
                <div className="text-xs font-medium uppercase tracking-[0.15em] text-white/30">
                  Intelligence Tags
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {result.tags.map(
                    (tag, index) => (
                      <span
                        key={`${tag}-${index}`}
                        className="rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] px-3 py-1.5 text-xs text-cyan-300"
                      >
                        {tag}
                      </span>
                    ),
                  )}
                </div>
              </div>
            )}

            <div className="mt-5 rounded-xl border border-yellow-400/15 bg-yellow-400/[0.035] p-5">
              <div className="flex items-start gap-3">
                <div className="text-lg">
                  ⚠️
                </div>

                <div>
                  <h3 className="font-semibold text-yellow-300">
                    Recommended Response
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Treat this URL as malicious based on the external
                    intelligence match. Do not open the URL, download
                    files from it, or provide credentials or personal
                    information.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ===================================================== */}
        {/* CATEGORIES */}
        {/* ===================================================== */}

        <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-cyan-400/10 bg-white/[0.03] p-5">
            <div className="mb-4 text-2xl">
              🔗
            </div>

            <h3 className="font-semibold">
              Malicious URLs
            </h3>

            <p className="mt-2 text-sm leading-5 text-slate-500">
              Check suspicious URLs against live URLhaus
              threat-intelligence data.
            </p>

            <div className="mt-4 text-xs text-emerald-400/80">
              ● Connected
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-4 text-2xl">
              🌍
            </div>

            <h3 className="font-semibold">
              Domain Intelligence
            </h3>

            <p className="mt-2 text-sm leading-5 text-slate-500">
              Domain investigation can be expanded with additional
              intelligence providers.
            </p>

            <div className="mt-4 text-xs text-yellow-400/70">
              ● Provider expansion
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-4 text-2xl">
              📡
            </div>

            <h3 className="font-semibold">
              IP Intelligence
            </h3>

            <p className="mt-2 text-sm leading-5 text-slate-500">
              IP reputation and threat investigation can be connected
              through additional intelligence feeds.
            </p>

            <div className="mt-4 text-xs text-yellow-400/70">
              ● Provider expansion
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-4 text-2xl">
              🧬
            </div>

            <h3 className="font-semibold">
              Hash Intelligence
            </h3>

            <p className="mt-2 text-sm leading-5 text-slate-500">
              File and malware hash intelligence can be added through
              dedicated malware-intelligence providers.
            </p>

            <div className="mt-4 text-xs text-yellow-400/70">
              ● Provider expansion
            </div>
          </div>
        </section>

        {/* ===================================================== */}
        {/* PIPELINE */}
        {/* ===================================================== */}

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Threat Intelligence Pipeline
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              The live intelligence workflow used by Innovex Security.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            <PipelineStep
              number="01"
              title="Indicator"
              active
            />

            <PipelineStep
              number="02"
              title="URLhaus Feed"
              active
            />

            <PipelineStep
              number="03"
              title="Reputation"
              active
            />

            <PipelineStep
              number="04"
              title="Risk Engine"
              active
            />

            <PipelineStep
              number="05"
              title="Security Result"
              active
            />
          </div>
        </section>

        {/* ===================================================== */}
        {/* NOTE */}
        {/* ===================================================== */}

        <div className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] px-5 py-4">
          <p className="text-xs leading-5 text-slate-500">
            Innovex Security currently uses URLhaus for live
            malicious-URL intelligence. A “no match” result means
            URLhaus did not return a matching malware URL; it does not
            prove that a URL is completely safe. Phishing and other
            threat categories may require additional intelligence
            providers.
          </p>
        </div>

        {/* ===================================================== */}
        {/* FOOTER */}
        {/* ===================================================== */}

        <footer className="mt-10 border-t border-white/[0.07] py-7">
          <div className="flex flex-col justify-between gap-3 text-xs text-white/20 sm:flex-row">
            <span>
              Innovex Security — Your Personal AI Security Center
            </span>

            <span>
              Detect. Analyze. Respond. Protect.
            </span>
          </div>
        </footer>
      </div>
    </main>
  );
}

function PipelineStep({
  number,
  title,
  active = false,
}: {
  number: string;
  title: string;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        active
          ? "border-cyan-400/15 bg-cyan-400/[0.025]"
          : "border-white/10 bg-black/20"
      }`}
    >
      <div
        className={`mb-3 text-xs font-semibold tracking-widest ${
          active
            ? "text-cyan-400"
            : "text-white/30"
        }`}
      >
        {number}
      </div>

      <div className="text-sm font-medium text-slate-200">
        {title}
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="text-xs uppercase tracking-[0.14em] text-white/25">
        {label}
      </div>

      <div className="mt-2 break-all text-sm font-medium text-slate-200">
        {value}
      </div>
    </div>
  );
}

function DetailCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="text-xs text-white/25">
        {label}
      </div>

      <div className="mt-2 break-all text-sm text-slate-300">
        {value}
      </div>
    </div>
  );
}