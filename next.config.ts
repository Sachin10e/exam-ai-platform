import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Explicitly set the turbopack root to the current project directory 
    // to prevent it from finding /Users/sachin_e/package-lock.json
    // @ts-ignore
    turbopack: {
      root: process.cwd()
    }
  }
};

export default nextConfig;
