import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NEXTAUTH_SECRET: z.string().min(1),
    NEXTAUTH_URL: z.string().url().optional(),
    APP_PASSWORD: z.string().min(1).optional(),
    APP_PASSWORD_HASH: z.string().min(1).optional(),
    TELLER_ACCESS_TOKEN: z.string().optional(),
    TELLER_CERT_PATH: z.string().optional(),
    TELLER_KEY_PATH: z.string().optional(),
    TELLER_API_BASE: z
      .string()
      .url()
      .default("https://api.teller.io"),
  },
  runtimeEnv: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    APP_PASSWORD: process.env.APP_PASSWORD,
    APP_PASSWORD_HASH: process.env.APP_PASSWORD_HASH,
    TELLER_ACCESS_TOKEN: process.env.TELLER_ACCESS_TOKEN,
    TELLER_CERT_PATH: process.env.TELLER_CERT_PATH,
    TELLER_KEY_PATH: process.env.TELLER_KEY_PATH,
    TELLER_API_BASE: process.env.TELLER_API_BASE,
  },
});
