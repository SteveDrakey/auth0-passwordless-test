import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

  try {
    const response = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "password",
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        username: email,
        password,
        scope: "openid profile email",
        audience: "https://tn-dataverse-contact-api",
      }),
    });

    const body = await response.json();

    // MFA required — return the mfa_token
    if (response.status === 403 && body.error === "mfa_required") {
      return res.status(200).json({ mfa_token: body.mfa_token });
    }

    // Success without MFA — return tokens directly
    if (response.ok) {
      return res.status(200).json({
        access_token: body.access_token,
        id_token: body.id_token,
      });
    }

    return res.status(response.status).json({ error: body.error_description || body.error || "Authentication failed" });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}
