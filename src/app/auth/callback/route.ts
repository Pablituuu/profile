import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/video-editor';

  // Determinar el origin de forma robusta
  const host = request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  const requestOrigin = `${proto}://${host}`;

  let redirectOrigin = requestOrigin;

  // Preferir NEXT_PUBLIC_SITE_URL si está configurado y no estamos en localhost
  // O si el origin detectado es una dirección de binding interna como 0.0.0.0
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    if (
      !requestOrigin.includes('localhost') ||
      requestOrigin.includes('0.0.0.0')
    ) {
      redirectOrigin = process.env.NEXT_PUBLIC_SITE_URL;
    }
  }

  // Asegurar que redirectOrigin no termine en / para evitar // al concatenar con next
  // (next ya empieza con / por defecto o es /video-editor)
  redirectOrigin = redirectOrigin.replace(/\/$/, '');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${redirectOrigin}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(
    `${redirectOrigin}/login?error=Could not authenticate user`
  );
}
