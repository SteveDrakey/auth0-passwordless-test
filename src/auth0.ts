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
): Promise<{
  id_token: string;
  access_token: string;
  refresh_token: string;
  email: string;
  domain: string;
  client_id: string;
}> {
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

// Calls Auth0's /oauth/token directly from the browser (no server hop, no secret).
// Requires the Auth0 Application to be a public client
// (Token Endpoint Authentication Method = None) with the refresh_token grant
// enabled and Allowed Web Origins configured for this origin.
export async function getApiTokenFromSpa(opts: {
  domain: string;
  clientId: string;
  refreshToken: string;
  audience: string;
}): Promise<string> {
  const res = await fetch(`https://${opts.domain}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: opts.clientId,
      refresh_token: opts.refreshToken,
      audience: opts.audience,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error_description || body.error || "Failed to get API token");
  }
  return body.access_token;
}
