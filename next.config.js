/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async redirects() {
    return [
      { source: '/favicon.ico', destination: '/icon.svg', permanent: false },
    ];
  },
};

module.exports = nextConfig;
