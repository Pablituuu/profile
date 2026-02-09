import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

// Inicializar cliente de GCS con credenciales del .env
function getStorageClient() {
  const privateKey = process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (
    !privateKey ||
    !process.env.GCS_CLIENT_EMAIL ||
    !process.env.GCS_PROJECT_ID
  ) {
    throw new Error('Missing GCS credentials in environment variables');
  }

  return new Storage({
    projectId: process.env.GCS_PROJECT_ID,
    credentials: {
      client_email: process.env.GCS_CLIENT_EMAIL,
      private_key: privateKey,
    },
  });
}

// POST: Generar presigned URL para subir archivo
export async function POST(req: NextRequest) {
  try {
    const { fileName, contentType } = await req.json();

    if (!fileName) {
      return NextResponse.json(
        { error: 'fileName is required' },
        { status: 400 }
      );
    }

    const bucketName = process.env.GCS_BUCKET_NAME;
    if (!bucketName) {
      return NextResponse.json(
        { error: 'GCS_BUCKET_NAME not configured' },
        { status: 500 }
      );
    }

    const storage = getStorageClient();
    const bucket = storage.bucket(bucketName);

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const uniqueFileName = `highlights/${timestamp}_${fileName}`;
    const file = bucket.file(uniqueFileName);

    // Generar URL firmada para subir (PUT)
    const [uploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutos
      contentType: contentType || 'video/mp4',
    });

    // También generar URL para leer después (GET)
    const [readUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hora
    });

    // URL pública (si el archivo se hace público después)
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${uniqueFileName}`;

    console.log('[GCS] Presigned URL generada para:', uniqueFileName);

    return NextResponse.json({
      uploadUrl,
      readUrl,
      publicUrl,
      fileName: uniqueFileName,
      expiresIn: '15 minutes',
    });
  } catch (error) {
    console.error('[GCS] Error generando presigned URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate presigned URL', details: String(error) },
      { status: 500 }
    );
  }
}
