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
