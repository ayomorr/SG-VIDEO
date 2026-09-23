import { NextRequest, NextResponse } from "next/server";

const CSP_STYLES = ["'self'", "'unsafe-inline'"];
const CSP_IMAGES = ["'self'", "data:", "blob:"];
const CSP_FONTS = ["'self'", "data:"];
const CSP_CONNECT = ["'self'"];

function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src ${CSP_STYLES.join(" ")}`,
    `img-src ${CSP_IMAGES.join(" ")}`,
    `font-src ${CSP_FONTS.join(" ")}`,
    `connect-src ${CSP_CONNECT.join(" ")}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const csp = buildCsp(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("x-nonce", nonce);
  response.headers.set("content-security-policy", csp);
  return response;
}