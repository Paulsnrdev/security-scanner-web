import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The CLI project one level up also has a package-lock.json, which makes
  // Next.js guess the workspace root ambiguously — pin it explicitly.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
