import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental features for server actions
  experimental: {
    // Server actions are enabled by default in Next.js 14+
  },
  // Redirect root to dashboard for authenticated users
  async redirects() {
    return [];
  },
};

export default nextConfig;
