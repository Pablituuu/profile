'use server';

import { createClient } from '@/utils/supabase/server';

/**
 * Checks if the current authenticated user has AI permissions enabled in their profile.
 * High-security check performed on the server.
 */
export async function checkAiAccess() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('has_ai_access')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    console.error('Error fetching user profile for AI access check:', error);
    return false;
  }

  return !!profile.has_ai_access;
}

export async function checkGeminiApiKey() {
  // First check if the user actually has permission to use AI
  const hasAccess = await checkAiAccess();
  if (!hasAccess) return false;

  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  return !!key && key.length > 0;
}

export async function checkDeepgramApiKey() {
  // First check if the user actually has permission to use AI
  const hasAccess = await checkAiAccess();
  if (!hasAccess) return false;

  const key = process.env.DEEPGRAM_API_KEY;
  return !!key && key.length > 0;
}
