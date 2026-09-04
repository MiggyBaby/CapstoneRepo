import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    // Optional query parameters for filtering
    const severity = request.nextUrl.searchParams.get('severity');
    const crackType = request.nextUrl.searchParams.get('type');
    const limit = request.nextUrl.searchParams.get('limit');

    let q = query(collection(db, 'cracks'), orderBy('detectedAt', 'desc'));

    // Apply filters if provided
    if (severity) {
      q = query(
        collection(db, 'cracks'),
        where('severity', '==', severity),
        orderBy('detectedAt', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    const cracks = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Apply limit if provided
    const result = limit ? cracks.slice(0, parseInt(limit)) : cracks;

    return NextResponse.json({
      success: true,
      data: result,
      count: result.length,
    });
  } catch (error) {
    console.error('Error fetching cracks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cracks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.location || !body.coordinates || !body.crackType || !body.severity) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Add to Firestore (would use admin SDK in production)
    // For now, return mock response
    const newCrack = {
      id: `crack-${Date.now()}`,
      ...body,
      status: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: newCrack,
      message: 'Crack created successfully',
    });
  } catch (error) {
    console.error('Error creating crack:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create crack' },
      { status: 500 }
    );
  }
}
