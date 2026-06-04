import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@trajct/ui", "@trajct/contracts"],
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
