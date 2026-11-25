import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The detective "Case Files" experience (public/case) is the homepage.
  // Older experiments: /station/index.html (ISS) and the Ama Dablam app in src/app.
  async redirects() {
    return [{ source: "/", destination: "/case/index.html", permanent: false }];
  },
};

export default nextConfig;
