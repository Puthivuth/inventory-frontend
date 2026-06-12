/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export',   // ⭐ required for static export in Next.js 15

  typescript: {
    // Ignore build errors - fix before production deployment
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ochlocratical-braelynn-nonrefractively.ngrok-free.dev',
      },
      {
        protocol: 'http',
        hostname: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
          .replace('http://', '')
          .replace('https://', '')
          .split(':')[0]
          .split('/')[0],
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: (process.env.NEXT_PUBLIC_API_URL || 'localhost')
          .replace('http://', '')
          .replace('https://', '')
          .split(':')[0]
          .split('/')[0],
        pathname: '/media/**',
      },
    ],
  },

  compress: true,
  poweredByHeader: false,
}

export default nextConfig
