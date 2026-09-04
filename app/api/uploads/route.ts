import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Create file path
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const filePath = `cracks/${filename}`;

    // Upload to Firebase Storage
    const storageRef = ref(storage, filePath);
    const bytes = await file.arrayBuffer();
    await uploadBytes(storageRef, bytes);

    // Get download URL
    const downloadUrl = await getDownloadURL(storageRef);

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        filename,
        url: downloadUrl,
        size: file.size,
        type: file.type,
      },
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
