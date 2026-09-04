import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      status: 'operational',
      message: 'API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        status: 'down',
        message: 'API health check failed',
      },
      { status: 503 }
    );
  }
}
