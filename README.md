# Auth0 Passwordless Demo

A working demonstration of **passwordless email authentication** using Auth0, built as a citizen-facing "Report a problem" form styled after the Leeds City Council website.

The app sends a one-time code to the user's email via Auth0's Passwordless API. Once verified, Auth0 issues a signed JWT access token for the Dataverse Contact API. The UI then displays the token's identity, permissions, and validity in a human-readable format — no raw JSON.

## How it works

1. Citizen fills in a problem report (name + description)
2. Optionally provides an email address
3. If they verify their email with a 6-digit OTP code, Auth0 creates an account and issues an API access token
4. The token grants scoped access to the Dataverse Contact API (`https://tn-dataverse-contact-api`)

All Auth0 calls are proxied through Vercel serverless functions (`/api/send-code`, `/api/verify-code`) so the client secret never reaches the browser.

## Why a Regular Web App, not an SPA

Auth0's documentation generally points you towards using a **Single Page Application** with the `auth0-spa-js` SDK and Universal Login for passwordless flows. For our use case, this presented a few challenges:

- **Universal Login redirect** takes the user away from the form mid-flow. For a simple "verify your email" step embedded in a wizard, keeping everything inline feels much smoother.
- **The `auth0.js` SPA SDK** does support passwordless (`passwordlessStart` / `passwordlessLogin`), but it relies on **cross-origin authentication**, which requires:
  - A custom domain on Auth0 (not just a CNAME — a full custom domain with matching cookies)
  - Third-party cookies enabled in the browser (increasingly restricted by default)
  - Careful CORS and cookie-sharing configuration
- **The Auth0 docs could be clearer on this** — the SPA passwordless examples look straightforward at first glance, but the cross-origin requirements are covered separately. It's easy to run into `login_required` or `consent_required` errors without realising the underlying cause.

This project takes a simpler approach: the **frontend is an SPA** (React + Vite), but **Auth0 sees a Regular Web Application**. The passwordless API calls go through server-side Vercel functions that use a `client_secret`, sidestepping cross-origin concerns entirely. No redirects, no third-party cookies, no Universal Login page — just a clean inline OTP flow.

The tradeoff is that you need a backend (or serverless functions) to proxy the Auth0 calls. For a Vercel-hosted app, this is straightforward — just add files to the `api/` folder.

## Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS 4, Vite
- **Backend:** Vercel serverless functions (Node.js)
- **Auth:** Auth0 Passwordless OTP (email) via a Regular Web Application
- **Hosting:** Vercel

## Environment variables

These are managed in **Vercel Environment Variables** and pulled locally with `vercel env pull`.

| Variable | Where used | Description |
|---|---|---|
| `VITE_AUTH0_DOMAIN` | Frontend | Auth0 tenant domain (e.g. `dataverse-contact-api.uk.auth0.com`) |
| `VITE_AUTH0_CLIENT_ID` | Frontend | Auth0 SPA application client ID |
| `AUTH0_DOMAIN` | API functions | Auth0 tenant domain (server-side) |
| `AUTH0_CLIENT_ID` | API functions | Auth0 Regular Web App client ID |
| `AUTH0_CLIENT_SECRET` | API functions | Auth0 Regular Web App client secret |

The `VITE_`-prefixed variables are exposed to the browser. The non-prefixed ones are only available server-side in the Vercel functions.

## Auth0 configuration

The Auth0 tenant needs:

- A **Regular Web Application** with the Passwordless OTP grant type enabled
- An **email connection** configured for passwordless (connection name: `email`)
- An **API** registered with identifier `https://tn-dataverse-contact-api`
- A **custom domain** (optional): `auth0.dataverse-contact.tnapps.co.uk`

The application's **Allowed Callback URLs**, **Allowed Logout URLs**, **Allowed Web Origins**, and **Allowed Origins** must include any domains the app runs on (e.g. `http://localhost:3000`, the Vercel preview/production URLs).

## Running locally

```bash
npm install
vercel link
vercel env pull
vercel dev
```

The app will be available at `http://localhost:3000`. The `vercel dev` command runs both the Vite dev server and the serverless API functions together.

## Deploying

Push to `main` — Vercel builds and deploys automatically.

```bash
git push origin main
```

## Project structure

```
api/
  send-code.ts       # POST /api/send-code — starts passwordless flow
  verify-code.ts     # POST /api/verify-code — exchanges OTP for tokens
src/
  App.tsx            # Main UI — step wizard, token display
  auth0.ts           # Frontend API client (calls /api/*)
  index.css          # Tailwind + custom colour theme
  main.tsx           # React entry point
```
