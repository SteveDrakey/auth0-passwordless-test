import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email } = req.body ?? {};
  if (!email) return res.status(400).json({ error: "Email is required" });

  const response = await fetch(`https://${process.env.AUTH0_DOMAIN}/passwordless/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.AUTH0_CLIENT_ID,
      client_secret: process.env.AUTH0_CLIENT_SECRET,
      connection: "email",
      send: "code",
      email,
    }),
  });

  const body = await response.json();
  if (!response.ok) return res.status(response.status).json({ error: body.error_description || body.error || "Failed to send code" });

  return res.status(200).json({ ok: true });
}
