import { deleteCookie, setCookie } from "@tanstack/react-start/server";

export const APP_AUTH_COOKIE_NAME = "ais-auth-cookie";

type AppAuthSameSite = "lax" | "none";

const APP_AUTH_COOKIE_BASE_OPTIONS = {
  path: "/",
  secure: true,
} as const;

export function setAppAuthCookie(
  token: string,
  sameSite: AppAuthSameSite = "lax",
) {
  setCookie(APP_AUTH_COOKIE_NAME, token, {
    ...APP_AUTH_COOKIE_BASE_OPTIONS,
    sameSite,
  });
}

export function deleteAppAuthCookie() {
  deleteCookie(APP_AUTH_COOKIE_NAME, APP_AUTH_COOKIE_BASE_OPTIONS);
}
