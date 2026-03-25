import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Dramatically reduces compilation time and memory footprint for barrel-exports
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion']
  }
};

export default nextConfig;
