import "@tanstack/react-start/server-only";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Server-only S3 client using the AWS SDK v3.
 *
 * Why AWS SDK and not Bun.s3: the app's server code runs under **Node.js** in
 * the Vite dev server (where the agent builds/tests), and under **Bun** only in
 * production (`bun run .output/server`). Bun's built-in S3 (`Bun.s3` /
 * `import { S3Client } from "bun"`) is unavailable under Node, so it throws
 * "Cannot find module 'bun'" / "Bun is not defined" during development. The AWS
 * SDK is pure JS and works identically in both runtimes.
 *
 * Credentials are STS temporary triples (S3_ACCESS_KEY + S3_SECRET_KEY +
 * AWS_SESSION_TOKEN) with up to a 12-hour lifetime. The platform delivers them
 * two ways:
 *   • Dev sandboxes  — SandboxEnvInjector rewrites process.env directly when
 *                      creds rotate (also on sandbox resume).
 *   • Deployed apps  — the template calls the platform refresh endpoint:
 *                        GET ${AIS_API_BASE_URL}/enterprise/api/v1/agentic_coding/apps/${APPGEN_APP_ID}/settings/storage/refresh_credentials
 *                      Response: { data: { s3_access_key, s3_secret_key,
 *                                          aws_session_token, s3_bucket,
 *                                          s3_prefix, s3_region } }
 *
 * Refresh policy (belt + braces):
 *   • Proactive — every operation checks age-since-last-refresh; if it exceeds
 *     85% of S3_TOKEN_LIFETIME (platform-injected, default 12h), refresh before
 *     the operation runs. Adapts to whatever lifetime the platform issues.
 *   • Reactive  — operations catch ExpiredToken-style errors and retry once
 *     after refreshing. Handles cases the proactive check misses: AWS rotating
 *     early, sandbox resume across the threshold, env creds aging at boot.
 *
 * Cache:
 *   • Each call reads from process.env so platform env injection is picked up.
 *   • The S3Client is cached by a fingerprint of (access_key, session_token);
 *     rotation invalidates the cache automatically on the next call.
 *
 * App code only deals with relative keys (e.g. "uploads/photo.jpg") — S3_PREFIX
 * is prepended transparently.
 */

const REFRESH_FRACTION = 0.85;
const DEFAULT_TOKEN_LIFETIME_MS = 12 * 60 * 60 * 1000;

function getTokenLifetimeMs(): number {
  const raw = process.env.S3_TOKEN_LIFETIME;
  if (!raw) return DEFAULT_TOKEN_LIFETIME_MS;
  const seconds = Number.parseInt(raw, 10);
  if (!Number.isFinite(seconds) || seconds <= 0)
    return DEFAULT_TOKEN_LIFETIME_MS;
  return seconds * 1000;
}

type S3Config = {
  endpoint?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
  bucket?: string;
  prefix?: string;
};

function readConfig(): S3Config {
  return {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION,
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    bucket: process.env.S3_BUCKET,
    prefix: process.env.S3_PREFIX,
  };
}

function assertConfigured(
  cfg: S3Config,
): asserts cfg is S3Config &
  Required<
    Pick<S3Config, "accessKeyId" | "secretAccessKey" | "bucket" | "prefix">
  > {
  if (
    !cfg.accessKeyId ||
    !cfg.secretAccessKey ||
    !cfg.bucket ||
    !cfg.prefix ||
    !(cfg.endpoint || cfg.region)
  ) {
    throw new Error(
      "S3 is not configured (S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET, S3_PREFIX, and one of S3_ENDPOINT/S3_REGION are required)",
    );
  }
}

let cachedClient: S3Client | null = null;
let cachedFingerprint = "";
// Initially set to process-start; the proactive threshold treats env-injected
// creds as "as old as the process." On the first operation past the threshold
// we refresh, which covers Modal sandbox resume.
let lastRefreshedAt = Date.now();

function getClient(): S3Client {
  const cfg = readConfig();
  assertConfigured(cfg);

  const fingerprint = `${cfg.accessKeyId}:${cfg.sessionToken ?? ""}`;
  if (cachedClient && cachedFingerprint === fingerprint) {
    return cachedClient;
  }

  cachedClient = new S3Client({
    region: cfg.region ?? "us-east-1",
    endpoint: cfg.endpoint, // undefined for AWS; set for MinIO/R2 in local dev
    forcePathStyle: Boolean(cfg.endpoint), // path-style for custom endpoints
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
      sessionToken: cfg.sessionToken, // present for STS, absent for permanent IAM keys
    },
  });
  cachedFingerprint = fingerprint;
  return cachedClient;
}

function bucket(): string {
  // Always read fresh — a refresh may have changed it.
  return process.env.S3_BUCKET as string;
}

