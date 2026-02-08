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

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setIsLoading(true);
    const { createClient } = await import('@/utils/supabase/client');
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setIsLoading(false);
      // Normally we'd redirect with error, but for now just console it
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
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all"
            onClick={() => handleOAuthLogin('github')}
            disabled={isLoading}
          >
            <svg
              className="h-4 w-4 mr-2"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            {t('login.github')}
          </Button>
          <Button
            variant="outline"
            className="border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all"
            onClick={() => handleOAuthLogin('google')}
            disabled={isLoading}
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
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
            {t('login.google')}
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/5" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#0a0a0a] px-2 text-white/30">
              {t('login.or_continue')}
            </span>
          </div>
        </div>

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

        <form
          action={async (formData) => {
            setIsLoading(true);
            try {
              await login(formData);
            } finally {
              setIsLoading(false);
            }
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/80">
              {t('login.email')}
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="tu@ejemplo.com"
              required
              className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-purple-500/50 focus:ring-purple-500/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/80">
              {t('login.password')}
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-purple-500/50 focus:ring-purple-500/20"
            />
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Button
              className="w-full bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {t('login.signin')}
            </Button>
            <Button
              formAction={signup}
              variant="outline"
              className="w-full border-white/10 bg-transparent text-white/80 hover:bg-white/5 hover:text-white transition-all"
              disabled={isLoading}
            >
              {t('login.signup')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
