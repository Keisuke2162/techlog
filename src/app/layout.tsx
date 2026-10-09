import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Inter, Instrument_Serif, JetBrains_Mono, Noto_Sans_JP } from 'next/font/google';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Toaster } from 'sonner';
import { AppNav } from '@/shared/ui/nav';
import { QueryProvider } from '@/shared/providers/query-provider';
import { RepositoryProvider } from '@/shared/providers/repository-provider';
import { ThemeProvider } from '@/shared/providers/theme-provider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const notoSansJp = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-noto-sans-jp',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-instrument-serif',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'TechLog — 読む日課、積みあがる記録',
  description: '技術ブログの読書管理 (Phase 1 ローカル版)',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="ja"
      className={`h-full antialiased ${inter.variable} ${notoSansJp.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <QueryProvider>
            <RepositoryProvider>
              <Suspense fallback={null}>
                <NuqsAdapter>
                  <AppNav />
                  <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
                    {children}
                  </main>
                  <SiteFooter />
                  <Toaster position="bottom-right" richColors closeButton />
                </NuqsAdapter>
              </Suspense>
            </RepositoryProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="divider-dot mb-4" aria-hidden />
      <p className="text-muted-foreground text-center text-xs">
        <span className="font-display text-base">TechLog</span> — 今日もひとつ、読もう。
      </p>
    </footer>
  );
}
