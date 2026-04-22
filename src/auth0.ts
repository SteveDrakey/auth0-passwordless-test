// All Auth0 calls go through our Vercel serverless functions.
// The backend uses a Regular Web Application with client_secret,
// which has the Passwordless OTP grant type enabled.
// No CORS, no cross-origin, no third-party cookies needed.

async function postJson(
  url: string,
  payload: unknown,
  crossOriginHint = false,
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
    const hint = crossOriginHint
      ? `\n\nThe browser fetch threw before a response came back. In Safari this shows as "Load failed"; in Chrome as "TypeError: Failed to fetch". Almost always this is CORS — add '${location.origin}' to the Auth0 Application's Allowed Web Origins. It can also be a bad domain, offline, or a blocked request.`
      : "";
    throw new Error(`Network error calling ${url}\n${msg}${hint}`);
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
  refresh_token: string;
  email: string;
  domain: string;
  client_id: string;
}> {
  const { status, body } = await postJson("/api/verify-code", { email, code });
  if (status < 200 || status >= 300) {
    throw new Error(formatAuth0Error("/api/verify-code", status, body));
  }
  return body as {
    id_token: string;
    access_token: string;
    refresh_token: string;
    email: string;
    domain: string;
    client_id: string;
  };
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
  const url = `https://${opts.domain}/oauth/token`;
  const { status, body } = await postJson(
    url,
    {
      grant_type: "refresh_token",
      client_id: opts.clientId,
      refresh_token: opts.refreshToken,
      audience: opts.audience,
    },
    true,
  );
  if (status < 200 || status >= 300) {
    throw new Error(formatAuth0Error(url, status, body));
  }
  const token = body.access_token;
  if (typeof token !== "string" || !token) {
    throw new Error(`${url} returned 200 with no access_token. Body: ${JSON.stringify(body)}`);
  }
  return token;
}
