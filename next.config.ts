import withPWAInit from '@ducanh2912/next-pwa'
import type { NextConfig } from 'next'
import path from 'path'

const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: true,
  disable: process.env.NODE_ENV === 'development',
})

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
}

export default withPWA(nextConfig)
