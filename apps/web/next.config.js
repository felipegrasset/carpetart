/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@carpetart/database'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
}

module.exports = nextConfig
