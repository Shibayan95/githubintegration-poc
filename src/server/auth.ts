import { createServerFn } from "@tanstack/react-start";
import { env } from "@/env/server";
import { APP_AUTH_COOKIE_NAME } from "@/server/authCookie";
import { getCookie } from "@tanstack/react-start/server";

export type AuthState = {
  allowed: boolean;
  authEnabled: boolean;
  hasToken: boolean;
};

/**
 * Auth guard for route `beforeLoad`. Not used for public routes.
 */
export const getAuthState = createServerFn({ method: "GET" }).handler(
  async (): Promise<AuthState> => {
    const token = getCookie(APP_AUTH_COOKIE_NAME);
    const authEnabled = env.AIS_AUTH_ENABLED;
    return {
      allowed: !authEnabled || Boolean(token),
      authEnabled,
      hasToken: Boolean(token),
    };
  },
);
