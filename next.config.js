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
    // On optimise en prod (Vercel), on désactive en local pour le confort
    unoptimized: !process.env.VERCEL,
    formats: ["image/avif", "image/webp"],
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

    // Importer des SVG comme composants React: import Logo from "./logo.svg"
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },

  // ⚠️ Retiré: experimental.optimizeCss (évite l'erreur 'Cannot find module "critters"')
  // Si tu veux le réactiver plus tard : `npm i critters@0.0.18` puis dé-commente.
  // experimental: { optimizeCss: true },
};

module.exports = nextConfig;
