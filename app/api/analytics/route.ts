import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const snapshot = await getDocs(collection(db, 'cracks'));
    const cracks = snapshot.docs.map((doc) => doc.data());

    // Calculate statistics
    const stats = {
      totalCracks: cracks.length,
      criticalCracks: cracks.filter((c) => c.severity === 'critical').length,
      highCracks: cracks.filter((c) => c.severity === 'high').length,
      mediumCracks: cracks.filter((c) => c.severity === 'medium').length,
      lowCracks: cracks.filter((c) => c.severity === 'low').length,
      resolvedCracks: cracks.filter((c) => c.status === 'resolved').length,
      inProgressCracks: cracks.filter((c) => c.status === 'in-progress').length,
    };

    // Cracks by type
    const cracksByType = {
      longitudinal: cracks.filter((c) => c.crackType === 'longitudinal').length,
      transverse: cracks.filter((c) => c.crackType === 'transverse').length,
      alligator: cracks.filter((c) => c.crackType === 'alligator').length,
      edge: cracks.filter((c) => c.crackType === 'edge').length,
      reflection: cracks.filter((c) => c.crackType === 'reflection').length,
      other: cracks.filter((c) => c.crackType === 'other').length,
    };

    // Cracks by status
    const cracksByStatus = {
      new: cracks.filter((c) => c.status === 'new').length,
      assigned: cracks.filter((c) => c.status === 'assigned').length,
      inProgress: cracks.filter((c) => c.status === 'in-progress').length,
      resolved: cracks.filter((c) => c.status === 'resolved').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        cracksByType,
        cracksByStatus,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
