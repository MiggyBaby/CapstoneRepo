import { NextRequest, NextResponse } from 'next/server';
import { uploadCrackImage } from '@/lib/crack-image-upload';
import { hasValidPiDeviceToken } from '@/lib/pi-device-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const authorized = hasValidPiDeviceToken(request);
  if (authorized === null) {
    console.error('Pi image upload is not configured: PI_INGESTION_TOKEN is missing.');
    return NextResponse.json({ success: false, error: 'Device upload is not configured.' }, { status: 503 });
  }
  if (!authorized) {
    return NextResponse.json({ success: false, error: 'A valid device bearer token is required.' }, { status: 401 });
  }

  return uploadCrackImage(request);
}
