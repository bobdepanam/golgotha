/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // SCSS include paths
  sassOptions: {
    includePaths: [path.join(__dirname, "src/styles")],
  },

  // Images distantes (WP headless)
  images: {
    // ⚠️ On optimise en prod (Vercel), on désactive en local pour le confort
    unoptimized: !process.env.VERCEL,
    formats: ["image/avif", "image/webp"],
    // Ajoute ici d'autres hôtes si besoin (thumbnails CDN, site principal…)
    remotePatterns: [
      { protocol: "https", hostname: "cms.bastardz.fr", pathname: "/**" },
      // { protocol: "https", hostname: "bastardz.fr", pathname: "/**" },
      // { protocol: "https", hostname: "i0.wp.com", pathname: "/**" }, // Jetpack CDN éventuel
    ],
  },

  // Webpack: alias + SVGR (SVG inline en React)
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname, "src"),
    };

    // SVGR pour importer les .svg comme composants React: import Logo from "./logo.svg"
    // (Next gère déjà les images classiques via son propre loader)
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },

  // Optionnel : petit gain perf CSS
  experimental: {
    optimizeCss: true,
  },

  // Optionnel : éviter d’échouer le build sur des warnings ESLint en prod
  // eslint: { ignoreDuringBuilds: true },
};

module.exports = nextConfig;
