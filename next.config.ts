import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The ISS station experience (public/station) is the homepage.
  // The previous Ama Dablam version is still in src/app and can be removed later.
  async redirects() {
    return [{ source: "/", destination: "/station/index.html", permanent: false }];
  },
};

export default nextConfig;
