/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");
const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Routes de développement (`page.dev.tsx`, ex. /dev/spatial) : reconnues uniquement
  // en `next dev` ; absentes du build de production (ni route, ni chunk).
  pageExtensions:
    process.env.NODE_ENV === "development"
      ? ["dev.tsx", "tsx", "ts", "jsx", "js"]
      : ["tsx", "ts", "jsx", "js"],

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

    // Aucune source distante : tous les médias sont servis par le site (content/projects)
  },

  // Webpack: alias + SVGR
  webpack: (config, { dev }) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // Données de contenu générées, isolées par mode (scripts/content/target.mjs) :
      // next dev → src/generated/dev (brouillons) ; next build → src/generated/prod.
      // Déclaré avant « @ » : la correspondance la plus spécifique l'emporte.
      "@generated": path.resolve(__dirname, "src", "generated", dev ? "dev" : "prod"),
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

// next dev compile dans .next-dev : un build de production (.next) ne peut plus écraser
// le serveur de développement en cours d'exécution.
module.exports = (phase) => ({
  ...nextConfig,
  ...(phase === PHASE_DEVELOPMENT_SERVER ? { distDir: ".next-dev" } : {}),
});
