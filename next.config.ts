import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.11.4", "192.168.11.19"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
