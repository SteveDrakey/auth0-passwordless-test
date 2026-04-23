import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { mfa_token, otp } = req.body ?? {};
  if (!mfa_token || !otp) return res.status(400).json({ error: "mfa_token and otp are required" });

  try {
    const response = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "http://auth0.com/oauth/grant-type/mfa-otp",
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        mfa_token,
        otp,
      }),
    });

    const body = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: body.error_description || body.error || "MFA verification failed" });
    }

    // Decode the id_token to extract the email
    let email = "";
    if (body.id_token) {
      try {
        const payload = body.id_token.split(".")[1];
        const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
        email = decoded.email || "";
      } catch {
        // ignore decode errors
      }
    }

    return res.status(200).json({
      access_token: body.access_token,
      id_token: body.id_token,
      email,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}
