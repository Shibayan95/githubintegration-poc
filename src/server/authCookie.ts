import { deleteCookie, setCookie } from "@tanstack/react-start/server";

// Single source of truth for the cookie name used across auth helpers and
// the platform's SSO bridge. Must stay in sync with the platform's expectations.
export const APP_AUTH_COOKIE_NAME = "ais-auth-cookie";

// "lax" is the default for normal browser navigation.
// "none" is required when the app runs inside a cross-origin iframe (SSO).
type AppAuthSameSite = "lax" | "none";

// Shared cookie options applied to both set and delete operations.
// "secure: true" ensures the cookie is only sent over HTTPS.
const APP_AUTH_COOKIE_BASE_OPTIONS = {
  path: "/",   // available to all routes
  secure: true,
} as const;

// Writes the auth token into the browser cookie store.
// Pass sameSite="none" when setting the cookie from within an iframe context.
export function setAppAuthCookie(
  token: string,
  sameSite: AppAuthSameSite = "lax",
) {
  setCookie(APP_AUTH_COOKIE_NAME, token, {
    ...APP_AUTH_COOKIE_BASE_OPTIONS,
    sameSite,
  });
}

// Clears the auth cookie on sign-out. Uses the same path/secure options so
// the browser correctly matches and removes the existing cookie.
export function deleteAppAuthCookie() {
  deleteCookie(APP_AUTH_COOKIE_NAME, APP_AUTH_COOKIE_BASE_OPTIONS);
}
