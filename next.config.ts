import type { NextConfig } from "next";
import path from "path";

const projectRoot = path.resolve(__dirname);

/** Keep in sync with `MAX_UPLOAD_BYTES` in trAssetStorage (+ multipart overhead). */
const UPLOAD_BODY_SIZE_LIMIT = "12mb";

/**
 * Checkout flag must be identical on SSR and the browser. `TR_CHECKOUT_ENABLED`
 * alone is server-only and causes hydration mismatches in Client Components.
 * Prefer `NEXT_PUBLIC_TR_CHECKOUT_ENABLED`; mirror the private flag when unset.
 */
const trCheckoutEnabled =
  process.env.NEXT_PUBLIC_TR_CHECKOUT_ENABLED?.trim() ||
  process.env.TR_CHECKOUT_ENABLED?.trim() ||
  "false";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_TR_CHECKOUT_ENABLED: trCheckoutEnabled,
  },
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.in",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    proxyClientMaxBodySize: UPLOAD_BODY_SIZE_LIMIT,
    serverActions: {
      bodySizeLimit: UPLOAD_BODY_SIZE_LIMIT,
    },
  },
  turbopack: {
    root: projectRoot,
    resolveAlias: {
      html2canvas: path.resolve(projectRoot, "node_modules/html2canvas-pro"),
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      html2canvas: path.resolve(projectRoot, "node_modules/html2canvas-pro"),
    };
    return config;
  },
};

export default nextConfig;
