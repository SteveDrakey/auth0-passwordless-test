// All Auth0 calls go through our Vercel serverless functions.
// The backend uses a Regular Web Application with client_secret,
// which has the Passwordless OTP grant type enabled.
// No CORS, no cross-origin, no third-party cookies needed.

export async function startPasswordless(email: string): Promise<void> {
  const res = await fetch("/api/send-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to send code");
  }
}

export async function verifyCode(
  email: string,
  code: string,
): Promise<{ id_token: string; access_token: string; email: string }> {
  const res = await fetch("/api/verify-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || "Verification failed");
  }
  return body;
}
