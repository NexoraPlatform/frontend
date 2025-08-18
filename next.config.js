/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  compress: true,
  poweredByHeader: false,

  // Compiler optimizations with modern JS target
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,

    // React optimizations
    reactRemoveProperties: process.env.NODE_ENV === 'production' ? {
      properties: ['^data-testid']
    } : false,
    styledComponents: {
      displayName: process.env.NODE_ENV !== 'production',
      ssr: true,
      fileName: false,
      minify: true,
      transpileTemplateLiterals: true,
      pure: true,
    },
  },

  // Modern browser optimizations
  modularizeImports: {
    'lodash': {
      transform: 'lodash/{{member}}',
    },
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
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
    // CRITICAL: CSS optimization
    optimizeCss: true,

    // React compiler
    reactCompiler: true,

    // Package imports optimization
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-slot',
      'class-variance-authority',
      'date-fns',
      'framer-motion'
    ],

    // Bundle optimization
    optimizeServerReact: true,

    // Enable modern compilation
    forceSwcTransforms: true,


    // CSS-in-JS optimization
    swcPlugins: [
      ['@swc/plugin-styled-components', {
        displayName: process.env.NODE_ENV === 'development',
        ssr: true,
      }]
    ],
  },

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,

        // Module concatenation
        concatenateModules: true,

        // Tree shaking
        usedExports: true,
        sideEffects: false,

        // Split chunks optimization
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            framework: {
              chunks: 'all',
              name: 'framework',
              test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true,
            },
            lib: {
              test(module) {
                return module.size() > 160000 && /node_modules[/\\]/.test(module.identifier());
              },
              name: 'lib',
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 20,
            },
            shared: {
              name: 'shared',
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    // CSS optimization
    if (!isServer) {
      config.optimization.splitChunks.cacheGroups.styles = {
        name: 'styles',
        test: /\.(css|scss|sass)$/,
        chunks: 'all',
        enforce: true,
      };
    }

    return config;
  },

  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Static export optimization
  trailingSlash: false,

  // Production source maps for debugging (disabled for performance)
  productionBrowserSourceMaps: false,

  // Modern headers with security and performance optimizations
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Security headers
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
          // Performance headers
          {
            key: 'Accept-CH',
            value: 'Viewport-Width, Width, DPR',
          },
          // CRITICAL: Preload key resources
          {
            key: 'Link',
            value: '</logo-60.webp>; rel=preload; as=image; type=image/webp, </logo-120.webp>; rel=preload; as=image; type=image/webp',
          },
        ],
      },
      {
        // Long-term caching for images
        source: '/(.*)\\.(jpg|jpeg|png|gif|ico|svg|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Vary',
            value: 'Accept',
          },
        ],
      },
      {
        // Long-term caching for Next.js static files
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // CSS caching optimization
        source: '/_next/static/css/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Content-Encoding',
            value: 'gzip',
          },
        ],
      },
    ];
  },

  // Rewrites for better SEO and performance
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap',
      },
      // Preload critical routes
      {
        source: '/preload/:path*',
        destination: '/:path*',
      },
    ];
  },

  // Output configuration for static optimization
  output: 'standalone',

  // Generate static pages where possible
  generateStaticParams: async () => {
    // Pre-generate critical pages
    return [
      { slug: [''] }, // Homepage
      { slug: ['services'] },
      { slug: ['about'] },
    ];
  },
};

// Bundle analyzer wrapper
const withBundleAnalyzer = process.env.ANALYZE === 'true'
    ? require('@next/bundle-analyzer')({
      enabled: true,
      openAnalyzer: false,
    })
    : (config) => config;

module.exports = withBundleAnalyzer(nextConfig);
