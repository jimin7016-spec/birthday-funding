import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: "No file received." }, { status: 400 });
    }

    // Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: 'public',
    });

    // Return the blob URL which acts as the path
    return NextResponse.json({ path: blob.url });
  } catch (error) {
    console.error("Error occurred while saving file:", error);
    return NextResponse.json({ error: "Failed to upload file." }, { status: 500 });
  }
}
