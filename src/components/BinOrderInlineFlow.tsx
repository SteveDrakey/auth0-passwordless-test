import { useState } from "react";
import { mfaSignup, mfaChallenge, mfaEnrol, mfaVerify } from "../auth0";
import StepIndicator from "./shared/StepIndicator";
import TokenSuccess from "./shared/TokenSuccess";
import Auth0Badge from "./shared/Auth0Badge";

type Step = "request" | "account" | "authenticator" | "done";

const STEPS = [
  { key: "request", label: "Your request", num: 1 },
  { key: "account", label: "Create account", num: 2 },
  { key: "authenticator", label: "Authenticator", num: 3 },
];

interface BinOrderInlineFlowProps {
  onBack: () => void;
}

export default function BinOrderInlineFlow({ onBack }: BinOrderInlineFlowProps) {
  const [step, setStep] = useState<Step>("request");
  const [form, setForm] = useState({ binType: "", address: "", email: "", password: "" });
  const [mfaToken, setMfaToken] = useState("");
  const [barcodeUri, setBarcodeUri] = useState("");
  const [secret, setSecret] = useState("");
  const [otp, setOtp] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreateAccount() {
    if (!form.email || !form.password) return;
    setError("");
    setLoading(true);
    try {
      // 1. Create user
      await mfaSignup(form.email, form.password);

      // 2. Authenticate (Resource Owner Password Grant)
      const challengeResult = await mfaChallenge(form.email, form.password);

      if (challengeResult.access_token) {
        // MFA not enforced — skip enrollment, go straight to done
        setAccessToken(challengeResult.access_token);
        setStep("done");
        return;
      }

      if (!challengeResult.mfa_token) {
        throw new Error("Unexpected response: no mfa_token or access_token");
      }

      // 3. Enrol TOTP authenticator
      const enrolResult = await mfaEnrol(challengeResult.mfa_token);
      setMfaToken(challengeResult.mfa_token);
      setBarcodeUri(enrolResult.barcode_uri);
      setSecret(enrolResult.secret);
      setStep("authenticator");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (otp.length !== 6) return;
    setError("");
    setLoading(true);
    try {
      const result = await mfaVerify(mfaToken, otp);
      setAccessToken(result.access_token);
      setStep("done");
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
        <h1 className="text-2xl font-bold text-navy">Order a new bin</h1>
        <p className="text-gray-500 text-sm mt-1">Password + authenticator app verification built into the form</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        {step !== "done" && <StepIndicator current={step} steps={STEPS} />}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-5 text-red-700 text-sm font-mono whitespace-pre-wrap break-words">
            {error}
          </div>
        )}

        {/* Step 1 — Your request */}
        {step === "request" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">What type of bin?</label>
              <select
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-council/30 focus:border-council outline-none transition bg-white"
                value={form.binType}
                onChange={(e) => setForm({ ...form, binType: e.target.value })}
              >
                <option value="">Select a bin type...</option>
                <option value="general">General waste</option>
                <option value="recycling">Recycling</option>
                <option value="garden">Garden waste</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery address</label>
              <input
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-council/30 focus:border-council outline-none transition"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="e.g. 42 Oak Road, Northampton, NN1 2AB"
              />
            </div>
            <button
              className="w-full bg-council hover:bg-council-dark text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              disabled={!form.binType || !form.address}
              onClick={() => setStep("account")}
            >
              Next
            </button>
          </div>
        )}

        {/* Step 2 — Create account */}
        {step === "account" && (
          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600 leading-relaxed">
              <p className="font-medium text-gray-700 mb-1">Why create an account?</p>
              <p>
                To verify your identity and protect your order, we need you to create an account
                with a password and authenticator app. This uses multi-factor authentication (MFA)
                — no redirect to a separate login page needed.
              </p>
            </div>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-council/30 focus:border-council outline-none transition"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="At least 8 characters"
              />
            </div>
            <div className="flex gap-3">
              <button
                className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-lg border border-gray-300 transition cursor-pointer"
                onClick={() => setStep("request")}
              >
                Back
              </button>
              <button
                className="flex-1 bg-council hover:bg-council-dark text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                disabled={!form.email || !form.password || loading}
                onClick={handleCreateAccount}
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Set up authenticator */}
        {step === "authenticator" && (
          <div className="space-y-5">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Set up your authenticator app</h2>
              <p className="text-sm text-gray-500">
                Scan the QR code with an authenticator app like Google Authenticator, Authy or 1Password,
                then enter the 6-digit code below.
              </p>
            </div>

            {/* QR Code */}
            {barcodeUri && (
              <div className="flex justify-center">
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(barcodeUri)}`}
                    alt="TOTP QR code"
                    width={200}
                    height={200}
                    className="rounded"
                  />
                </div>
              </div>
            )}

            {/* Manual entry secret */}
            {secret && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Or enter this secret manually:</p>
                <code className="text-sm font-mono font-semibold text-gray-800 tracking-wider select-all break-all">
                  {secret}
                </code>
              </div>
            )}

            {/* OTP input */}
            <div className="flex flex-col items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Enter the 6-digit code</label>
              <input
                className="w-44 px-3 py-2.5 border border-gray-300 rounded-lg text-xl font-mono tracking-[0.3em] text-center focus:ring-2 focus:ring-council/30 focus:border-council outline-none bg-white"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-lg border border-gray-300 transition cursor-pointer"
                onClick={() => { setStep("account"); setOtp(""); setError(""); }}
              >
                Back
              </button>
              <button
                className="flex-1 bg-council hover:bg-council-dark text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                disabled={otp.length !== 6 || loading}
                onClick={handleVerifyOtp}
              >
                {loading ? "Verifying..." : "Verify"}
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Done */}
        {step === "done" && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Order submitted!</h2>
            <p className="text-gray-600 mb-1">
              Your <strong>{form.binType}</strong> bin will be delivered to <strong>{form.address}</strong>.
            </p>
            <p className="text-gray-600">
              Account created for <strong>{form.email}</strong> with MFA enabled.
            </p>

            {accessToken && (
              <div className="mt-6 text-left">
                <TokenSuccess token={accessToken} />
              </div>
            )}

            <button
              className="mt-6 bg-council hover:bg-council-dark text-white font-semibold py-3 px-8 rounded-lg transition cursor-pointer"
              onClick={() => {
                setStep("request");
                setForm({ binType: "", address: "", email: "", password: "" });
                setMfaToken("");
                setBarcodeUri("");
                setSecret("");
                setOtp("");
                setAccessToken("");
                setError("");
              }}
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
