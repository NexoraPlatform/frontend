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
      // Keep only hard runtime errors in production output.
      exclude: ['error']
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
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== 'production',
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
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/storage/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/storage/**',
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
    qualities: [75, 90],
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
          ...(isDev
            ? []
            : [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=31536000; includeSubDomains; preload',
                },
              ]),
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
                https://applepay.cdn-apple.com
                https://cdnjs.cloudflare.com
                https://backend.trustora.ro
                https://sandboxcheckouttoolkit.rapyd.net;
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
                https://api.iconify.design
                https://api.simplesvg.com
                https://api.unisvg.com
                https://www.google-analytics.com
                https://cdn.onesignal.com
                https://onesignal.com
                https://api.onesignal.com
                https://cdn.cookie-script.com
                https://sandboxcheckouttoolkit.rapyd.net
                ${isDev ? 'http://127.0.0.1:8000 http://localhost:8000 ws: wss:' : ''};
              frame-src 'self'
              https://onesignal.com
              https://sandboxcheckout.rapyd.net;
              frame-ancestors 'none';
              base-uri 'self';
              form-action 'self';
            `.replace(/\s+/g, ' ').trim(),
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];

    const staticAssetCachingHeaders = isDev
      ? [
        {
          source: '/_next/static/(.*)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'no-store, no-cache, must-revalidate',
            },
          ],
        },
      ]
      : [
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
