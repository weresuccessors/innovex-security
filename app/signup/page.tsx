"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase-client";

export default function SignupPage() {
  const supabase = createClient();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess(false);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setError("Please enter your full name.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { data, error: signupError } =
      await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: trimmedName,
          },
        },
      });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    /*
     * When email confirmation is enabled in Supabase,
     * a new user normally needs to verify their email
     * before accessing the authenticated application.
     */
    if (data.user) {
      setSuccess(true);
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <div className="flex min-h-screen">

        {/* =========================================================
            LEFT PANEL
        ========================================================== */}
        <section className="relative hidden overflow-hidden border-r border-white/10 lg:flex lg:w-[42%]">
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
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/50">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Build your security profile
              </div>

              <h1 className="text-4xl font-semibold leading-tight xl:text-5xl">
                Start protecting
                <br />
                <span className="text-white/40">
                  your digital life.
                </span>
              </h1>

              <p className="mt-6 max-w-lg text-sm leading-7 text-white/40">
                Create your Innovex Security account and get one
                personalized center for detecting, analyzing and
                responding to digital threats.
              </p>

              <div className="mt-10 space-y-3">
                {[
                  ["01", "Personalized Security Center"],
                  ["02", "AI-powered threat analysis"],
                  ["03", "Security alerts and recommendations"],
                ].map(([number, text]) => (
                  <div
                    key={number}
                    className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.025] p-4"
                  >
                    <span className="text-xs text-white/25">
                      {number}
                    </span>

                    <span className="text-sm text-white/60">
                      {text}
                    </span>
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

        {/* =========================================================
            REGISTRATION PANEL
        ========================================================== */}
        <section className="flex w-full items-center justify-center px-6 py-12 lg:w-[58%]">
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

            {/* =====================================================
                SUCCESS STATE
            ====================================================== */}
            {success ? (
              <div>
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-2xl">
                  ✓
                </div>

                <h2 className="text-3xl font-semibold tracking-tight">
                  Check your email
                </h2>

                <p className="mt-3 text-sm leading-6 text-white/40">
                  Your Innovex Security account has been created.
                  We sent a verification link to:
                </p>

                <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
                  <p className="break-all text-sm font-medium text-white">
                    {email}
                  </p>
                </div>

                <div className="mt-6 rounded-xl border border-cyan-400/10 bg-cyan-400/[0.03] p-4">
                  <div className="flex gap-3">
                    <span className="text-sm">
                      📧
                    </span>

                    <p className="text-xs leading-5 text-white/40">
                      Open the verification email and click the
                      confirmation link. After verification, you can
                      sign in and access your Personal AI Security
                      Center.
                    </p>
                  </div>
                </div>

                <a
                  href="/login"
                  className="mt-7 flex w-full items-center justify-center rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90"
                >
                  Go to sign in
                </a>

                <p className="mt-6 text-center text-xs text-white/25">
                  Didn't receive the email? Check your spam or junk
                  folder.
                </p>
              </div>
            ) : (
              <>
                {/* Heading */}
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight">
                    Create your account
                  </h2>

                  <p className="mt-2 text-sm text-white/40">
                    Set up your personal security profile.
                  </p>
                </div>

                {/* Google */}
                <button
                  type="button"
                  disabled
                  className="mt-8 flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3.5 text-sm font-medium text-white/40"
                >
                  <span className="font-semibold text-white/60">
                    G
                  </span>

                  Continue with Google
                  <span className="text-[10px] text-white/20">
                    Coming soon
                  </span>
                </button>

                {/* Divider */}
                <div className="my-7 flex items-center gap-4">
                  <div className="h-px flex-1 bg-white/10" />

                  <span className="text-xs text-white/25">
                    OR
                  </span>

                  <div className="h-px flex-1 bg-white/10" />
                </div>

                {/* Error */}
                {error && (
                  <div className="mb-5 rounded-xl border border-red-400/20 bg-red-400/[0.05] p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-sm text-red-400">
                        !
                      </span>

                      <p className="text-xs leading-5 text-red-300/80">
                        {error}
                      </p>
                    </div>
                  </div>
                )}

                {/* Form */}
                <form
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  {/* Full name */}
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-2 block text-sm font-medium text-white/70"
                    >
                      Full name
                    </label>

                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Your full name"
                      value={name}
                      onChange={(event) =>
                        setName(event.target.value)
                      }
                      required
                      disabled={loading}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/30 focus:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

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
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      required
                      disabled={loading}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/30 focus:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-50"
                    />

                    <p className="mt-2 text-xs text-white/25">
                      We'll send a verification link to this address.
                    </p>
                  </div>

                  {/* Password */}
                  <div>
                    <label
                      htmlFor="password"
                      className="mb-2 block text-sm font-medium text-white/70"
                    >
                      Password
                    </label>

                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={
                          showPassword ? "text" : "password"
                        }
                        autoComplete="new-password"
                        placeholder="Create a strong password"
                        value={password}
                        onChange={(event) =>
                          setPassword(event.target.value)
                        }
                        required
                        minLength={8}
                        disabled={loading}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 pr-20 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/30 focus:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-50"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(!showPassword)
                        }
                        disabled={loading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 px-2 text-xs text-white/35 hover:text-white disabled:opacity-40"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>

                    <p className="mt-2 text-xs text-white/25">
                      Use at least 8 characters.
                    </p>
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="mb-2 block text-sm font-medium text-white/70"
                    >
                      Confirm password
                    </label>

                    <div className="relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={
                          showConfirmPassword
                            ? "text"
                            : "password"
                        }
                        autoComplete="new-password"
                        placeholder="Repeat your password"
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(event.target.value)
                        }
                        required
                        minLength={8}
                        disabled={loading}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 pr-20 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/30 focus:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-50"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(
                            !showConfirmPassword
                          )
                        }
                        disabled={loading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 px-2 text-xs text-white/35 hover:text-white disabled:opacity-40"
                      >
                        {showConfirmPassword
                          ? "Hide"
                          : "Show"}
                      </button>
                    </div>
                  </div>

                  {/* Terms */}
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      required
                      disabled={loading}
                      className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5"
                    />

                    <span className="text-xs leading-5 text-white/35">
                      I agree to the Innovex Security terms and
                      understand that security analysis may involve
                      processing the information I submit.
                    </span>
                  </label>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading
                      ? "Creating account..."
                      : "Create account"}
                  </button>
                </form>

                {/* Sign in */}
                <p className="mt-8 text-center text-sm text-white/35">
                  Already have an account?{" "}
                  <a
                    href="/login"
                    className="font-medium text-white/75 transition hover:text-white"
                  >
                    Sign in
                  </a>
                </p>

                {/* Security notice */}
                <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex gap-3">
                    <span className="text-sm">
                      🔐
                    </span>

                    <p className="text-xs leading-5 text-white/30">
                      Your account uses secure email verification
                      before access to the Innovex Security dashboard.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}