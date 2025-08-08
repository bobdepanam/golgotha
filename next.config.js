/* eslint-disable @typescript-eslint/no-require-imports */

const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Chemins SCSS
  sassOptions: {
    includePaths: [path.join(__dirname, "src/styles")],
  },

  // Autorisation d’images distantes
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cms.bastardz.fr",
        pathname: "/**",
      },
    ],
    unoptimized: true, // ➜ désactive temporairement l’optimisation d’image côté Next.js
  },

  // Alias @ vers src + ajout support SVG inline
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname, "src"),
    };

    // Ajout support SVG inline via SVGR
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
};

module.exports = nextConfig;
