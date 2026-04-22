import { useEffect, useState } from "react";
import { startPasswordless, verifyCode, parseHash } from "./auth0";

type Step = "info" | "email" | "review" | "done";

interface FormData {
  name: string;
  description: string;
  email: string;
}

function StepIndicator({ current }: { current: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "info", label: "Your request" },
    { key: "email", label: "Your details" },
    { key: "review", label: "Review & submit" },
  ];
  const idx = steps.findIndex((s) => s.key === current);

  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
      {steps.map((s, i) => (
        <div
          key={s.key}
          style={{
            flex: 1,
            padding: "8px 0",
            textAlign: "center",
            borderBottom: i <= idx ? "3px solid #0057b8" : "3px solid #ddd",
            color: i <= idx ? "#0057b8" : "#999",
            fontWeight: i === idx ? 700 : 400,
            fontSize: 14,
          }}
        >
          {i + 1}. {s.label}
        </div>
      ))}
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

  // Check if returning from Auth0 redirect after code verification
  useEffect(() => {
    async function checkRedirect() {
      try {
        const result = await parseHash();
        if (result) {
          console.log("Authenticated!", result);
          const raw = sessionStorage.getItem("passwordless-form");
          if (raw) {
            try {
              setForm(JSON.parse(raw));
            } catch { /* ignore */ }
            sessionStorage.removeItem("passwordless-form");
          }
          setVerified(true);
          setStep("done");
        }
      } catch (e) {
        console.error("Auth redirect error:", e);
        setError(e instanceof Error ? e.message : "Authentication failed");
      }
    }
    checkRedirect();
  }, []);

  async function handleSendCode() {
    if (!form.email) return;
    setError("");
    setLoading(true);
    try {
      await startPasswordless(form.email);
      setCodeSent(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to send code");
    } finally {
      setLoading(false);
    }
  }

  function handleVerify() {
    if (code.length !== 6) return;
    setError("");
    setLoading(true);
    // Save form state before redirect
    sessionStorage.setItem("passwordless-form", JSON.stringify(form));
    // This will redirect to Auth0 and back
    verifyCode(form.email, code);
  }

  function handleSubmit() {
    setStep("done");
  }

  return (
    <div style={{ maxWidth: 520, margin: "40px auto", fontFamily: "system-ui, sans-serif", padding: "0 20px" }}>
      <h1 style={{ color: "#0057b8", marginBottom: 4 }}>Report a problem</h1>
      <p style={{ color: "#666", marginTop: 0, marginBottom: 24 }}>Passwordless auth test</p>

      {step !== "done" && <StepIndicator current={step} />}

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 6, padding: "10px 14px", marginBottom: 16, color: "#b91c1c", fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Step 1: Capture the request */}
      {step === "info" && (
        <div>
          <label style={labelStyle}>What's your name?</label>
          <input
            style={inputStyle}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Sam Drake"
          />

          <label style={labelStyle}>Describe the problem</label>
          <textarea
            style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="e.g. The streetlight outside 42 Oak Road has been out for a week"
          />

          <button
            style={btnStyle}
            disabled={!form.name || !form.description}
            onClick={() => setStep("email")}
          >
            Next
          </button>
        </div>
      )}

      {/* Step 2: Optional email */}
      {step === "email" && (
        <div>
          <label style={labelStyle}>Email address (optional)</label>
          <input
            style={inputStyle}
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
            autoFocus
          />

          <div style={infoBoxStyle}>
            <strong>Why provide an email?</strong>
            <p style={{ margin: "6px 0 0" }}>
              If you provide your email, we can send you updates about your case.
              On the next step you'll have the option to verify it with a one-time code -
              this creates an account so you can track progress and see updates online.
            </p>
            <p style={{ margin: "6px 0 0" }}>
              You can also skip this entirely and submit without an email. Your request
              will still be processed, but we won't be able to contact you about it.
            </p>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button style={btnSecondaryStyle} onClick={() => setStep("info")}>
              Back
            </button>
            <button
              style={btnStyle}
              onClick={() => { setCodeSent(false); setCode(""); setVerified(false); setError(""); setStep("review"); }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review, optional verify, and submit */}
      {step === "review" && (
        <div>
          <div style={{ background: "#f0f4f8", borderRadius: 8, padding: "16px 20px", marginBottom: 20 }}>
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: "#666", fontSize: 13 }}>Name</span>
              <div style={{ fontWeight: 600 }}>{form.name}</div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: "#666", fontSize: 13 }}>Problem</span>
              <div>{form.description}</div>
            </div>
            <div>
              <span style={{ color: "#666", fontSize: 13 }}>Email</span>
              <div>{form.email || <span style={{ color: "#999" }}>Not provided</span>}</div>
            </div>
          </div>

          {/* No email - anonymous */}
          {!form.email && (
            <div style={infoBoxStyle}>
              You're submitting anonymously. We won't be able to send you updates.
              You can <button style={linkBtnStyle} onClick={() => setStep("email")}>go back</button> to
              add an email if you'd like.
            </div>
          )}

          {/* Email provided but not verified */}
          {form.email && !verified && (
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "16px 20px", marginBottom: 20 }}>
              <strong>Want to track your case online?</strong>
              <p style={{ margin: "6px 0 0", color: "#333", lineHeight: 1.5 }}>
                Verify your email to create an account. This lets you check the status
                of your request and receive updates. If you'd rather not, just hit submit -
                your request will still be processed.
              </p>

              {!codeSent ? (
                <button
                  style={{ ...btnStyle, marginTop: 12 }}
                  disabled={loading}
                  onClick={handleSendCode}
                >
                  {loading ? "Sending..." : "Send me a verification code"}
                </button>
              ) : (
                <div style={{ marginTop: 12 }}>
                  <p style={{ color: "#333", fontSize: 14, margin: "0 0 8px" }}>
                    We've sent a 6-digit code to <strong>{form.email}</strong>
                  </p>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      style={{ ...inputStyle, fontSize: 20, letterSpacing: 6, textAlign: "center", width: 180, marginBottom: 0 }}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      autoFocus
                    />
                    <button
                      style={btnStyle}
                      disabled={code.length !== 6 || loading}
                      onClick={handleVerify}
                    >
                      {loading ? "..." : "Verify"}
                    </button>
                  </div>
                  <p style={{ color: "#999", fontSize: 13, marginTop: 8 }}>
                    Didn't get it?{" "}
                    <button style={linkBtnStyle} onClick={handleSendCode} disabled={loading}>
                      Resend code
                    </button>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Verified */}
          {form.email && verified && (
            <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 24 }}>&#10003;</span>
              <div>
                <strong style={{ color: "#16a34a" }}>Email verified</strong>
                <p style={{ margin: "4px 0 0", color: "#333", fontSize: 14 }}>
                  Your account will be created when you submit. You'll be able to
                  track this case and receive updates.
                </p>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <button style={btnSecondaryStyle} onClick={() => setStep("email")}>
              Back
            </button>
            <button style={btnStyle} onClick={handleSubmit}>
              {form.email && verified
                ? "Submit"
                : form.email
                  ? "Submit without verifying"
                  : "Submit anonymously"
              }
            </button>
          </div>
        </div>
      )}

      {/* Done */}
      {step === "done" && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#10003;</div>
          <h2 style={{ color: "#16a34a" }}>Submitted!</h2>
          <p style={{ color: "#333", lineHeight: 1.5 }}>
            Thanks <strong>{form.name}</strong>, your request has been submitted.
          </p>
          {form.email && verified && (
            <p style={{ color: "#333", lineHeight: 1.5 }}>
              Your account has been created with <strong>{form.email}</strong>.
              You can use this to track your case and receive updates.
            </p>
          )}
          {form.email && !verified && (
            <p style={{ color: "#666", lineHeight: 1.5 }}>
              We have your email (<strong>{form.email}</strong>) but it wasn't verified,
              so we can't link this to an account. We may still use it to contact you.
            </p>
          )}
          {!form.email && (
            <p style={{ color: "#666", lineHeight: 1.5 }}>
              You submitted anonymously. We won't be able to send updates,
              but your request will still be processed.
            </p>
          )}
          <p style={{ color: "#999", fontSize: 13, marginTop: 16 }}>
            (Check the browser console for Auth0 tokens if verified)
          </p>
          <button style={{ ...btnStyle, marginTop: 8 }} onClick={() => { setStep("info"); setForm({ name: "", description: "", email: "" }); setCode(""); setCodeSent(false); setVerified(false); setError(""); }}>
            Start again
          </button>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: 600,
  fontSize: 14,
  marginBottom: 6,
  marginTop: 16,
  color: "#333",
};

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "10px 12px",
  fontSize: 16,
  border: "1px solid #ccc",
  borderRadius: 6,
  boxSizing: "border-box",
  marginBottom: 16,
};

const btnStyle: React.CSSProperties = {
  background: "#0057b8",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "12px 24px",
  fontSize: 16,
  cursor: "pointer",
  fontWeight: 600,
};

const btnSecondaryStyle: React.CSSProperties = {
  background: "#fff",
  color: "#333",
  border: "1px solid #ccc",
  borderRadius: 6,
  padding: "12px 24px",
  fontSize: 16,
  cursor: "pointer",
};

const linkBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#0057b8",
  cursor: "pointer",
  fontSize: "inherit",
  textDecoration: "underline",
  padding: 0,
};

const infoBoxStyle: React.CSSProperties = {
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: "16px 20px",
  marginBottom: 20,
  color: "#555",
  fontSize: 14,
  lineHeight: 1.5,
};
