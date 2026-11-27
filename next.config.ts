import fs from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

// cPanel's "Setup Node.js App" replaces node_modules with a symlink into the
// nodevenv directory, which lives outside the project root. Turbopack refuses
// to resolve across a root boundary unless that target is a registered root, so
// next/package.json becomes invisible and the build fails. Register the real
// location when (and only when) node_modules is actually a symlink.
const nodeModules = path.join(process.cwd(), "node_modules");
let realNodeModules: string | null = null;
try {
  const resolved = fs.realpathSync(nodeModules);
  if (resolved !== nodeModules) realNodeModules = resolved;
} catch {
  // node_modules missing; let the build report that itself.
}

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
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  ...(realNodeModules
    ? { experimental: { turbopackAdditionalRoots: { nodeModules: { path: realNodeModules } } } }
    : {}),
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // The agency's marketing website is a static page in public/website.
  async rewrites() {
    return [{ source: "/website", destination: "/website/index.html" }];
  },
};

export default nextConfig;
