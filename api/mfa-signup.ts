import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

  try {
    // Use the public signup endpoint — no Management API needed
    const signupRes = await fetch(`https://${process.env.AUTH0_DOMAIN}/dbconnections/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.AUTH0_CLIENT_ID,
        email,
        password,
        connection: "Username-Password-Authentication",
      }),
    });

    const body = await signupRes.json();

    if (signupRes.ok) {
      return res.status(200).json({ user_id: body._id });
    }

    // User already exists — that's fine, they can sign in
    if (body.code === "user_exists" || signupRes.status === 409) {
      return res.status(200).json({ user_id: "existing" });
    }

    return res.status(signupRes.status).json({
      error: body.description || body.message || body.error || "Failed to create user",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}
