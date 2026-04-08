import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.backblazeb2.com",
        port: "",
        pathname: "/file/**",
        search: "",
      },
    ],
  },
};

export default nextConfig;
