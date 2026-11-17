import type { NextConfig } from "next";

// Cache Components is intentionally disabled: almost every admin page renders
// per-request data from MongoDB behind a session, so plain dynamic rendering is
// simpler and correct. Public pages remain fast because they are tiny.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Hide the "N" development badge in the corner (errors are still shown).
  devIndicators: false,
  serverExternalPackages: ["mongoose", "cloudinary"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // The agency's marketing website is a static page in public/website.
  async rewrites() {
    return [{ source: "/website", destination: "/website/index.html" }];
  },
};

export default nextConfig;
