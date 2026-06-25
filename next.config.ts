import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["@react-pdf/renderer"],
  turbopack: {
    resolveAlias: {
      html2canvas: path.resolve(process.cwd(), "node_modules/html2canvas-pro"),
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      html2canvas: path.resolve(process.cwd(), "node_modules/html2canvas-pro"),
    };
    return config;
  },
};

export default nextConfig;
