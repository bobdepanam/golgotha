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
    // Dev local : pas d'optimizer. Prod (Vercel) : optimizer ON.
    unoptimized: !process.env.VERCEL,

    // Stabilisation : on force WebP (tu pourras réactiver AVIF plus tard)
    formats: ["image/webp"],

    // Tailles rationnalisées (adapte si besoin à tes breakpoints)
    deviceSizes: [360, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [320, 480, 640, 960, 1200],

    // Cache CDN → 30 jours (plus safe si un média WP est remplacé à l’identique)
    minimumCacheTTL: 60 * 60 * 24 * 30,

    // Sources distantes autorisées (élargis si tu ajoutes d’autres origines)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cms.bastardz.fr",
        pathname: "/wp-content/uploads/**",
      },
      // { protocol: "https", hostname: "cms.golgotha.fr", pathname: "/wp-content/uploads/**" },
      // { protocol: "https", hostname: "i0.wp.com", pathname: "/**" },
      // { protocol: "https", hostname: "i1.wp.com", pathname: "/**" },
      // { protocol: "https", hostname: "i2.wp.com", pathname: "/**" },
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
