import type { VercelRequest, VercelResponse } from "@vercel/node";

async function getManagementToken(): Promise<string> {
  const res = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: process.env.AUTH0_MGMT_CLIENT_ID,
      client_secret: process.env.AUTH0_MGMT_CLIENT_SECRET,
      audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error_description || body.error || "Failed to get management token");
  return body.access_token;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

  try {
    const mgmtToken = await getManagementToken();

    // Try to create the user
    const createRes = await fetch(`https://${process.env.AUTH0_DOMAIN}/api/v2/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mgmtToken}`,
      },
      body: JSON.stringify({
        email,
        password,
        connection: "Username-Password-Authentication",
        email_verified: true,
      }),
    });

    const createBody = await createRes.json();

    if (createRes.ok) {
      return res.status(200).json({ user_id: createBody.user_id });
    }

    // If user already exists (409), look them up
    if (createRes.status === 409) {
      const lookupRes = await fetch(
        `https://${process.env.AUTH0_DOMAIN}/api/v2/users-by-email?email=${encodeURIComponent(email)}`,
        { headers: { Authorization: `Bearer ${mgmtToken}` } },
      );
      const users = await lookupRes.json();
      if (!lookupRes.ok || !Array.isArray(users) || users.length === 0) {
        return res.status(409).json({ error: "User exists but could not be looked up" });
      }
      return res.status(200).json({ user_id: users[0].user_id });
    }

    return res.status(createRes.status).json({ error: createBody.message || createBody.error || "Failed to create user" });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}
