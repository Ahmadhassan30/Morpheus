/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://unpkg.com https://sandpack-bundler.codesandbox.io",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' http://127.0.0.1:8787 http://localhost:8787 https://*.workers.dev https://sandpack-bundler.codesandbox.io wss://sandpack-bundler.codesandbox.io https://col.csbops.io https://groq.com https://*.groq.com",
              "frame-src 'self' https://sandpack-bundler.codesandbox.io",
              "img-src 'self' data: blob:",
              "worker-src blob: https://sandpack-bundler.codesandbox.io",
            ].join('; ')
          }
        ]
      }
    ]
  }
}

export default nextConfig