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
          reject(new Error(err.description || err.error_description || (err as any).message || "Failed to send code"));
        } else {
          resolve();
        }
      },
    );
  });
}

// Step 2: Verify the OTP code using passwordlessLogin.
// On same-site domains (app on tnapps.co.uk, auth0 on auth0.dataverse-contact.tnapps.co.uk)
// this uses cross-origin auth with same-site cookies - no third-party cookie issues.
export function verifyCode(email: string, code: string): Promise<void> {
  return new Promise((resolve, reject) => {
    webAuth.passwordlessLogin(
      {
        connection: "email",
        email,
        verificationCode: code,
      },
      (err) => {
        if (err) {
          reject(new Error(err.description || err.error_description || (err as any).message || "Verification failed"));
        } else {
          resolve();
        }
      },
    );
  });
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
