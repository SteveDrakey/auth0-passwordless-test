import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const code = req.query.code as string | undefined;
  const state = req.query.state as string | undefined;

  if (!code) {
    const errorMsg = (req.query.error_description as string) || (req.query.error as string) || "No authorization code received";
    return res.redirect(`/#mfa-error?error=${encodeURIComponent(errorMsg)}`);
  }

  const proto = (req.headers["x-forwarded-proto"] as string) || "https";
  const host = (req.headers["x-forwarded-host"] as string) || req.headers.host || "localhost:3000";
  const origin = host.includes("localhost") ? `http://${host}` : `${proto}://${host}`;
  const callbackUrl = `${origin}/api/mfa-callback`;

  try {
    const response = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        code,
        redirect_uri: callbackUrl,
      }),
    });

    const body = await response.json();

    if (!response.ok) {
      const errorMsg = body.error_description || body.error || "Token exchange failed";
      return res.redirect(`/#mfa-error?error=${encodeURIComponent(errorMsg)}`);
    }

    const fragment = new URLSearchParams();
    if (body.access_token) fragment.set("access_token", body.access_token);
    if (body.id_token) fragment.set("id_token", body.id_token);
    if (state) fragment.set("state", state);

    return res.redirect(`/#mfa-complete?${fragment.toString()}`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.redirect(`/#mfa-error?error=${encodeURIComponent(msg)}`);
  }
}
