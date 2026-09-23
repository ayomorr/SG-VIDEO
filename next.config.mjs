/** @type {import('next').NextConfig} */
const securityHeaders =
  process.env.NODE_ENV === "development"
    ? []
    : [
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:",
            "font-src 'self' data:",
            "connect-src 'self'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "object-src 'none'",
          ].join("; "),
        },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "geolocation=(), camera=(), microphone=(), payment=(), usb=(), magnetometer=(), gyroscope=()" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ];

const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return securityHeaders.length === 0
      ? []
      : [
          {
            source: "/:path*",
            headers: securityHeaders,
          },
        ];
  },
};

export default nextConfig;