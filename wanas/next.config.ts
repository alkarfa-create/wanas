import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";
import { validateSessionSecret } from "./src/lib/session-secret-validation";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

loadEnvConfig(projectRoot);
validateSessionSecret(process.env.SESSION_SECRET);

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'kbhvjneoiodeinqourrf.supabase.co',
        port: '',
        pathname: '**',
      },
    ],
  },
};

export default nextConfig;
