import path from "path";

const unityBuildDir = path.resolve(process.cwd(), "..", "Builds", "SoraAI_HTML");

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true
  },
  outputFileTracingIncludes: {
    "/unity/[[...path]]": [path.join(unityBuildDir, "**/*")]
  }
};

export default nextConfig;



