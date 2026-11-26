import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    // old static entry point
    return [{ source: '/case/index.html', destination: '/', permanent: true }];
  },
};

export default nextConfig;
