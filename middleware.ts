import { NextRequest, NextResponse } from 'next/server';

function isPrivateIpv4(hostname: string) {
  const octets = hostname.split('.').map(Number);
  if (octets.length !== 4 || octets.some(value => !Number.isInteger(value) || value < 0 || value > 255)) return false;
  return octets[0] === 10
    || (octets[0] === 192 && octets[1] === 168)
    || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31);
}

function isDevelopmentOrigin(origin: string) {
  if (process.env.NODE_ENV === 'production') return false;
  try {
    const url = new URL(origin);
    return url.protocol === 'http:'
      && (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]' || isPrivateIpv4(url.hostname));
  } catch {
    return false;
  }
}

function mobileWebOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin) return null;
  const configuredOrigins = (process.env.MOBILE_APP_WEB_ORIGINS ?? '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
  return configuredOrigins.includes(origin) || isDevelopmentOrigin(origin) ? origin : null;
}

export function middleware(request: NextRequest) {
  const origin = mobileWebOrigin(request);
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    if (origin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      response.headers.set('Access-Control-Max-Age', '600');
      response.headers.set('Vary', 'Origin');
    }
    return response;
  }

  const response = NextResponse.next();
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    response.headers.set('Vary', 'Origin');
  }
  return response;
}

export const config = {
  matcher: ['/api/inspections/:path*', '/api/cracks/:id/status', '/api/uploads'],
};
