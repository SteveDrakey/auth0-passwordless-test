import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { mfa_token } = req.body ?? {};
  if (!mfa_token) return res.status(400).json({ error: "mfa_token is required" });

  try {
    const response = await fetch(`https://${process.env.AUTH0_DOMAIN}/mfa/associate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mfa_token}`,
      },
      body: JSON.stringify({
        authenticator_types: ["otp"],
      }),
    });

    const body = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: body.error_description || body.error || "Failed to associate authenticator" });
    }

    return res.status(200).json({
      secret: body.secret,
      barcode_uri: body.barcode_uri,
      recovery_codes: body.recovery_codes,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}
