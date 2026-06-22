/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['facecraft-private-photos.s3.ap-southeast-1.amazonaws.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
    ],
  },
  env: {
    API_URL: process.env.API_URL || 'http://localhost:4000',
  },
};

module.exports = nextConfig;
