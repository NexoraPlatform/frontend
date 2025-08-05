/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: false,
    domains: ['images.pexels.com', 'localhost']
  },
  experimental: {
    optimizeCss: true,
    serverComponentsExternalPackages: ['bcryptjs']
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://127.0.0.1:3000',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'your-secret-key-here',
  },
  // Fix for process exit error
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Disable webpack cache to prevent issues
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

module.exports = nextConfig;
