import { useMemo, useState } from "react";
import { startPasswordless, verifyCode } from "./auth0";

const API_AUDIENCE = "https://tn-dataverse-contact-api";

function decodeJwt(token: string): { header: Record<string, unknown>; payload: Record<string, unknown> } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const decodePart = (p: string): Record<string, unknown> => {
      const base64 = p.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
      const binary = atob(padded);
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      return JSON.parse(new TextDecoder().decode(bytes));
    };
    return { header: decodePart(parts[0]), payload: decodePart(parts[1]) };
  } catch {
    return null;
  }
}

function formatTime(epoch: unknown): string | null {
  if (typeof epoch !== "number") return null;
  return new Date(epoch * 1000).toLocaleString();
}

function scopeLabel(scope: string): { label: string; description: string } {
  const map: Record<string, { label: string; description: string }> = {
    openid: { label: "OpenID", description: "Verify your identity" },
    profile: { label: "Profile", description: "Read your name and picture" },
    email: { label: "Email", description: "Read your email address" },
    "read:contacts": { label: "Read Contacts", description: "View contact records" },
    "write:contacts": { label: "Write Contacts", description: "Create and update contacts" },
    "read:cases": { label: "Read Cases", description: "View case records" },
    "write:cases": { label: "Write Cases", description: "Create and update cases" },
  };
  return map[scope] ?? { label: scope, description: "API permission" };
}

type Step = "info" | "email" | "review" | "done";

interface FormData {
  name: string;
  description: string;
  email: string;
}

function Auth0Badge() {
  return (
    <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mt-8 pt-6 border-t border-gray-100">
      <svg viewBox="0 0 40 44" className="h-5 w-5" fill="none">
        <path d="M33.12 9.86L25.56 0H14.44l7.56 9.86-2 6.16-6-4.38H0l2.88 8.88 5.24 3.62L3.04 28.5 8.72 44l5.92-4.14L20 44.5l5.36-4.64L31.28 44l-5.08-15.86 5.24-3.62L34.32 15.64H20.44l-2 6.16 7.56-9.86z" fill="#EB5424"/>
      </svg>
      <span>Built on <strong className="text-gray-500">Auth0</strong> Passwordless</span>
    </div>
  );
}