function withPrefix(relativeKey: string): string {
  const prefix = (process.env.S3_PREFIX ?? "").replace(/\/+$/, "");
  const key = relativeKey.replace(/^\/+/, "");
  return prefix ? `${prefix}/${key}` : key;
}

// === Credential refresh ===

type RefreshResponse = {
  data: {
    s3_access_key: string;
    s3_secret_key: string;
    aws_session_token: string;
    s3_bucket: string;
    s3_prefix: string;
    s3_region: string;
  };
};

function buildRefreshUrl(): string | null {
  const base = process.env.AIS_API_BASE_URL ?? process.env.VITE_API_BASE_URL;
  const appId = process.env.APPGEN_APP_ID;
  if (!base || !appId) return null;
  return `${base.replace(/\/$/, "")}/enterprise/api/v1/agentic_coding/apps/${appId}/settings/storage/refresh_credentials`;
}

/**
 * The refresh endpoint authenticates as the signed-in user. We read the user's
 * platform token from the auth cookie (set SameSite=None in the deployed iframe,
 * so it IS sent on server-function requests). This only works inside a request
 * context — which is exactly where S3 ops run in an auth-gated app (a user
 * action triggers the server function). Returns undefined outside a request.
 */
async function getRefreshAuthToken(): Promise<string | undefined> {
  try {
    const { getCookie } = await import("@tanstack/react-start/server");
    const { APP_AUTH_COOKIE_NAME } = await import("@/server/authCookie");
    return getCookie(APP_AUTH_COOKIE_NAME) ?? undefined;
  } catch {
    return undefined; // not in a request context
  }
}

/**
 * Fetch a fresh STS triple from the platform and update process.env.
 *
 *   GET  ${AIS_API_BASE_URL}/enterprise/api/v1/agentic_coding/apps/${APPGEN_APP_ID}/settings/storage/refresh_credentials
 *   Headers:
 *     Workspace-Id: ${WORKSPACE_ID}
 *     Authorization: Bearer ${user token from ais-auth-cookie}
 *
 * Returns true if the refresh ran successfully, false if it could not run
 * (no URL/app id, no auth token, or a non-2xx). Never throws — refresh failures
 * are non-fatal so existing creds get one more chance via the reactive retry.
 *
 * The cached S3Client is invalidated; the next call rebuilds it from the new
 * triple.
 */
export async function refreshS3Credentials(): Promise<boolean> {
  const url = buildRefreshUrl();
  if (!url) {
    console.error(
      "[s3] refresh skipped: cannot build refresh URL " +
        `(base=${Boolean(process.env.AIS_API_BASE_URL ?? process.env.VITE_API_BASE_URL)}, ` +
        `appId=${Boolean(process.env.APPGEN_APP_ID)}). ` +
        "Check that AIS_API_BASE_URL/VITE_API_BASE_URL and APPGEN_APP_ID are injected into this sandbox.",
    );
    return false;
  }

  const authToken = await getRefreshAuthToken();
  if (!authToken) {
    console.error(
      "[s3] refresh skipped: no auth token. The user's ais-auth-cookie was not " +
        "available — refresh only works inside an authenticated request (a user " +
        "action). Outside a request context there is no user to authenticate as.",
    );
    return false;
  }

  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Workspace-Id": process.env.WORKSPACE_ID ?? "1",
      Authorization: `Bearer ${authToken}`,
    };

    const res = await fetch(url, { method: "GET", headers });
    if (!res.ok) {
      console.error(
        `[s3] refresh failed: HTTP ${res.status} ${res.statusText} from ${url}`,
      );
      return false;
    }

    const body = (await res.json()) as RefreshResponse;
    const t = body?.data;
    if (!t?.s3_access_key || !t?.aws_session_token) {
      console.error(
        "[s3] refresh failed: response missing s3_access_key/aws_session_token " +
          `(got keys: ${t ? Object.keys(t).join(",") : "no data envelope"})`,
      );
      return false;
    }

    process.env.S3_ACCESS_KEY = t.s3_access_key;
    process.env.S3_SECRET_KEY = t.s3_secret_key;
    process.env.AWS_SESSION_TOKEN = t.aws_session_token;
    if (t.s3_bucket) process.env.S3_BUCKET = t.s3_bucket;
    if (t.s3_prefix) process.env.S3_PREFIX = t.s3_prefix;
    if (t.s3_region) process.env.S3_REGION = t.s3_region;

    cachedClient = null;
    cachedFingerprint = "";
    lastRefreshedAt = Date.now();
    console.log("[s3] credentials refreshed successfully");
    return true;
  } catch (err) {
    console.error("[s3] refresh threw:", err);
    return false;
  }
}

