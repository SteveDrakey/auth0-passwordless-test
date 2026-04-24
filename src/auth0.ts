// All Auth0 calls go through our Vercel serverless functions.
// The backend uses a Regular Web Application with client_secret,
// which has the Passwordless OTP grant type enabled.
// No CORS, no cross-origin, no third-party cookies needed.

async function postJson(
  url: string,
  payload: unknown,
): Promise<{ status: number; body: Record<string, unknown> }> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Network error calling ${url}\n${msg}`);
  }
  let body: Record<string, unknown> = {};
  try {
    body = await res.json();
  } catch {
    body = {};
  }
  return { status: res.status, body };
}

function formatAuth0Error(url: string, status: number, body: Record<string, unknown>): string {
  const parts = [`POST ${url} returned HTTP ${status}`];
  if (body.error) parts.push(`error: ${body.error}`);
  if (body.error_description) parts.push(`error_description: ${body.error_description}`);
  if (body.error_uri) parts.push(`error_uri: ${body.error_uri}`);
  if (!body.error && !body.error_description) parts.push(`body: ${JSON.stringify(body)}`);
  return parts.join("\n");
}

export async function startPasswordless(email: string): Promise<void> {
  const { status, body } = await postJson("/api/send-code", { email });
  if (status < 200 || status >= 300) {
    throw new Error(formatAuth0Error("/api/send-code", status, body));
  }
}

export async function sendMagicLink(email: string): Promise<void> {
  const { status, body } = await postJson("/api/send-link", { email });
  if (status < 200 || status >= 300) {
    throw new Error(formatAuth0Error("/api/send-link", status, body));
  }
}

export async function getMfaLoginUrl(opts?: { loginHint?: string; connection?: string }): Promise<string> {
  const payload: Record<string, string> = {};
  if (opts?.loginHint) payload.login_hint = opts.loginHint;
  if (opts?.connection) payload.connection = opts.connection;
  const { status, body } = await postJson("/api/mfa-login", payload);
  if (status < 200 || status >= 300) {
    throw new Error(formatAuth0Error("/api/mfa-login", status, body));
  }
  return body.url as string;
}

export async function verifyCode(
  email: string,
  code: string,
): Promise<{
  id_token: string;
  access_token: string;
  email: string;
}> {
  const { status, body } = await postJson("/api/verify-code", { email, code });
  if (status < 200 || status >= 300) {
    throw new Error(formatAuth0Error("/api/verify-code", status, body));
  }
  return body as {
    id_token: string;
    access_token: string;
    email: string;
  };
}

/* ── Inline MFA (password + TOTP) ── */

export async function mfaSignup(email: string, password: string): Promise<{ user_id: string }> {
  const { status, body } = await postJson("/api/mfa-signup", { email, password });
  if (status < 200 || status >= 300) {
    throw new Error(formatAuth0Error("/api/mfa-signup", status, body));
  }
  return body as { user_id: string };
}

export async function mfaChallenge(
  email: string,
  password: string,
): Promise<{ mfa_token?: string; access_token?: string; id_token?: string }> {
  const { status, body } = await postJson("/api/mfa-challenge", { email, password });
  if (status < 200 || status >= 300) {
    throw new Error(formatAuth0Error("/api/mfa-challenge", status, body));
  }
  return body as { mfa_token?: string; access_token?: string; id_token?: string };
}

export async function mfaEnrol(mfaToken: string): Promise<{ secret: string; barcode_uri: string }> {
  const { status, body } = await postJson("/api/mfa-enrol", { mfa_token: mfaToken });
  if (status < 200 || status >= 300) {
    throw new Error(formatAuth0Error("/api/mfa-enrol", status, body));
  }
  return body as { secret: string; barcode_uri: string };
}

export async function mfaVerify(
  mfaToken: string,
  otp: string,
): Promise<{ access_token: string; id_token: string; email: string }> {
  const { status, body } = await postJson("/api/mfa-verify", { mfa_token: mfaToken, otp });
  if (status < 200 || status >= 300) {
    throw new Error(formatAuth0Error("/api/mfa-verify", status, body));
  }
  return body as { access_token: string; id_token: string; email: string };
}
