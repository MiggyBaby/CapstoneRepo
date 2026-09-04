import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

interface Params {
  id: string;
}

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = params;

    const crackDoc = await getDoc(doc(db, 'cracks', id));

    if (!crackDoc.exists()) {
      return NextResponse.json(
        { success: false, error: 'Crack not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: crackDoc.id,
        ...crackDoc.data(),
      },
    });
  } catch (error) {
    console.error('Error fetching crack:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch crack' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = params;
    const body = await request.json();

    // Update crack in Firestore
    const crackRef = doc(db, 'cracks', id);
    await updateDoc(crackRef, {
      ...body,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Crack updated successfully',
      data: {
        id,
        ...body,
      },
    });
  } catch (error) {
    console.error('Error updating crack:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update crack' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = params;

    // Delete from Firestore
    await deleteDoc(doc(db, 'cracks', id));

    return NextResponse.json({
      success: true,
      message: 'Crack deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting crack:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete crack' },
      { status: 500 }
    );
  }
}
