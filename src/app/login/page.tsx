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
          <div className="relative inline-flex mb-6 group">
            <div className="absolute -inset-1 bg-linear-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative h-20 w-20 flex items-center justify-center rounded-2xl bg-black border border-white/10 shadow-2xl transition-transform group-hover:scale-105 duration-500">
              <img
                src="/logo.png"
                alt="Pablituuu Studio Logo"
                className="h-12 w-12 object-contain"
              />
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2 leading-tight">
            Pablituuu{' '}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-indigo-400">
              Studio
            </span>
          </h1>
          <p className="text-white/40 font-medium mb-6">
            {t('login.subtitle')}
          </p>

          <div className="relative group mb-8 overflow-hidden rounded-2xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-4 backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-1000 text-left">
            <div className="absolute -left-1 -top-1 size-12 bg-indigo-500/20 blur-xl group-hover:bg-indigo-500/40 transition-colors duration-500" />
            <div className="relative flex items-start gap-4">
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 shadow-inner ring-1 ring-white/10">
                <svg
                  className="size-5 animate-pulse"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v8" />
                  <path d="m4.93 4.93 4.24 4.24" />
                  <path d="M2 12h8" />
                  <path d="m4.93 19.07 4.24-4.24" />
                  <path d="M12 22v-8" />
                  <path d="m19.07 19.07-4.24-4.24" />
                  <path d="M22 12h-8" />
                  <path d="m19.07 4.93-4.24 4.24" />
                </svg>
              </div>
              <div className="space-y-1">
                <h4 className="text-[11px] font-black uppercase tracking-[0.15em] text-indigo-400">
                  {t('updates.access_control')}
                </h4>
                <p className="text-[14px] leading-relaxed font-bold text-white tracking-tight">
                  {t('login.ai_notice')}
                </p>
              </div>
            </div>
          </div>
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
