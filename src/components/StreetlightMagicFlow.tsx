import { useEffect, useState } from "react";
import { sendMagicLink } from "../auth0";
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

interface StreetlightMagicFlowProps {
  onBack: () => void;
}

export default function StreetlightMagicFlow({ onBack }: StreetlightMagicFlowProps) {
  const [step, setStep] = useState<Step>("info");
  const [form, setForm] = useState<FormData>({ name: "", description: "", email: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [apiAccessToken, setApiAccessToken] = useState("");

  // Check for magic link callback on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#magic-complete")) {
      const params = new URLSearchParams(hash.replace("#magic-complete?", ""));
      const accessToken = params.get("access_token") || "";
      if (accessToken) {
        setApiAccessToken(accessToken);
        setVerified(true);
        setStep("done");
      }
      window.history.replaceState(null, "", window.location.pathname);
    } else if (hash.startsWith("#magic-error")) {
      const params = new URLSearchParams(hash.replace("#magic-error?", ""));
      setError(params.get("error") || "Magic link verification failed");
      setStep("review");
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  async function handleSendLink() {
    if (!form.email) return;
    setError("");
    setLoading(true);
    try {
      await sendMagicLink(form.email);
      setLinkSent(true);
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
        {step !== "done" && <StepIndicator current={step} steps={STEPS} />}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-5 text-red-700 text-sm font-mono whitespace-pre-wrap break-words">
            {error}
          </div>
        )}

        {/* Step 1 */}
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
                placeholder="e.g. The streetlight outside 42 Oak Road has been out for a week"
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

        {/* Step 2 */}
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
                We'll send you a magic link to verify your email and create an account.
                You can also skip this and submit without one — your request will still be processed.
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
                className="flex-1 bg-council hover:bg-council-dark text-white font-semibold py-3 px-6 rounded-lg transition cursor-pointer"
                onClick={() => { setLinkSent(false); setVerified(false); setError(""); setStep("review"); }}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
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
                <div className="text-gray-700">{form.email || <span className="text-gray-400 italic">Not provided</span>}</div>
              </div>
            </div>

            {/* No email */}
            {!form.email && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
                You're submitting anonymously.{" "}
                <button className="text-link hover:underline cursor-pointer" onClick={() => setStep("email")}>
                  Add an email
                </button>{" "}
                if you'd like updates.
              </div>
            )}

            {/* Email but not verified */}
            {form.email && !verified && (
              <div className="bg-amber-50 border-l-4 border-accent rounded-r-lg p-5">
                <p className="font-semibold text-gray-800 mb-1">Want to track your case online?</p>
                <p className="text-sm text-gray-600 leading-relaxed mb-3">
                  We'll email you a magic link — click it to verify your email and create an account.
                  Or just hit submit without verifying.
                </p>

                {!linkSent ? (
                  <button
                    className="bg-accent hover:bg-accent-dark text-navy font-semibold py-2.5 px-5 rounded-lg text-sm transition disabled:opacity-50 cursor-pointer"
                    disabled={loading}
                    onClick={handleSendLink}
                  >
                    {loading ? "Sending..." : "Send me a magic link"}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="bg-white border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            Magic link sent to <strong>{form.email}</strong>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Check your inbox and click the link to verify. The link expires in 5 minutes.
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Didn't get it?{" "}
                      <button className="text-link underline hover:no-underline cursor-pointer" onClick={handleSendLink} disabled={loading}>
                        Resend
                      </button>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Verified */}
            {form.email && verified && (
              <>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <div>
                    <span className="font-semibold text-emerald-800">Email verified</span>
                    <p className="text-sm text-emerald-700 mt-0.5">Your account will be created when you submit.</p>
                  </div>
                </div>

                {apiAccessToken && <TokenSuccess token={apiAccessToken} />}
              </>
            )}

            <div className="flex gap-3">
              <button
                className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-lg border border-gray-300 transition cursor-pointer"
                onClick={() => setStep("email")}
              >
                Back
              </button>
              <button
                className="flex-1 bg-council hover:bg-council-dark text-white font-semibold py-3 px-6 rounded-lg transition cursor-pointer"
                onClick={() => setStep("done")}
              >
                {form.email && verified ? "Submit" : form.email ? "Submit without verifying" : "Submit anonymously"}
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
              Thanks <strong>{form.name}</strong>, your request has been submitted.
            </p>
            {form.email && verified && (
              <p className="text-gray-600">
                Your account has been created with <strong>{form.email}</strong>.
              </p>
            )}
            {form.email && !verified && (
              <p className="text-gray-500 text-sm">
                Email provided but not verified — we may use it to contact you.
              </p>
            )}
            {!form.email && (
              <p className="text-gray-500 text-sm">
                Submitted anonymously. We won't be able to send updates.
              </p>
            )}

            {verified && apiAccessToken && (
              <div className="mt-6 text-left">
                <TokenSuccess token={apiAccessToken} />
              </div>
            )}

            <button
              className="mt-6 bg-council hover:bg-council-dark text-white font-semibold py-3 px-8 rounded-lg transition cursor-pointer"
              onClick={() => { setStep("info"); setForm({ name: "", description: "", email: "" }); setLinkSent(false); setVerified(false); setApiAccessToken(""); setError(""); }}
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
