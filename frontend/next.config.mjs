/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Required for react-dropzone with Next.js 14
    serverComponentsExternalPackages: [],
  },
};

export default nextConfig;
