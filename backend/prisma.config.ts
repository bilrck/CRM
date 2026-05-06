import { defineConfig } from "@prisma/config";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

export default defineConfig({
  datasource: {
    provider: "postgresql",
    url: process.env.DATABASE_URL!,
  },
});
