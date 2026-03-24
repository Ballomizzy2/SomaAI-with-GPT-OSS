import path from "path";

const unityBuildDir = path.resolve(process.cwd(), "Unity Project", "Soma+", "Builds", "SoraAI_HTML");

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
    outputFileTracingIncludes: {
      "/unity/[[...path]]": [path.join(unityBuildDir, "**/*")]
    }
  },
  async headers() {
    return [
      {
        // Apply headers to all Unity routes for CORS support
        source: "/unity/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "*",
          },
        ],
      },
    ];
  },
};

export default nextConfig;





