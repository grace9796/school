import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Specify the root directory to avoid workspace detection issues
  experimental: {
    turbo: {
      root: '.',
    },
  },
};

export default nextConfig;
