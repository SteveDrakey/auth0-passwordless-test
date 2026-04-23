import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const state = crypto.randomUUID();

  const proto = (req.headers["x-forwarded-proto"] as string) || "https";
  const host = (req.headers["x-forwarded-host"] as string) || req.headers.host || "localhost:3000";
  const origin = host.includes("localhost") ? `http://${host}` : `${proto}://${host}`;
  const callbackUrl = `${origin}/api/mfa-callback`;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.AUTH0_CLIENT_ID!,
    redirect_uri: callbackUrl,
    scope: "openid profile email",
    audience: "https://tn-dataverse-contact-api",
    connection: "Username-Password-Authentication",
    state,
  });

  const url = `https://${process.env.AUTH0_DOMAIN}/authorize?${params.toString()}`;

  return res.status(200).json({ url, state });
}
