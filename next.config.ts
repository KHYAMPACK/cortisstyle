import type { NextConfig } from "next";
import path from "path";

const projectRoot = path.resolve(__dirname);

const nextConfig: NextConfig = {
  reactCompiler: true,
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
