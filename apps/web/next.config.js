/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@carpetart/database'],
  outputFileTracingIncludes: {
    '/api/**/*': ['../../node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma/client/**'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
}

module.exports = nextConfig
