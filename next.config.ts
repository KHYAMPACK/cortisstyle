import type { NextConfig } from "next";
import path from "path";

const projectRoot = path.resolve(__dirname);

/** Keep in sync with `MAX_UPLOAD_BYTES` in trAssetStorage (+ multipart overhead). */
const UPLOAD_BODY_SIZE_LIMIT = "12mb";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    proxyClientMaxBodySize: UPLOAD_BODY_SIZE_LIMIT,
    middlewareClientMaxBodySize: UPLOAD_BODY_SIZE_LIMIT,
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
