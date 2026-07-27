import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "ykwfjhdjdlzlvyivegps.supabase.co" },
    ],
  },
  experimental: {
    // Upload de foto do barbeiro (até 5 MB) passa pela server action.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
