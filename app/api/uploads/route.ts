import { NextRequest, NextResponse } from 'next/server';
import { authorizeReportRequest, isAuthorizationResponse } from '@/lib/report-api-auth';
import { uploadCrackImage } from '@/lib/crack-image-upload';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const authorization = await authorizeReportRequest(request, ['admin', 'inspector']);
  if (isAuthorizationResponse(authorization)) return authorization;
  return uploadCrackImage(request);
}
