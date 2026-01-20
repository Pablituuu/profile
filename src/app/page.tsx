import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center py-20 px-4">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/20 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-secondary/20 blur-[120px] rounded-full animate-float" />
      </div>

      <main className="max-w-4xl text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="inline-block px-4 py-1.5 rounded-full glass text-sm font-medium text-brand-primary mb-4">
          Powered by Next.js 15 & Antigravity
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
          Design the <span className="text-gradient">Future</span> <br />
          with Next.js
        </h1>

        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Start your next big project with a premium architecture. This template
          is pre-configured with TypeScript, Tailwind CSS, and the latest App
          Router patterns.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Link
            href="/docs"
            className="px-8 py-4 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-white/5"
          >
            Get Started
          </Link>
          <Link
            href="https://github.com"
            className="px-8 py-4 rounded-xl glass font-semibold hover:bg-white/10 transition-all transform hover:scale-105 active:scale-95"
          >
            Github Preview
          </Link>
        </div>
      </main>

      <footer className="absolute bottom-8 text-zinc-500 text-sm">
        Built with passion for high-end web applications.
      </footer>
    </div>
  );
}
