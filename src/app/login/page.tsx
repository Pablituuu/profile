'use client';

import { LoginForm } from './login-form';
import { Suspense } from 'react';
import { useLanguageStore } from '@/store/use-language-store';
import { LanguageSwitcher } from '@/components/language-switcher';

export default function LoginPage() {
  const { t } = useLanguageStore();

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#030303]">
      {/* Background Orbs */}
      <div className="absolute top-1/4 -left-20 h-96 w-96 rounded-full bg-purple-600/20 blur-[120px]" />
      <div className="absolute bottom-1/4 -right-20 h-96 w-96 rounded-full bg-blue-600/20 blur-[120px]" />

      {/* Language Switcher in top right */}
      <div className="absolute top-6 right-6 z-50">
        <LanguageSwitcher />
      </div>

      {/* Mesh Gradient Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50 contrast-150" />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="mb-10 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-tr from-purple-600 to-blue-600 shadow-2xl shadow-purple-500/20 mb-6 group transition-transform hover:scale-110">
            <svg
              className=" h-8 w-8 text-white transition-transform group-hover:rotate-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
            Pablituuu{' '}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-blue-400">
              Studio
            </span>
          </h1>
          <p className="text-white/40 font-medium">{t('login.subtitle')}</p>
        </div>

        <Suspense
          fallback={
            <div className="h-[400px] w-full rounded-2xl bg-white/5 animate-pulse" />
          }
        >
          <LoginForm />
        </Suspense>

        <p className="mt-8 text-center text-sm text-white/20">
          {t('login.privacy')}
          <br />
          &copy; 2026 Pablituuu Studio. {t('login.rights')}
        </p>
      </div>
    </div>
  );
}
