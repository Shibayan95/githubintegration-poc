import { APP_AUTH_COOKIE_NAME } from "@/server/authCookie";

export type TRPCContext = {
  request: Request;
  responseHeaders: Headers;
  authToken?: string;
};

export function getCookieFromHeader(
  header: string | null,
  name: string,
): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) {
      return decodeURIComponent(v.join("="));
    }
  }
  return undefined;
}

export function createTRPCContext(opts: {
  request: Request;
  responseHeaders: Headers;
}): TRPCContext {
  const cookieHeader = opts.request.headers.get("cookie");
  const appAuthToken = getCookieFromHeader(cookieHeader, APP_AUTH_COOKIE_NAME);

  return {
    request: opts.request,
    responseHeaders: opts.responseHeaders,
    authToken: appAuthToken,
  };
}