const EXPIRED_TOKEN_CODES = new Set([
  "ExpiredToken",
  "ExpiredTokenException",
  "InvalidToken",
  "TokenRefreshRequired",
]);

function isExpiredCredentialError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as {
    name?: unknown;
    Code?: unknown;
    code?: unknown;
    message?: unknown;
  };
  if (
    (typeof e.name === "string" && EXPIRED_TOKEN_CODES.has(e.name)) ||
    (typeof e.Code === "string" && EXPIRED_TOKEN_CODES.has(e.Code)) ||
    (typeof e.code === "string" && EXPIRED_TOKEN_CODES.has(e.code))
  ) {
    return true;
  }
  // Fallback on the well-known AWS message ("The provided token has expired.")
  // in case the SDK surfaces an unexpected error name/code.
  return typeof e.message === "string" && /token .*expired/i.test(e.message);
}

/** Proactive: refresh if we're past 85% of the token's lifetime. No-op otherwise. */
async function maybeProactiveRefresh(): Promise<void> {
  const refreshAfterMs = getTokenLifetimeMs() * REFRESH_FRACTION;
  if (Date.now() - lastRefreshedAt < refreshAfterMs) return;
  await refreshS3Credentials();
}

/** Reactive wrapper: retries once after a refresh on ExpiredToken-style errors. */
async function withRefresh<T>(fn: () => Promise<T>): Promise<T> {
  await maybeProactiveRefresh();
  try {
    return await fn();
  } catch (err) {
    if (!isExpiredCredentialError(err)) throw err;
    console.warn(
      `[s3] expired-credential error (${(err as { name?: string })?.name ?? "?"}); refreshing and retrying once`,
    );
    const refreshed = await refreshS3Credentials();
    if (!refreshed) {
      console.error(
        "[s3] refresh did not succeed; re-throwing the original expired-credential error",
      );
      throw err;
    }
    return fn();
  }
}

// === Public API ===

export type UploadInput = string | Uint8Array | ArrayBuffer | Blob;

async function toBody(data: UploadInput): Promise<string | Uint8Array> {
  if (typeof data === "string" || data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  // Blob / File — read into memory so the SDK can set Content-Length.
  return new Uint8Array(await data.arrayBuffer());
}

/**
 * Upload to S3 at S3_PREFIX + relativeKey. Auto-refreshes credentials.
 * Accepts string / Uint8Array / ArrayBuffer / Blob (File).
 */
export async function uploadFile(
  relativeKey: string,
  data: UploadInput,
  options?: { contentType?: string },
): Promise<void> {
  const Body = await toBody(data);
  await withRefresh(() =>
    getClient().send(
      new PutObjectCommand({
        Bucket: bucket(),
        Key: withPrefix(relativeKey),
        Body,
        ContentType: options?.contentType,
      }),
    ),
  );
}

/**
 * Download from S3. Returns the bytes, or null if the object does not exist.
 * Auto-refreshes credentials.
 */
export async function downloadFile(
  relativeKey: string,
): Promise<Uint8Array | null> {
  return withRefresh(async () => {
    try {
      const res = await getClient().send(
        new GetObjectCommand({
          Bucket: bucket(),
          Key: withPrefix(relativeKey),
        }),
      );
      if (!res.Body) return null;
      return await res.Body.transformToByteArray();
    } catch (err) {
      const name = (err as { name?: string })?.name;
      if (name === "NoSuchKey" || name === "NotFound") return null;
      throw err;
    }
  });
}

/** Delete one object. Auto-refreshes credentials. */
export async function deleteFile(relativeKey: string): Promise<void> {
  await withRefresh(() =>
    getClient().send(
      new DeleteObjectCommand({
        Bucket: bucket(),
        Key: withPrefix(relativeKey),
      }),
    ),
  );
}

/**
 * Time-limited presigned URL.
 *   method "GET" (default) — download URL for serving private files.
 *   method "PUT"           — direct browser upload URL (bytes skip your server).
 * Default expiry 1 hour. Proactively refreshes if past the lifetime threshold
 * so the URL gets the maximum lifetime AWS allows (capped by STS expiry).
 */
export async function getPresignedUrl(
  relativeKey: string,
  options?: { expiresIn?: number; method?: "GET" | "PUT" },
): Promise<string> {
  await maybeProactiveRefresh();
  const Key = withPrefix(relativeKey);
  const Bucket = bucket();
  const command =
    options?.method === "PUT"
      ? new PutObjectCommand({ Bucket, Key })
      : new GetObjectCommand({ Bucket, Key });
  return getSignedUrl(getClient(), command, {
    expiresIn: options?.expiresIn ?? 3600,
  });
}
