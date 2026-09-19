import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // The Next.js image optimizer runs inside the frontend container/process,
    // which has no network path to the backend's /uploads files (different
    // container in dev, no shared volume in prod) — every optimized <Image>
    // pointed at a backend photo fails silently. Serving images unoptimized
    // makes the browser fetch them directly, the same way plain API calls do.
    unoptimized: true,
  },
  output: 'standalone',
  reactStrictMode: true,
};

export default nextConfig;
