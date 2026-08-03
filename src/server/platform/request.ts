import { TRPCError } from "@trpc/server";
import { env as clientEnv } from "@/env/client";
import { env as serverEnv } from "@/env/server";

import type { TRPCContext } from "@/integrations/trpc/context";

type PlatformMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export type PlatformFetchProps<Payload> = {
  url: string;
  method: PlatformMethod;
  data?: Payload;
  contentType?: "json" | "form";
  options?: {
    headers?: Record<string, string>;
    params?: Record<string, string | number | boolean | undefined>;
  };
};

export type RequestScope = "api" | "enterprise";

function buildUrl(
  base: string,
  params?: Record<string, string | number | boolean | undefined>,
): string {
  if (!params) return base;
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null,
  ) as [string, string][];
  if (entries.length === 0) return base;
  return `${base}?${new URLSearchParams(Object.fromEntries(entries)).toString()}`;
}

function buildScopeBase(scope: RequestScope): string {
  const root = clientEnv.VITE_API_BASE_URL.replace(/\/$/, "");
  if (scope === "api") {
    return `${root}/api/v1`;
  }
  return `${root}/enterprise/api/v1`;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

async function handleErrorResponse(response: Response): Promise<never> {
  let message = `AIS API request failed with status ${String(response.status)}`;
  try {
    const body: unknown = await parseResponse<unknown>(response);
    if (body && typeof body === "object" && "message" in body) {
      const m = (body as { message?: unknown }).message;
      if (m != null) message = String(m);
    }
  } catch {
    // keep default message
  }

  if (response.status === 401) {
    throw new TRPCError({ code: "UNAUTHORIZED", message });
  }

  throw new TRPCError({ code: "BAD_REQUEST", message });
}

/**
 * Central platform HTTP helper: auth header, workspace, 401 → UNAUTHORIZED.
 */
export async function platformRequest<Payload, ResponseType>(
  ctx: TRPCContext,
  scope: RequestScope,
  {
    url,
    method,
    data,
    options,
    contentType = "json",
  }: PlatformFetchProps<Payload>,
): Promise<ResponseType> {
  const fullPath = url.startsWith("/") ? url.slice(1) : url;
  const requestUrl = buildUrl(
    `${buildScopeBase(scope)}/${fullPath}`,
    options?.params,
  );

  const headers = new Headers();
  headers.set("Accept", "*/*");
  headers.set("Workspace-Id", serverEnv.WORKSPACE_ID);

  for (const [k, v] of Object.entries(options?.headers ?? {})) {
    if (v !== undefined) headers.set(k, v);
  }

  if (serverEnv.AIS_AUTH_ENABLED && ctx.authToken) {
    headers.set("Authorization", `Bearer ${ctx.authToken}`);
  }

  const init: RequestInit = { method, headers };

  if (data !== undefined) {
    if (contentType === "form") {
      init.body = data as BodyInit;
    } else {
      headers.set("Content-Type", "application/json");
      init.body = JSON.stringify(data);
    }
  }

  const res = await fetch(requestUrl, init);

  if (!res.ok) {
    return handleErrorResponse(res);
  }
  return parseResponse<ResponseType>(res);
}
