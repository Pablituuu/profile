import { NextRequest } from 'next/server';
import { createReadStream, statSync } from 'fs';
import os from 'os';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get('path');

  if (!filePath) {
    return new Response('Missing path', { status: 400 });
  }

  // Security check: only serve from temp directory to prevent local file inclusion attacks
  if (!filePath.startsWith(os.tmpdir())) {
    return new Response('Unauthorized path access', { status: 403 });
  }

  try {
    const stats = statSync(filePath);
    const stream = createReadStream(filePath);

    // Return the file stream as a response
    return new Response(stream as any, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': stats.size.toString(),
        'Accept-Ranges': 'bytes',
      },
    });
  } catch (error) {
    console.error('Error serving video:', error);
    return new Response('File not found', { status: 404 });
  }
}
