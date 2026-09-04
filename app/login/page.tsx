"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setErrorMessage("");

    const form = new FormData(event.currentTarget);

    const email = String(form.get("email") || "")
      .trim()
      .toLowerCase();

    const password = String(form.get("password") || "");

    if (!email || !password) {
      setErrorMessage("Please enter your email and password.");
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <div className="flex min-h-screen">

        {/* ================================================= */}
        {/* LEFT SIDE — SECURITY BRANDING */}
        {/* ================================================= */}

        <section className="relative hidden overflow-hidden border-r border-white/10 lg:flex lg:w-1/2">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative flex w-full flex-col justify-between p-12 xl:p-16">

            {/* Logo */}

            <a href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl text-black">
                🛡️
              </div>

              <div>
                <div className="text-lg font-bold">
                  Innovex Security
                </div>

                <div className="text-xs text-white/40">
                  Personal AI Security Center
                </div>
              </div>
            </a>

            {/* Main message */}

            <div className="max-w-xl">

              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/50">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Your security starts here
              </div>

              <h1 className="text-4xl font-semibold leading-tight xl:text-5xl">
                One center.
                <br />

                <span className="text-white/40">
                  Smarter digital protection.
                </span>
              </h1>

              <p className="mt-6 max-w-lg text-sm leading-7 text-white/40">
                Detect suspicious links, phishing attempts, scams and
                other digital threats with intelligent security analysis.
              </p>

              {/* Security features */}

              <div className="mt-10 grid grid-cols-2 gap-3">

                {[
                  ["🔍", "Threat Detection"],
                  ["🧠", "AI Intelligence"],
                  ["🚨", "Threat Alerts"],
                  ["🛡️", "Security Protection"],
                ].map(([icon, title]) => (
                  <div
                    key={title}
                    className="rounded-xl border border-white/10 bg-white/[0.025] p-4"
                  >
                    <div className="text-lg">
                      {icon}
                    </div>

                    <div className="mt-2 text-xs font-medium text-white/70">
                      {title}
                    </div>
                  </div>
                ))}

              </div>
            </div>

            {/* Footer */}

            <div className="text-xs text-white/25">
              Designed & Built by Team Innovex
            </div>

          </div>
        </section>

        {/* ================================================= */}
        {/* RIGHT SIDE — LOGIN */}
        {/* ================================================= */}

        <section className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
          <div className="w-full max-w-md">

            {/* Mobile logo */}

            <div className="mb-10 flex items-center gap-3 lg:hidden">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg text-black">
                🛡️
              </div>

              <div>
                <div className="font-bold">
                  Innovex Security
                </div>

                <div className="text-xs text-white/40">
                  Personal AI Security Center
                </div>
              </div>

            </div>

            {/* Heading */}

            <div>

              <h2 className="text-3xl font-semibold tracking-tight">
                Welcome back
              </h2>

              <p className="mt-2 text-sm text-white/40">
                Sign in to access your Security Center.
              </p>

            </div>

            {/* Google */}

            <button
              type="button"
              className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3.5 text-sm font-medium transition hover:bg-white/[0.07]"
            >
              <span className="text-base">
                G
              </span>

              Continue with Google
            </button>

            {/* Divider */}

            <div className="my-7 flex items-center gap-4">

              <div className="h-px flex-1 bg-white/10" />

              <span className="text-xs text-white/25">
                OR
              </span>

              <div className="h-px flex-1 bg-white/10" />

            </div>

            {/* ================================================= */}
            {/* LOGIN FORM */}
            {/* ================================================= */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* Email */}

              <div>

                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-white/70"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/30 focus:bg-white/[0.05]"
                />

              </div>

              {/* Password */}

              <div>

                <div className="mb-2 flex items-center justify-between">

                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-white/70"
                  >
                    Password
                  </label>

                  <a
                    href="/forgot-password"
                    className="text-xs text-white/40 transition hover:text-white"
                  >
                    Forgot password?
                  </a>

                </div>

                <div className="relative">

                  <input
                    id="password"
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 pr-20 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/30 focus:bg-white/[0.05]"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-2 text-xs text-white/35 hover:text-white"
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </button>

                </div>

              </div>

              {/* Error message */}

              {errorMessage && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">

                  <p className="text-xs leading-5 text-red-300">
                    {errorMessage}
                  </p>

                </div>
              )}

              {/* Remember me */}

              <label className="flex cursor-pointer items-center gap-3">

                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) =>
                    setRememberMe(event.target.checked)
                  }
                  className="h-4 w-4 rounded border-white/20 bg-white/5"
                />

                <span className="text-xs text-white/40">
                  Remember me
                </span>

              </label>

              {/* Submit */}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Signing in..."
                  : "Sign in"}
              </button>

            </form>

            {/* Create account */}

            <p className="mt-8 text-center text-sm text-white/35">

              Don't have an account?{" "}

              <a
                href="/signup"
                className="font-medium text-white/75 transition hover:text-white"
              >
                Create account
              </a>

            </p>

            {/* Security note */}

            <div className="mt-10 rounded-xl border border-white/10 bg-white/[0.02] p-4">

              <div className="flex gap-3">

                <span className="text-sm">
                  🔒
                </span>

                <p className="text-xs leading-5 text-white/30">
                  Your account security is protected by Innovex
                  Security. Authentication and session protection
                  are powered by Supabase.
                </p>

              </div>

            </div>

          </div>
        </section>

      </div>
    </main>
  );
}