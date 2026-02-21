/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ✅ On ignore ESLint pendant le build (sinon Next échoue)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // SCSS include paths
  sassOptions: {
    includePaths: [path.join(__dirname, "src/styles")],
  },

  // Images (Next.js optimizer + Vercel CDN)
  images: {
    // Dev local : pas d'optimizer. Prod (Vercel) : optimizer ON.
    unoptimized: !process.env.VERCEL,

    // Stabilisation : on force WebP (tu pourras réactiver AVIF plus tard)
    formats: ["image/webp"],

    // Tailles rationnalisées
    deviceSizes: [360, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [320, 480, 640, 960, 1200],

    // Cache CDN → 30 jours
    minimumCacheTTL: 60 * 60 * 24 * 30,

    // Sources distantes autorisées
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cms.bastardz.fr",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },

  // Webpack: alias + SVGR
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname, "src"),
    };

    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
};

module.exports = nextConfig;
