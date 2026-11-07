import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a self-contained server bundle in `.next/standalone` —
  // deployable to any machine with Node installed, no build tooling needed there.
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  // Keep output file tracing inside this project (avoids workspace-root
  // misdetection when a lockfile exists in a parent directory).
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
