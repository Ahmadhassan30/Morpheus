import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src *",
              "script-src * 'unsafe-inline' 'unsafe-eval'",
              "style-src * 'unsafe-inline'",
              "font-src *",
              "img-src * data: blob:",
              "connect-src *",
              "frame-src *",
              "worker-src * blob:",
              "media-src *",
            ].join('; ')
          }
        ]
      }
    ]
  }
}

export default nextConfig