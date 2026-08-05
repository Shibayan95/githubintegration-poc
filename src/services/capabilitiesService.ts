import { createServerFn } from "@tanstack/react-start";

// Shape returned to the client — never expose raw env var values,
// only the derived boolean flags.
export type Capabilities = {
  databaseEnabled: boolean;
  s3Enabled: boolean;
};

// Server function that inspects environment variables to determine which
// platform features are available in the current deployment.
// This runs on the server so secrets are never sent to the browser.
export const getCapabilities = createServerFn({ method: "GET" }).handler(
  async (): Promise<Capabilities> => {
    // Database is available when Neon's connection string is injected.
    const databaseEnabled = Boolean(process.env.DATABASE_URL);

    // S3 requires both an endpoint/region AND bucket, credentials, and a key
    // prefix. All five must be present for uploads/downloads to work.
    const s3Enabled = Boolean(
      (process.env.S3_ENDPOINT || process.env.S3_REGION) &&
        process.env.S3_BUCKET &&
        process.env.S3_ACCESS_KEY &&
        process.env.S3_SECRET_KEY &&
        process.env.S3_PREFIX,
    );
    return { databaseEnabled, s3Enabled };
  },
);
