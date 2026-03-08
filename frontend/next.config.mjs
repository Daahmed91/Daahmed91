/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Docker standalone builds (frontend/Dockerfile)
  output: "standalone",
};

export default nextConfig;
