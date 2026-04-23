"use client";

import { useState, useCallback, useEffect } from "react";

interface CallPrefs {
  morning: boolean;
  midday: boolean;
  evening: boolean;
  escalation: boolean;
}

export default function PhoneSetup() {
  const [phone, setPhone] = useState("");
  const [timezone, setTimezone] = useState("");
  const [callPrefs, setCallPrefs] = useState<CallPrefs>({
    morning: true,
    midday: true,
    evening: true,
    escalation: true,
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Detect timezone on mount
  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  const handleSave = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSaved(false);

    // Basic formatting: ensure + prefix
    let formatted = phone.trim().replace(/[\s\-()]/g, "");
    if (!formatted.startsWith("+")) {
      formatted = "+" + formatted;
    }

    try {
      const res = await fetch("/api/users/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formatted, timezone, callPrefs }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save");
        return;
      }

      setPhone(formatted);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [phone, timezone, callPrefs]);

  const handleTestCall = useCallback(async () => {
    setTestLoading(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/calls/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), type: "morning" }),
      });
      const data = await res.json();

      if (!res.ok) {
        setTestResult("Error: " + (data.error || "Failed"));
      } else {
        setTestResult("Calling... pick up your phone!");
      }
    } catch (err) {
      setTestResult("Error: " + String(err));
    } finally {
      setTestLoading(false);
      setTimeout(() => setTestResult(null), 5000);
    }
  }, [phone]);

  const togglePref = (key: keyof CallPrefs) => {
    setCallPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const scheduleItems = [
    {
      key: "morning" as const,
      label: "Morning",
      time: "6:00 AM",
      desc: "Wake-up call to plan your day",
    },
    {
      key: "midday" as const,
      label: "Midday",
      time: "12:00 PM",
      desc: "Progress check-in",
    },
    {
      key: "evening" as const,
      label: "Evening",
      time: "9:00 PM",
      desc: "End-of-day accountability",
    },
    {
      key: "escalation" as const,
      label: "Escalation",
      time: "Auto",
      desc: "Call if you ignore notifications",
    },
  ];

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Call Settings
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            We&apos;ll call you at these times. No snooze button.
          </p>
        </div>

        {/* Phone number input */}
        <div className="mb-5">
          <label
            htmlFor="phone"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Phone number
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 234 567 8900"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
          />
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            Include country code (e.g. +1 for US, +44 for UK, +234 for NG)
          </p>
        </div>

        {/* Timezone */}
        <div className="mb-5">
          <label
            htmlFor="timezone"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Timezone
          </label>
          <input
            id="timezone"
            type="text"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-700 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          />
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            Auto-detected. Edit if wrong.
          </p>
        </div>

        {/* Call schedule toggles */}
        <div className="mb-6">
          <p className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Call schedule
          </p>
          <div className="space-y-2">
            {scheduleItems.map((item) => (
              <button
                key={item.key}
                onClick={() => togglePref(item.key)}
                className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                  callPrefs[item.key]
                    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950"
                    : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        callPrefs[item.key]
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      {item.label}
                    </span>
                    <span
                      className={`text-xs ${
                        callPrefs[item.key]
                          ? "text-emerald-500 dark:text-emerald-500"
                          : "text-zinc-400 dark:text-zinc-500"
                      }`}
                    >
                      {item.time}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                    {item.desc}
                  </p>
                </div>
                <div
                  className={`flex h-6 w-10 items-center rounded-full px-0.5 transition-colors ${
                    callPrefs[item.key] ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      callPrefs[item.key] ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={loading || !phone.trim()}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {loading ? "Saving..." : saved ? "Saved!" : "Save Settings"}
        </button>

        {/* Success message */}
        {saved && (
          <p className="mt-2 text-center text-xs text-emerald-600 dark:text-emerald-400">
            Your phone is registered. We&apos;ll be in touch.
          </p>
        )}

        {/* Error */}
        {error && (
          <p className="mt-2 text-center text-xs text-red-500">
            {error}
          </p>
        )}

        {/* Test call button */}
        {saved && phone && (
          <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
            <button
              onClick={handleTestCall}
              disabled={testLoading}
              className="w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900"
            >
              {testLoading ? "Calling..." : "Test Call"}
            </button>
            {testResult && (
              <p
                className={`mt-2 text-center text-xs ${
                  testResult.startsWith("Error")
                    ? "text-red-500"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {testResult}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