function StepIndicator({ current }: { current: Step }) {
  const steps: { key: Step; label: string; num: number }[] = [
    { key: "info", label: "Request", num: 1 },
    { key: "email", label: "Details", num: 2 },
    { key: "review", label: "Review", num: 3 },
  ];
  const idx = steps.findIndex((s) => s.key === current);

  return (
    <div className="flex gap-2 mb-8">
      {steps.map((s, i) => (
        <div key={s.key} className="flex-1 text-center">
          <div className={`flex items-center justify-center gap-1.5 pb-2 text-sm border-b-2 transition-colors whitespace-nowrap ${
            i <= idx ? "border-council text-council" : "border-gray-200 text-gray-400"
          } ${i === idx ? "font-semibold" : ""}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              i < idx ? "bg-council text-white" : i === idx ? "bg-council-100 text-council-700" : "bg-gray-100 text-gray-400"
            }`}>
              {i < idx ? "\u2713" : s.num}
            </span>
            <span>{s.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TokenSuccess({ token }: { token: string }) {
  const decoded = useMemo(() => decodeJwt(token), [token]);
  if (!decoded) return null;

  const p = decoded.payload;
  const scopes = typeof p.scope === "string" ? p.scope.split(" ").filter(Boolean) : [];
  const permissions = Array.isArray(p.permissions) ? (p.permissions as string[]) : [];
  const allPerms = [...new Set([...scopes, ...permissions])];
  const exp = formatTime(p.exp);
  const iat = formatTime(p.iat);

  return (
    <div className="space-y-4 mb-6">
      {/* Success banner */}
      <div className="bg-council-50 border border-council-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-council-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-council" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-council-800 text-base">API Access Token Granted</h3>
            <p className="text-sm text-council-700 mt-1">
              Auth0 issued a signed JWT for the <code className="bg-council-100 px-1.5 py-0.5 rounded text-xs font-mono">{String(p.aud ?? API_AUDIENCE)}</code> API.
            </p>
          </div>
        </div>
      </div>

      {/* Token details card */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {/* Identity */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Identity</div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Subject</span>
              <div className="font-mono text-gray-800 text-xs mt-0.5 break-all">{String(p.sub ?? "\u2014")}</div>
            </div>
            <div>
              <span className="text-gray-500">Issuer</span>
              <div className="font-mono text-gray-800 text-xs mt-0.5 break-all">{String(p.iss ?? "\u2014")}</div>
            </div>
          </div>
        </div>

        {/* Permissions */}
        {allPerms.length > 0 && (
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Permissions & Scopes</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {allPerms.map((s) => {
                const { label, description } = scopeLabel(s);
                return (
                  <div key={s} className="flex items-start gap-2.5 p-2.5 bg-gray-50 rounded-lg">
                    <div className="w-5 h-5 rounded bg-council-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-council" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">{label}</div>
                      <div className="text-xs text-gray-500">{description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Validity */}
        <div className="px-5 py-4">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Validity</div>
          <div className="flex gap-6 text-sm">
            {iat && (
              <div>
                <span className="text-gray-500">Issued</span>
                <div className="text-gray-800 mt-0.5">{iat}</div>
              </div>
            )}
            {exp && (
              <div>
                <span className="text-gray-500">Expires</span>
                <div className="text-gray-800 mt-0.5">{exp}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Copy token */}
      <button
        onClick={() => navigator.clipboard.writeText(token)}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
        </svg>
        Copy raw JWT to clipboard
      </button>
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState<Step>("info");
  const [form, setForm] = useState<FormData>({ name: "", description: "", email: "" });
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [apiAccessToken, setApiAccessToken] = useState("");

  async function handleSendCode() {
    if (!form.email) return;
    setError("");
    setLoading(true);
    try {
      await startPasswordless(form.email);
      setCodeSent(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (code.length !== 6) return;
    setError("");
    setLoading(true);
    try {
      const result = await verifyCode(form.email, code);
      setVerified(true);
      setApiAccessToken(result.access_token ?? "");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Council-style header bar */}
      <div className="bg-council">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21" />
              </svg>
            </div>
            <div>
              <div className="text-white font-bold text-sm tracking-wide">Council Services</div>
              <div className="text-white/60 text-xs">Citizen Portal Demo</div>
            </div>
          </div>
          <span className="text-white/40 text-xs font-mono">{__BUILD_HASH__}</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-8">
        {/* Page heading */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy">Report a problem</h1>
          <p className="text-gray-500 text-sm mt-1">Tell us about an issue and we'll get it sorted</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          {step !== "done" && <StepIndicator current={step} />}

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
                  Verify your email to create an account and track your case online.
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
                  onClick={() => { setCodeSent(false); setCode(""); setVerified(false); setError(""); setStep("review"); }}
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
                <div className="bg-council-50 border border-council-200 rounded-xl p-5">
                  <p className="font-semibold text-council-800 mb-1">Want to track your case online?</p>
                  <p className="text-sm text-council-700 leading-relaxed mb-3">
                    Verify your email to create an account. Or just hit submit — your request will still be processed.
                  </p>

                  {!codeSent ? (
                    <button
                      className="bg-council hover:bg-council-dark text-white font-medium py-2.5 px-5 rounded-lg text-sm transition disabled:opacity-50 cursor-pointer"
                      disabled={loading}
                      onClick={handleSendCode}
                    >
                      {loading ? "Sending..." : "Send me a verification code"}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-council-800">
                        We've sent a 6-digit code to <strong>{form.email}</strong>
                      </p>
                      <div className="flex gap-2 items-center">
                        <input
                          className="w-36 px-3 py-2.5 border border-council-200 rounded-lg text-xl font-mono tracking-[0.3em] text-center focus:ring-2 focus:ring-council/30 focus:border-council outline-none"
                          value={code}
                          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="000000"
                          maxLength={6}
                          autoFocus
                        />
                        <button
                          className="bg-council hover:bg-council-dark text-white font-medium py-2.5 px-4 rounded-lg text-sm transition disabled:opacity-50 cursor-pointer"
                          disabled={code.length !== 6 || loading}
                          onClick={handleVerify}
                        >
                          {loading ? "..." : "Verify"}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Didn't get it?{" "}
                        <button className="text-link underline hover:no-underline cursor-pointer" onClick={handleSendCode} disabled={loading}>
                          Resend
                        </button>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Verified + token display */}
              {form.email && verified && (
                <>
                  <div className="bg-council-50 border border-council-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-council-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-council" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <div>
                      <span className="font-semibold text-council-800">Email verified</span>
                      <p className="text-sm text-council-700 mt-0.5">Your account will be created when you submit.</p>
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
              <div className="w-16 h-16 rounded-full bg-council-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-council" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
                onClick={() => { setStep("info"); setForm({ name: "", description: "", email: "" }); setCode(""); setCodeSent(false); setVerified(false); setApiAccessToken(""); setError(""); }}
              >
                Start again
              </button>
            </div>
          )}

          <Auth0Badge />
        </div>
      </div>
    </div>
  );
}
