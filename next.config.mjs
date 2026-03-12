/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Ignore build errors - fix before production deployment
    ignoreBuildErrors: true,
  },
  images: {
    // Enable optimization in production
    //unoptimized: process.env.NODE_ENV === 'development',
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ochlocratical-braelynn-nonrefractively.ngrok-free.dev',
      },
      // Add production domain when deployed
      {
        protocol: 'http',
        hostname: process.env.NEXT_PUBLIC_BACKEND_DOMAIN || 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      // {
      //   protocol: 'http',
      //   hostname: 'localhost',
      //   port: '8000',
      //   pathname: '/media/**',
      // },
      // {
      //   protocol: 'http',
      //   hostname: '127.0.0.1',
      //   port: '8000',
      //   pathname: '/media/**',
      // },
      // // Add production domain when deployed
      // {
      //   protocol: 'https',
      //   hostname: process.env.NEXT_PUBLIC_BACKEND_DOMAIN || 'yourdomain.com',
      //   pathname: '/media/**',
      // },
    ],
  },
  // Production optimizations
  compress: true,
  poweredByHeader: false,
}

export default nextConfig
