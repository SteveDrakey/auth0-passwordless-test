import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, code } = req.body ?? {};
  if (!email || !code) return res.status(400).json({ error: "Email and code are required" });

  const response = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "http://auth0.com/oauth/grant-type/passwordless/otp",
      client_id: process.env.AUTH0_CLIENT_ID,
      client_secret: process.env.AUTH0_CLIENT_SECRET,
      realm: "email",
      username: email,
      otp: code,
      scope: "openid profile email offline_access",
    }),
  });

  const body = await response.json();
  if (!response.ok) return res.status(response.status).json({ error: body.error_description || body.error || "Verification failed" });

  return res.status(200).json({
    id_token: body.id_token,
    access_token: body.access_token,
    refresh_token: body.refresh_token,
    email,
    domain: process.env.AUTH0_DOMAIN,
    client_id: process.env.AUTH0_CLIENT_ID,
  });
}
