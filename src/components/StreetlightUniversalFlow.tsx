import { useEffect, useState } from "react";
import { getMfaLoginUrl } from "../auth0";
import StepIndicator from "./shared/StepIndicator";
import TokenSuccess from "./shared/TokenSuccess";
import Auth0Badge from "./shared/Auth0Badge";

type Step = "info" | "email" | "review" | "done";

interface FormData {
  name: string;
  description: string;
  email: string;
}

const STEPS = [
  { key: "info", label: "Request", num: 1 },
  { key: "email", label: "Details", num: 2 },
  { key: "review", label: "Review", num: 3 },
];

interface StreetlightUniversalFlowProps {
  onBack: () => void;
}

function parseHashParams(): URLSearchParams | null {
  const hash = window.location.hash;
  const qIndex = hash.indexOf("?");
  if (qIndex === -1) return null;
  return new URLSearchParams(hash.slice(qIndex + 1));
}

export default function StreetlightUniversalFlow({ onBack }: StreetlightUniversalFlowProps) {
  const [step, setStep] = useState<Step>("info");
  const [form, setForm] = useState<FormData>({ name: "", description: "", email: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState("");

  // On mount, check hash for callback tokens
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#mfa-complete")) {
      const params = parseHashParams();
      if (params) {
        const token = params.get("access_token");
        if (token) {
          setAccessToken(token);
          setStep("done");
        }
      }
      window.history.replaceState(null, "", window.location.pathname);
    } else if (hash.startsWith("#mfa-error")) {
      const params = parseHashParams();
      const errMsg = params?.get("error") || "Authentication failed";
      setError(errMsg);
      setStep("review");
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  async function handleSignIn() {
    setError("");
    setLoading(true);
    try {
      sessionStorage.setItem("mfa-return-flow", "streetlight-universal");
      const url = await getMfaLoginUrl({ loginHint: form.email, connection: "email" });
      window.location.href = url;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
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
        {step !== "done" && <StepIndicator current={step} steps={STEPS} />}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-5 text-red-700 text-sm font-mono whitespace-pre-wrap break-words">
            {error}
          </div>
        )}

        {/* Step 1: Request */}
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

        {/* Step 2: Details — collect email */}
        {step === "email" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
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
                Your email will be passed to Auth0 using <code className="text-xs bg-white px-1 py-0.5 rounded border border-gray-200">login_hint</code> so
                it's pre-filled on the login page. Auth0 will send you a one-time code to verify.
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
                disabled={!form.email}
                onClick={() => { setError(""); setStep("review"); }}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review + redirect to Auth0 */}
        {step === "review" && (
          <div className="space-y-5">
            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Name</div>
                <div className="font-semibold text-gray-800">{form.name}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Problem</div>
                <div className="text-gray-700">{form.description}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Email</div>
                <div className="text-gray-700">{form.email}</div>
              </div>
            </div>

            <div className="bg-amber-50 border-l-4 border-accent rounded-r-lg p-5">
              <p className="font-semibold text-gray-800 mb-1">Verify your identity</p>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                You'll be redirected to Auth0 where your email <strong>{form.email}</strong> will
                be pre-filled via <code className="text-xs bg-white/60 px-1 py-0.5 rounded">login_hint</code>.
                Auth0 will send a one-time code to verify your identity.
              </p>
              <button
                className="bg-accent hover:bg-accent-dark text-navy font-semibold py-2.5 px-5 rounded-lg text-sm transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
                disabled={loading}
                onClick={handleSignIn}
              >
                {loading ? (
                  "Redirecting..."
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    Sign in with Auth0
                  </>
                )}
              </button>
            </div>

            <div className="flex gap-3">
              <button
                className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-lg border border-gray-300 transition cursor-pointer"
                onClick={() => setStep("email")}
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Done */}
        {step === "done" && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Submitted!</h2>
            <p className="text-gray-600 mb-1">
              Thanks <strong>{form.name}</strong>, your request has been submitted and your identity verified via Auth0 Universal Login.
            </p>

            {accessToken && (
              <div className="mt-6 text-left">
                <TokenSuccess token={accessToken} />
              </div>
            )}

            <button
              className="mt-6 bg-council hover:bg-council-dark text-white font-semibold py-3 px-8 rounded-lg transition cursor-pointer"
              onClick={() => { setStep("info"); setForm({ name: "", description: "", email: "" }); setAccessToken(""); setError(""); }}
            >
              Start again
            </button>
          </div>
        )}

        <Auth0Badge />
      </div>
    </>
  );
}
