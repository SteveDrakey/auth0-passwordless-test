import { useEffect, useState } from "react";
import { sendMagicLink } from "../auth0";
import StepIndicator from "./shared/StepIndicator";
import TokenSuccess from "./shared/TokenSuccess";
import Auth0Badge from "./shared/Auth0Badge";

type Step = "info" | "email" | "submitted" | "verified";

interface FormData {
  name: string;
  description: string;
  email: string;
}

const STEPS = [
  { key: "info", label: "Request", num: 1 },
  { key: "email", label: "Details", num: 2 },
  { key: "submitted", label: "Submitted", num: 3 },
];

interface StreetlightMagicFlowProps {
  onBack: () => void;
}

export default function StreetlightMagicFlow({ onBack }: StreetlightMagicFlowProps) {
  const [step, setStep] = useState<Step>("info");
  const [form, setForm] = useState<FormData>({ name: "", description: "", email: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiAccessToken, setApiAccessToken] = useState("");

  // Check for magic link callback on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#magic-complete")) {
      const params = new URLSearchParams(hash.replace("#magic-complete?", ""));
      const accessToken = params.get("access_token") || "";
      if (accessToken) {
        setApiAccessToken(accessToken);
        setStep("verified");
      }
      window.history.replaceState(null, "", window.location.pathname);
    } else if (hash.startsWith("#magic-error")) {
      const params = new URLSearchParams(hash.replace("#magic-error?", ""));
      setError(params.get("error") || "Magic link verification failed");
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      if (form.email) {
        await sendMagicLink(form.email);
      }
      setStep("submitted");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Page heading */}
      <div className="mb-6">
        <button
          className="text-link hover:underline text-sm mb-2 cursor-pointer flex items-center gap-1"
          onClick={onBack}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          All services
        </button>
        <h1 className="text-2xl font-bold text-navy">Report a problem</h1>
        <p className="text-gray-500 text-sm mt-1">
          Tell us about an issue and we'll get it sorted
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        {step !== "submitted" && step !== "verified" && <StepIndicator current={step} steps={STEPS} />}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-5 text-red-700 text-sm font-mono whitespace-pre-wrap break-words">
            {error}
          </div>
        )}

        {/* Step 1 — What's the problem? */}
        {step === "info" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">What's your name?</label>
              <input
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-council/30 focus:border-council outline-none transition"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Sam Drake"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Describe the problem</label>
              <textarea
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-council/30 focus:border-council outline-none transition min-h-[100px] resize-y"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. The streetlight outside 14 Leeds Bridge Walk has been out for a week"
              />
            </div>
            <button
              className="w-full bg-council hover:bg-council-dark text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              disabled={!form.name || !form.description}
              onClick={() => setStep("email")}
            >
              Next
            </button>
          </div>
        )}

        {/* Step 2 — Email (optional) */}
        {step === "email" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address (optional)</label>
              <input
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-council/30 focus:border-council outline-none transition"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                autoFocus
              />
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600 leading-relaxed">
              <p className="font-medium text-gray-700 mb-1">Why provide an email?</p>
              <p>
                If you provide an email, we'll send you a magic link after you submit.
                Click it whenever you like to verify your identity and track your case online.
                Your report is submitted either way.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-lg border border-gray-300 transition cursor-pointer"
                onClick={() => setStep("info")}
              >
                Back
              </button>
              <button
                className="flex-1 bg-council hover:bg-council-dark text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                disabled={loading}
                onClick={handleSubmit}
              >
                {loading ? "Submitting..." : form.email ? "Submit & send magic link" : "Submit anonymously"}
              </button>
            </div>
          </div>
        )}

        {/* Submitted — waiting for magic link click */}
        {step === "submitted" && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Report submitted!</h2>
            <p className="text-gray-600 mb-1">
              Thanks <strong>{form.name}</strong>, your request has been submitted.
            </p>

            {form.email ? (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-5 text-left">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-800">Check your email</p>
                    <p className="text-sm text-gray-600 mt-1">
                      We've sent a magic link to <strong>{form.email}</strong>.
                      Click it to verify your identity and track your case online.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      You can close this page — the link will work whenever you click it.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm mt-2">
                Submitted anonymously. We won't be able to send updates.
              </p>
            )}

            <button
              className="mt-6 bg-council hover:bg-council-dark text-white font-semibold py-3 px-8 rounded-lg transition cursor-pointer"
              onClick={() => { setStep("info"); setForm({ name: "", description: "", email: "" }); setApiAccessToken(""); setError(""); }}
            >
              Report another issue
            </button>
          </div>
        )}

        {/* Verified — user clicked the magic link and came back */}
        {step === "verified" && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Email verified!</h2>
            <p className="text-gray-600 mb-1">
              Your identity has been confirmed via magic link.
              You can now track your case online.
            </p>

            {apiAccessToken && (
              <div className="mt-6 text-left">
                <TokenSuccess token={apiAccessToken} />
              </div>
            )}

            <button
              className="mt-6 bg-council hover:bg-council-dark text-white font-semibold py-3 px-8 rounded-lg transition cursor-pointer"
              onClick={() => { setStep("info"); setForm({ name: "", description: "", email: "" }); setApiAccessToken(""); setError(""); }}
            >
              Report another issue
            </button>
          </div>
        )}

        <Auth0Badge />
      </div>
    </>
  );
}
