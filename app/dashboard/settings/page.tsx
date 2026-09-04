"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";

type Tab =
  | "account"
  | "security"
  | "notifications"
  | "privacy"
  | "appearance"
  | "sessions";

export default function SettingsPage() {
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<Tab>("account");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [scanNotifications, setScanNotifications] = useState(true);

  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Unable to load your account information.");
      setLoading(false);
      return;
    }

    setEmail(user.email ?? "");
    setName(
      user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        ""
    );
    setEmailVerified(Boolean(user.email_confirmed_at));

    /*
     * Load saved local preferences.
     *
     * If a preference has never been saved before,
     * the default value remains ON.
     */
    if (typeof window !== "undefined") {
      const savedSecurityAlerts = localStorage.getItem(
        "innovex-notification-security"
      );

      const savedScanNotifications = localStorage.getItem(
        "innovex-notification-scan"
      );

      const savedEmailNotifications = localStorage.getItem(
        "innovex-notification-email"
      );

      const savedTheme = localStorage.getItem("innovex-theme");

      if (savedSecurityAlerts !== null) {
        setSecurityAlerts(savedSecurityAlerts === "true");
      }

      if (savedScanNotifications !== null) {
        setScanNotifications(savedScanNotifications === "true");
      }

      if (savedEmailNotifications !== null) {
        setEmailNotifications(savedEmailNotifications === "true");
      }

      if (savedTheme !== null) {
        setTheme(savedTheme);
      }
    }

    setLoading(false);
  }

  async function saveAccount(event: FormEvent) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        full_name: name.trim(),
      },
    });

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setMessage("Account information updated successfully.");
    setSaving(false);
  }

  function saveNotificationPreference(
    type: "email" | "security" | "scan",
    value: boolean
  ) {
    if (typeof window === "undefined") return;

    localStorage.setItem(
      `innovex-notification-${type}`,
      String(value)
    );

    setMessage("Notification preference saved.");
  }

  function changeTheme(value: string) {
    setTheme(value);

    if (typeof window !== "undefined") {
      localStorage.setItem("innovex-theme", value);
    }

    setMessage("Appearance preference saved.");
  }

  async function sendPasswordReset() {
    setSaving(true);
    setMessage("");
    setError("");

    if (!email) {
      setError("No email address is associated with this account.");
      setSaving(false);
      return;
    }

    const { error: resetError } =
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });

    if (resetError) {
      setError(resetError.message);
    } else {
      setMessage(
        "Password reset instructions have been sent to your email."
      );
    }

    setSaving(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  function clearLocalPreferences() {
    if (typeof window === "undefined") return;

    localStorage.removeItem("innovex-theme");
    localStorage.removeItem("innovex-notification-email");
    localStorage.removeItem("innovex-notification-security");
    localStorage.removeItem("innovex-notification-scan");

    setTheme("dark");
    setEmailNotifications(true);
    setSecurityAlerts(true);
    setScanNotifications(true);

    setMessage("Local preferences have been reset.");
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "account", label: "Account", icon: "👤" },
    { id: "security", label: "Security", icon: "🔐" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "privacy", label: "Privacy & Data", icon: "🛡️" },
    { id: "appearance", label: "Appearance", icon: "🎨" },
    { id: "sessions", label: "Sessions", icon: "💻" },
  ];

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070b14] text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
            <p className="text-sm text-slate-400">
              Loading your settings...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070b14] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <a
                href="/dashboard"
                className="text-sm text-slate-500 transition hover:text-cyan-400"
              >
                Dashboard
              </a>

              <span className="text-slate-700">/</span>

              <span className="text-sm text-slate-300">
                Settings
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Settings
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Manage your Innovex Security account, security preferences,
              notifications, privacy, and active session.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-cyan-400/10 bg-slate-900/60 px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-lg">
              🛡️
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-cyan-400">
                Innovex Security
              </p>

              <p className="text-xs text-slate-500">
                Your Personal AI Security Center
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-4">
            <span className="mt-0.5 text-emerald-400">✓</span>

            <p className="text-sm text-emerald-300">
              {message}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/5 px-4 py-4">
            <span className="mt-0.5 text-red-400">!</span>

            <p className="text-sm text-red-300">
              {error}
            </p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
          {/* Sidebar */}
          <aside className="h-fit rounded-3xl border border-white/10 bg-slate-900/50 p-3 backdrop-blur-xl">
            <div className="mb-3 px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Settings
              </p>
            </div>

            <div className="space-y-1">
              {tabs.map((tab) => {
                const selected = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMessage("");
                      setError("");
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                      selected
                        ? "bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="text-base">
                      {tab.icon}
                    </span>

                    <span className="font-medium">
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="my-4 border-t border-white/10" />

            <button
              type="button"
              onClick={signOut}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-red-400 transition hover:bg-red-400/10"
            >
              <span>↪</span>
              Sign out
            </button>
          </aside>

          {/* Main Settings */}
          <section className="min-w-0">
            {/* ACCOUNT */}
            {activeTab === "account" && (
              <div className="space-y-6">
                <SettingsHeader
                  icon="👤"
                  title="Account"
                  description="Manage your personal account information."
                />

                <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-xl sm:p-8">
                  <form onSubmit={saveAccount}>
                    <div className="mb-8 flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-2xl">
                        {name
                          ? name.charAt(0).toUpperCase()
                          : "U"}
                      </div>

                      <div>
                        <h2 className="font-semibold text-white">
                          Profile information
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          This information is connected to your
                          Supabase account.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <Field label="Full name">
                        <input
                          value={name}
                          onChange={(e) =>
                            setName(e.target.value)
                          }
                          placeholder="Enter your full name"
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Email address">
                        <input
                          value={email}
                          disabled
                          className={`${inputClass} cursor-not-allowed opacity-60`}
                        />
                      </Field>
                    </div>

                    <div className="mt-6 rounded-2xl border border-white/10 bg-black/10 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">
                            Email verification
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Your email address is used for account
                            authentication.
                          </p>
                        </div>

                        {emailVerified ? (
                          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                            <span>✓</span>
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-300">
                            <span>!</span>
                            Not verified
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {saving
                          ? "Saving..."
                          : "Save changes"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* SECURITY */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <SettingsHeader
                  icon="🔐"
                  title="Security"
                  description="Protect your Innovex Security account."
                />

                <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-xl sm:p-8">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10">
                        🔑
                      </div>

                      <div>
                        <h2 className="font-semibold text-white">
                          Password
                        </h2>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          Send a secure password reset link to your
                          verified email address.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={sendPasswordReset}
                      disabled={saving}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                    >
                      {saving
                        ? "Sending..."
                        : "Reset password"}
                    </button>
                  </div>
                </div>

                <div className="rounded-3xl border border-emerald-400/10 bg-emerald-400/5 p-6 sm:p-8">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10">
                      🛡️
                    </div>

                    <div>
                      <h2 className="font-semibold text-white">
                        Account protection
                      </h2>

                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        Innovex Security uses authenticated Supabase
                        sessions to protect your account and keep your
                        security scans associated with your user account.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-amber-400/10 bg-amber-400/5 p-6 sm:p-8">
                  <p className="text-sm font-semibold text-amber-300">
                    Security recommendation
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Use a strong, unique password and never share your
                    authentication credentials with anyone.
                  </p>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <SettingsHeader
                  icon="🔔"
                  title="Notifications"
                  description="Choose which security notifications you want to receive."
                />

                <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-xl sm:p-8">
                  <div className="divide-y divide-white/10">
                    <ToggleRow
                      title="Security alerts"
                      description="Receive alerts when important security activity requires your attention."
                      enabled={securityAlerts}
                      onChange={(value) => {
                        setSecurityAlerts(value);

                        saveNotificationPreference(
                          "security",
                          value
                        );
                      }}
                    />

                    <ToggleRow
                      title="Scan notifications"
                      description="Show notifications about completed threat scans."
                      enabled={scanNotifications}
                      onChange={(value) => {
                        setScanNotifications(value);

                        saveNotificationPreference(
                          "scan",
                          value
                        );
                      }}
                    />

                    <ToggleRow
                      title="Email notifications"
                      description="Allow Innovex Security to send account and security-related email notifications."
                      enabled={emailNotifications}
                      onChange={(value) => {
                        setEmailNotifications(value);

                        saveNotificationPreference(
                          "email",
                          value
                        );
                      }}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/5 p-5">
                  <p className="text-sm font-medium text-cyan-300">
                    Note
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Notification preferences are currently stored
                    locally in this browser.
                  </p>
                </div>
              </div>
            )}

            {/* PRIVACY */}
            {activeTab === "privacy" && (
              <div className="space-y-6">
                <SettingsHeader
                  icon="🛡️"
                  title="Privacy & Data"
                  description="Understand and manage data stored by Innovex Security."
                />

                <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-xl sm:p-8">
                  <div className="space-y-6">
                    <PrivacyRow
                      icon="🔍"
                      title="Security scans"
                      description="Your authenticated security scans are stored in the Innovex Security database so that your dashboard, history, analytics, and threat center can work with your real scan activity."
                    />

                    <PrivacyRow
                      icon="🧠"
                      title="Security analysis"
                      description="Submitted security inputs may be analyzed by the application's detection and threat-intelligence systems to determine risk."
                    />

                    <PrivacyRow
                      icon="🔒"
                      title="Account isolation"
                      description="Your security scan records are associated with your authenticated account and protected by database access policies."
                    />
                  </div>
                </div>

                <div className="rounded-3xl border border-red-400/10 bg-red-400/5 p-6 sm:p-8">
                  <h2 className="font-semibold text-white">
                    Local preferences
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Reset appearance and notification preferences
                    stored only in this browser.
                  </p>

                  <button
                    type="button"
                    onClick={clearLocalPreferences}
                    className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-400/15"
                  >
                    Reset local preferences
                  </button>
                </div>
              </div>
            )}

            {/* APPEARANCE */}
            {activeTab === "appearance" && (
              <div className="space-y-6">
                <SettingsHeader
                  icon="🎨"
                  title="Appearance"
                  description="Customize how Innovex Security looks on this device."
                />

                <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-xl sm:p-8">
                  <h2 className="font-semibold text-white">
                    Theme
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Choose your preferred interface appearance.
                  </p>

                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    {[
                      {
                        value: "dark",
                        title: "Dark",
                        description: "Recommended",
                        icon: "🌙",
                      },
                      {
                        value: "light",
                        title: "Light",
                        description: "Bright interface",
                        icon: "☀️",
                      },
                      {
                        value: "system",
                        title: "System",
                        description: "Follow device",
                        icon: "💻",
                      },
                    ].map((option) => {
                      const selected =
                        theme === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            changeTheme(option.value)
                          }
                          className={`rounded-2xl border p-5 text-left transition ${
                            selected
                              ? "border-cyan-400/40 bg-cyan-400/10"
                              : "border-white/10 bg-black/10 hover:border-white/20 hover:bg-white/5"
                          }`}
                        >
                          <div className="mb-4 text-2xl">
                            {option.icon}
                          </div>

                          <p
                            className={`font-semibold ${
                              selected
                                ? "text-cyan-300"
                                : "text-white"
                            }`}
                          >
                            {option.title}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {option.description}
                          </p>

                          {selected && (
                            <div className="mt-4 text-xs font-semibold text-cyan-400">
                              ✓ Selected
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-400/10 bg-amber-400/5 p-5">
                  <p className="text-sm font-medium text-amber-300">
                    Current interface
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    The Innovex Security dashboard is designed around a
                    dark security-center interface. Your preference is
                    saved locally for future interface integration.
                  </p>
                </div>
              </div>
            )}

            {/* SESSIONS */}
            {activeTab === "sessions" && (
              <div className="space-y-6">
                <SettingsHeader
                  icon="💻"
                  title="Sessions"
                  description="Review the account session currently being used."
                />

                <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-xl sm:p-8">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10 text-xl">
                        💻
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-semibold text-white">
                            Current session
                          </h2>

                          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                            Active
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-500">
                          {email}
                        </p>

                        <p className="mt-1 text-xs text-slate-600">
                          This is the authenticated session currently
                          connected to Innovex Security.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={signOut}
                      className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-400/15"
                    >
                      Sign out
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
                  <p className="text-sm font-medium text-white">
                    Session security
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    If you believe someone else has accessed your
                    account, reset your password immediately and sign
                    out of this session.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-10 border-t border-white/10 pt-6 text-center">
          <p className="text-xs text-slate-600">
            © 2026 Innovex Security · Designed & Built by Team Innovex
          </p>

          <p className="mt-2 text-[11px] text-slate-700">
            Detect. Analyze. Respond. Protect.
          </p>
        </footer>
      </div>
    </main>
  );
}

function SettingsHeader({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/10 bg-cyan-400/10 text-xl">
        {icon}
      </div>

      <div>
        <h2 className="text-xl font-bold text-white">
          {title}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </span>

      {children}
    </label>
  );
}

function ToggleRow({
  title,
  description,
  enabled,
  onChange,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-xl">
        <h3 className="text-sm font-semibold text-white">
          {title}
        </h3>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onChange(!enabled)}
        aria-pressed={enabled}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          enabled ? "bg-cyan-400" : "bg-slate-700"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
            enabled ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function PrivacyRow({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5">
        {icon}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white">
          {title}
        </h3>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/10";