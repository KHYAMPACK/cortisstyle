import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Native ONNX bindings must stay external — bundling them crashes /api/studio/remove-bg.
  serverExternalPackages: ["rmbg", "onnxruntime-node", "sharp"],
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
