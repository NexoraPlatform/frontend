const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  reactCompiler: true,
  // Compiler optimizations with modern JS target
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,

    // React optimizations
    reactRemoveProperties: process.env.NODE_ENV === 'production' ? {
      properties: ['^data-testid$']
    } : false,
  },

  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // Modern browser optimizations
  modularizeImports: {
    'lodash': {
      transform: 'lodash/{{member}}',
    },
    'react-icons': {
      transform: 'react-icons/{{member}}',
    },
    '@mui/icons-material': {
      transform: '@mui/icons-material/{{member}}',
    },
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
      {
        protocol: 'https',
        hostname: 'trustora.ro',
      },
      {
        protocol: 'https',
        hostname: 'preview.trustora.ro',
      },
      {
        protocol: 'https',
        hostname: 'backend.trustora.ro',
      },
      {
        protocol: 'https',
        hostname: 'previewbe.trustora.ro',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      }
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Experimental features for performance
  experimental: {
    // Package imports optimization
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-slot',
      'class-variance-authority',
      'date-fns',
      '@mui/material',
      '@mui/icons-material',
      '@mui/x-date-pickers',
      'lodash'
    ],
  },

  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // Static export optimization
  trailingSlash: false,

  // Production source maps for debugging (optional)
  productionBrowserSourceMaps: false,

  // Modern headers with security optimizations
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    const securityHeaders = [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Accept-CH',
            value: 'Viewport-Width, Width, DPR',
          },
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ''}
                https://www.googletagmanager.com
                https://cdn.onesignal.com
                https://onesignal.com
                https://api.onesignal.com
                https://cdn.cookie-script.com
                https://backend.trustora.ro;
              style-src 'self' 'unsafe-inline'
                https://cdn.cookie-script.com;
              img-src 'self' data: blob: https:
                http://127.0.0.1:8000
                https://trustorabe.dacars.ro
                https://backend.trustora.ro
                https://previewbe.trustora.ro;
              font-src 'self' data:;
              connect-src 'self'
                https://trustorabe.dacars.ro
                https://backend.trustora.ro
                https://previewbe.trustora.ro
                https://www.google-analytics.com
                https://cdn.onesignal.com
                https://onesignal.com
                https://api.onesignal.com
                https://cdn.cookie-script.com
                ${isDev ? 'http://127.0.0.1:8000 http://localhost:8000 ws: wss:' : ''};
              frame-src 'self' https://onesignal.com;
              frame-ancestors 'none';
              base-uri 'self';
              form-action 'self';
              sandbox allow-forms allow-scripts allow-same-origin allow-popups allow-downloads;
            `.replace(/\s+/g, ' ').trim(),
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];

    const staticAssetCachingHeaders = [
      {
        source: '/(.*).(jpg|jpeg|png|gif|ico|svg|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];

    return [...securityHeaders, ...staticAssetCachingHeaders];
  },
};

// Bundle analyzer wrapper
const withBundleAnalyzer = process.env.ANALYZE === 'true'
  ? require('@next/bundle-analyzer')({ enabled: true })
  : (config) => config;



module.exports = withNextIntl(withBundleAnalyzer(nextConfig));
