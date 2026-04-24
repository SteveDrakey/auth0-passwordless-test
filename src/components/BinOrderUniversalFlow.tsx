import { useEffect, useState } from "react";
import { getMfaLoginUrl } from "../auth0";
import StepIndicator from "./shared/StepIndicator";
import TokenSuccess from "./shared/TokenSuccess";
import Auth0Badge from "./shared/Auth0Badge";

type Step = "request" | "verify" | "done";

const STEPS = [
  { key: "request", label: "Your request", num: 1 },
  { key: "verify", label: "Verify identity", num: 2 },
  { key: "done", label: "Done", num: 3 },
];

const BIN_TYPES = [
  { value: "general", label: "General waste (black bin)" },
  { value: "recycling", label: "Recycling (green bin)" },
  { value: "garden", label: "Garden waste (brown bin)" },
];

interface BinOrderUniversalFlowProps {
  onBack: () => void;
}

function parseHashParams(): URLSearchParams | null {
  const hash = window.location.hash;
  const qIndex = hash.indexOf("?");
  if (qIndex === -1) return null;
  return new URLSearchParams(hash.slice(qIndex + 1));
}

export default function BinOrderUniversalFlow({ onBack }: BinOrderUniversalFlowProps) {
  const [step, setStep] = useState<Step>("request");
  const [binType, setBinType] = useState("");
  const [address, setAddress] = useState("");
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
      // Clear hash so it doesn't persist on refresh
      window.history.replaceState(null, "", window.location.pathname);
    } else if (hash.startsWith("#mfa-error")) {
      const params = parseHashParams();
      const errMsg = params?.get("error") || "Authentication failed";
      setError(errMsg);
      setStep("verify");
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  async function handleSignIn() {
    setError("");
    setLoading(true);
    try {
      const url = await getMfaLoginUrl();
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
        <h1 className="text-2xl font-bold text-navy">Order a new bin</h1>
        <p className="text-gray-500 text-sm mt-1">Sign in with password and MFA via Auth0 Universal Login</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        {step !== "done" && <StepIndicator current={step} steps={STEPS} />}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-5 text-red-700 text-sm font-mono whitespace-pre-wrap break-words">
            {error}
          </div>
        )}

        {/* Step 1: Your request */}
        {step === "request" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">What type of bin?</label>
              <select
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-council/30 focus:border-council outline-none transition bg-white"
                value={binType}
                onChange={(e) => setBinType(e.target.value)}
              >
                <option value="">Select a bin type...</option>
                {BIN_TYPES.map((bt) => (
                  <option key={bt.value} value={bt.value}>{bt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery address</label>
              <input
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-council/30 focus:border-council outline-none transition"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 23 Headingley Crescent, Leeds, LS6 3PB"
              />
            </div>
            <button
              className="w-full bg-council hover:bg-council-dark text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              disabled={!binType || !address}
              onClick={() => setStep("verify")}
            >
              Next
            </button>
          </div>
        )}

        {/* Step 2: Verify identity */}
        {step === "verify" && (
          <div className="space-y-5">
            {/* Request summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Bin type</div>
                <div className="font-semibold text-gray-800">
                  {BIN_TYPES.find((bt) => bt.value === binType)?.label || binType || "Not selected"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Delivery address</div>
                <div className="text-gray-700">{address || "Not provided"}</div>
              </div>
            </div>

            <div className="bg-amber-50 border-l-4 border-accent rounded-r-lg p-5">
              <p className="font-semibold text-gray-800 mb-1">Verify your identity</p>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                To complete your bin order, you need to sign in securely via Auth0.
                You'll be redirected to the Auth0 login page where you can enter your
                email and password, then complete multi-factor authentication.
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
                onClick={() => { setError(""); setStep("request"); }}
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Done */}
        {step === "done" && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Identity verified!</h2>
            <p className="text-gray-600 mb-1">
              Your bin order has been authenticated via Auth0 Universal Login with MFA.
            </p>

            {accessToken && (
              <div className="mt-6 text-left">
                <TokenSuccess token={accessToken} />
              </div>
            )}

            <button
              className="mt-6 bg-council hover:bg-council-dark text-white font-semibold py-3 px-8 rounded-lg transition cursor-pointer"
              onClick={() => { setStep("request"); setBinType(""); setAddress(""); setAccessToken(""); setError(""); }}
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
