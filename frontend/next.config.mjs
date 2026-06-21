/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict mode catches double-invocations in development
  reactStrictMode: true,

  // Security headers applied to every response
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Next.js inline scripts + Framer Motion
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              // Firebase Auth uses iframes
              "frame-src https://*.firebaseapp.com https://accounts.google.com",
              // Firebase, GenLayer, Google Fonts
              "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://studio.genlayer.com wss://*.firebaseio.com",
              // Firebase Storage + self
              "img-src 'self' data: blob: https://firebasestorage.googleapis.com",
              // Google Fonts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
            ].join('; '),
          },
        ],
      },
    ]
  },

  // Webpack: suppress the punycode deprecation warning from Firebase SDK
  webpack(config) {
    config.ignoreWarnings = [
      { module: /node_modules\/punycode/ },
    ]
    return config
  },
}

export default nextConfig
