/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // SCSS include paths
  sassOptions: {
    includePaths: [path.join(__dirname, "src/styles")],
  },

  // Images (Next.js optimizer + Vercel CDN)
  images: {
    // En dev local on bypass l’optimizer pour le confort.
    // En prod (Vercel) on active l’optimisation dynamique.
    unoptimized: !process.env.VERCEL,

    // Génère AVIF & WebP quand c’est pertinent.
    formats: ["image/avif", "image/webp"],

    // Rationnalise les tailles générées (adapte si besoin à tes breakpoints).
    deviceSizes: [360, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [320, 480, 640, 960, 1200],

    // Cache long sur le CDN (images fingerprintées ou stables)
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 an

    // Autorise seulement les uploads WP (évite les originaux hors /uploads)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cms.bastardz.fr",
        pathname: "/wp-content/uploads/**",
      },
      // Si un jour tu actives Jetpack CDN (Photon), décommente :
      // { protocol: "https", hostname: "i0.wp.com", pathname: "/**" },
    ],
  },

  // Webpack: alias + SVGR (SVG inline en React)
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname, "src"),
    };

    // Importer des SVG comme composants React: import Logo from "./logo.svg"
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },

  // NOTE: experimental.optimizeCss retiré (critters). Réactive-le si besoin.
  // experimental: { optimizeCss: true },
};

module.exports = nextConfig;
