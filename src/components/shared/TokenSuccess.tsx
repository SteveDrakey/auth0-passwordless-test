import { useMemo } from "react";

export const API_AUDIENCE = "https://tn-dataverse-contact-api";

export function decodeJwt(token: string): { header: Record<string, unknown>; payload: Record<string, unknown> } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const decodePart = (p: string): Record<string, unknown> => {
      const base64 = p.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
      const binary = atob(padded);
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      return JSON.parse(new TextDecoder().decode(bytes));
    };
    return { header: decodePart(parts[0]), payload: decodePart(parts[1]) };
  } catch {
    return null;
  }
}

export function formatTime(epoch: unknown): string | null {
  if (typeof epoch !== "number") return null;
  return new Date(epoch * 1000).toLocaleString();
}

export function scopeLabel(scope: string): { label: string; description: string } {
  const map: Record<string, { label: string; description: string }> = {
    openid: { label: "OpenID", description: "Verify your identity" },
    profile: { label: "Profile", description: "Read your name and picture" },
    email: { label: "Email", description: "Read your email address" },
    "read:contacts": { label: "Read Contacts", description: "View contact records" },
    "write:contacts": { label: "Write Contacts", description: "Create and update contacts" },
    "read:cases": { label: "Read Cases", description: "View case records" },
    "write:cases": { label: "Write Cases", description: "Create and update cases" },
  };
  return map[scope] ?? { label: scope, description: "API permission" };
}

export default function TokenSuccess({ token }: { token: string }) {
  const decoded = useMemo(() => decodeJwt(token), [token]);
  if (!decoded) return null;

  const p = decoded.payload;
  const scopes = typeof p.scope === "string" ? p.scope.split(" ").filter(Boolean) : [];
  const permissions = Array.isArray(p.permissions) ? (p.permissions as string[]) : [];
  const allPerms = [...new Set([...scopes, ...permissions])];
  const exp = formatTime(p.exp);
  const iat = formatTime(p.iat);

  return (
    <div className="space-y-4 mb-6">
      {/* Success banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-emerald-800 text-base">API Access Token Granted</h3>
            <p className="text-sm text-emerald-700 mt-1">
              Auth0 issued a signed JWT for the <code className="bg-emerald-100 px-1.5 py-0.5 rounded text-xs font-mono">{String(p.aud ?? API_AUDIENCE)}</code> API.
            </p>
          </div>
        </div>
      </div>

      {/* Token details card */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {/* Identity */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Identity</div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Subject</span>
              <div className="font-mono text-gray-800 text-xs mt-0.5 break-all">{String(p.sub ?? "\u2014")}</div>
            </div>
            <div>
              <span className="text-gray-500">Issuer</span>
              <div className="font-mono text-gray-800 text-xs mt-0.5 break-all">{String(p.iss ?? "\u2014")}</div>
            </div>
          </div>
        </div>

        {/* Permissions */}
        {allPerms.length > 0 && (
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Permissions & Scopes</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {allPerms.map((s) => {
                const { label, description } = scopeLabel(s);
                return (
                  <div key={s} className="flex items-start gap-2.5 p-2.5 bg-gray-50 rounded-lg">
                    <div className="w-5 h-5 rounded bg-council-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-council" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">{label}</div>
                      <div className="text-xs text-gray-500">{description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Validity */}
        <div className="px-5 py-4">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Validity</div>
          <div className="flex gap-6 text-sm">
            {iat && (
              <div>
                <span className="text-gray-500">Issued</span>
                <div className="text-gray-800 mt-0.5">{iat}</div>
              </div>
            )}
            {exp && (
              <div>
                <span className="text-gray-500">Expires</span>
                <div className="text-gray-800 mt-0.5">{exp}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Copy token */}
      <button
        onClick={() => navigator.clipboard.writeText(token)}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
        </svg>
        Copy raw JWT to clipboard
      </button>
    </div>
  );
}
