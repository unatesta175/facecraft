/** @type {import('next').NextConfig} */
const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:4000';

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
  async rewrites() {
    return [
      {
        source: '/brand/logo.png',
        destination: `${apiUrl}/api/v1/assets/branding/logo`,
      },
      {
        source: '/brand/admin-logo.png',
        destination: `${apiUrl}/api/v1/assets/branding/admin-logo`,
      },
      {
        source: '/brand/spinner.png',
        destination: `${apiUrl}/api/v1/assets/branding/spinner`,
      },
      {
        source: '/kiosk/home-hero.mp4',
        destination: `${apiUrl}/api/v1/assets/kiosk/home-video`,
      },
    ];
  },
};

module.exports = nextConfig;
