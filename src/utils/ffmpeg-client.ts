// utils/ffmpeg-client.ts - FFmpeg.wasm para el navegador
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;
let loaded = false;

export async function loadFFmpeg(): Promise<{
  ffmpeg: FFmpeg;
  fetchFile: typeof fetchFile;
}> {
  if (loaded && ffmpeg) return { ffmpeg, fetchFile };

  console.log('[FFMPEG] Cargando FFmpeg.wasm...');
  ffmpeg = new FFmpeg();

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  loaded = true;
  console.log('[FFMPEG] FFmpeg.wasm listo!');

  return { ffmpeg, fetchFile };
}

/**
 * Genera un video ligero (low res, low fps) en un solo paso.
 * Esto es MUCHO más rápido que extraer frames uno a uno y reconstruir en JS.
 */
export async function createLightweightVideo(
  videoFile: File,
  fps: number = 2,
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const { ffmpeg, fetchFile } = await loadFFmpeg();

  console.log(`[FFMPEG] Iniciando optimización (${fps} FPS)...`);
  const videoData = await fetchFile(videoFile);
  await ffmpeg.writeFile('input.mp4', videoData);

  // Escuchamos el log para intentar dar progreso básico
  ffmpeg.on('log', ({ message }) => {
    if (message.includes('frame=')) {
      console.log('[FFMPEG Log]:', message);
    }
  });

  // Un solo comando altamente optimizado:
  // -vf: fps=X (bajar frames), scale=640:360 (bajar resolución)
  // -preset ultrafast: máxima velocidad de codificación
  // -crf 32: calidad baja aceptable para IA
  // -ac: 1, -ar: 16000: audio mono ligero
  await ffmpeg.exec([
    '-i',
    'input.mp4',
    '-vf',
    `fps=${fps},scale=640:360`,
    '-c:v',
    'libx264',
    '-preset',
    'ultrafast',
    '-crf',
    '32',
    '-acodec',
    'aac',
    '-ar',
    '16000',
    '-ac',
    '1',
    '-b:a',
    '32k',
    'output.mp4',
  ]);

  const outputData = await ffmpeg.readFile('output.mp4');
  const outputBlob = new Blob([new Uint8Array(outputData as Uint8Array)], {
    type: 'video/mp4',
  });

  // Limpieza de memoria virtual
  await ffmpeg.deleteFile('input.mp4');
  await ffmpeg.deleteFile('output.mp4');

  return outputBlob;
}

/**
 * Corta un fragmento de video rápidamente sin re-codificar.
 */
export async function cutVideoClip(
  videoFile: File,
  start: number,
  end: number
): Promise<Blob> {
  const { ffmpeg, fetchFile } = await loadFFmpeg();

  const videoData = await fetchFile(videoFile);
  await ffmpeg.writeFile('input.mp4', videoData);

  const duration = end - start;
  await ffmpeg.exec([
    '-ss',
    start.toString(),
    '-i',
    'input.mp4',
    '-t',
    duration.toString(),
    '-c',
    'copy',
    'output.mp4',
  ]);

  const outputData = await ffmpeg.readFile('output.mp4');
  const blob = new Blob([new Uint8Array(outputData as Uint8Array)], {
    type: 'video/mp4',
  });

  await ffmpeg.deleteFile('input.mp4');
  await ffmpeg.deleteFile('output.mp4');

  return blob;
}

/**
 * Sube un Blob a GCS mediante URL firmada.
 */
export async function uploadToGCS(
  blob: Blob,
  fileName: string,
  onProgress?: (percent: number) => void
): Promise<{
  uploadUrl: string;
  readUrl: string;
  publicUrl: string;
  fileName: string;
}> {
  const response = await fetch('/api/storage/presigned-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName,
      contentType: blob.type || 'video/mp4',
    }),
  });

  if (!response.ok) throw new Error('Failed to get presigned URL');

  const {
    uploadUrl,
    readUrl,
    publicUrl,
    fileName: storedFileName,
  } = await response.json();

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': blob.type || 'video/mp4' },
    body: blob,
  });

  if (!uploadResponse.ok) throw new Error('Upload failed');

  return { uploadUrl, readUrl, publicUrl, fileName: storedFileName };
}
