import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return [
      {
        source: "/s",
        destination: "/kart",
        permanent: true,
      },
      {
        source: "/p/:slug",
        destination: "/steder/:slug",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
