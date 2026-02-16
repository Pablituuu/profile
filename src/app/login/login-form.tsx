'use client';

import { useSearchParams } from 'next/navigation';
import { login, signup } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Label } from '@/components/ui/Label';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useLanguageStore } from '@/store/use-language-store';

export function LoginForm() {
  const { t } = useLanguageStore();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const message = searchParams.get('message');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const { createClient } = await import('@/utils/supabase/client');
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setIsLoading(false);
      console.error(error);
    }
  };

  return (
    <Card className="w-full border-white/10 bg-black/40 backdrop-blur-xl transition-all hover:border-white/20">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight text-white text-center">
          {t('login.title')}
        </CardTitle>
        <CardDescription className="text-white/60 text-center">
          {t('login.description')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        {message && (
          <div className="flex items-center gap-2 rounded-lg bg-blue-500/10 p-3 text-sm text-blue-400 border border-blue-500/20">
            <AlertCircle className="h-4 w-4" />
            <span>{message}</span>
          </div>
        )}

        <Button
          variant="outline"
          className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all h-12 text-base font-medium"
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.94 0 3.68.67 5.05 2l3.77-3.77C18.46 1.18 15.46 0 12 0 7.31 0 3.25 2.7 1.21 6.6l4.43 3.44C6.73 7.04 9.14 5.04 12 5.04z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.74 2.9c2.18-2.02 3.48-4.99 3.48-8.72z"
              />
              <path
                fill="#FBBC05"
                d="M5.64 15.19l-4.43 3.44C3.25 21.3 7.31 24 12 24c3.02 0 5.79-1 7.82-2.71l-3.74-2.9c-1.1.74-2.5 1.17-4.08 1.17-2.86 0-5.27-2.01-6.13-4.72z"
              />
              <path
                fill="#34A853"
                d="M12 18.96c-1.58 0-2.98-.43-4.08-1.17l-3.74 2.9C6.21 23 8.98 24 12 24c4.69 0 8.75-2.7 10.79-6.6l-4.43-3.44c-.86 2.71-3.27 4.72-6.13 4.72z"
              />
              <path fill="none" d="M0 0h24v24H0z" />
            </svg>
          )}
          {t('login.google')}
        </Button>
      </CardContent>
    </Card>
  );
}
