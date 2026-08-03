import { createServerFn } from "@tanstack/react-start";

export type Capabilities = {
  databaseEnabled: boolean;
  s3Enabled: boolean;
};

export const getCapabilities = createServerFn({ method: "GET" }).handler(
  async (): Promise<Capabilities> => {
    const databaseEnabled = Boolean(process.env.DATABASE_URL);
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
