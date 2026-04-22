import auth0 from "auth0-js";

const AUTH0_DOMAIN = import.meta.env.VITE_AUTH0_DOMAIN as string;
const AUTH0_CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID as string;

if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID) {
  throw new Error("Set VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID in .env.local");
}

const webAuth = new auth0.WebAuth({
  domain: AUTH0_DOMAIN,
  clientID: AUTH0_CLIENT_ID,
  responseType: "token id_token",
  scope: "openid profile email",
  redirectUri: window.location.origin,
});

// Step 1: Send the OTP code to the user's email
export function startPasswordless(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    webAuth.passwordlessStart(
      {
        connection: "email",
        send: "code",
        email,
      },
      (err) => {
        if (err) {
          reject(new Error(err.description || err.error_description || err.message || "Failed to send code"));
        } else {
          resolve();
        }
      },
    );
  });
}

// Step 2: Verify the code via redirect to /authorize.
// Uses passwordlessVerify directly (skips /co/authenticate which needs
// the Passwordless OTP grant type that Auth0 doesn't allow on SPAs).
// This redirects the user to Auth0, verifies the code, and redirects back
// with tokens in the URL hash.
export function verifyCode(email: string, code: string): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (webAuth as any).passwordlessVerify(
    {
      connection: "email",
      email,
      verificationCode: code,
    },
    (err: auth0.Auth0Error | null) => {
      if (err) {
        console.error("Verify redirect error:", err);
      }
      // On success, the browser redirects - we never reach here
    },
  );
}

// Parse tokens from the URL hash after redirect back from Auth0
export function parseHash(): Promise<auth0.Auth0DecodedHash | null> {
  return new Promise((resolve, reject) => {
    if (!window.location.hash) {
      resolve(null);
      return;
    }
    webAuth.parseHash((err, result) => {
      if (err) {
        reject(new Error(err.errorDescription || err.error || "Failed to parse tokens"));
      } else {
        window.history.replaceState(null, "", window.location.pathname);
        resolve(result);
      }
    });
  });
}
