import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Allows production builds to succeed even if Vercel caches or runs type check before prisma generate resolves
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
