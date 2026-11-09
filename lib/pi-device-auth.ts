import { createHash, timingSafeEqual } from 'node:crypto';
import { NextRequest } from 'next/server';

export function hasValidPiDeviceToken(request: NextRequest): boolean | null {
  const expected = process.env.PI_INGESTION_TOKEN;
  if (!expected) return null;

  const match = request.headers.get('authorization')?.match(/^Bearer\s+(\S+)$/i);
  if (!match || match[1].length > 512) return false;

  const expectedHash = createHash('sha256').update(expected).digest();
  const providedHash = createHash('sha256').update(match[1]).digest();
  return timingSafeEqual(expectedHash, providedHash);
}
