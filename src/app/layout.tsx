import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Inter, JetBrains_Mono, Noto_Sans_JP } from 'next/font/google';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Toaster } from 'sonner';
import { AppNav } from '@/shared/ui/nav';
import { QueryProvider } from '@/shared/providers/query-provider';
import { RepositoryProvider } from '@/shared/providers/repository-provider';
import { ThemeProvider } from '@/shared/providers/theme-provider';
import { BACKGROUND_INIT_SCRIPT } from '@/shared/providers/background-provider';
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

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'TechLog',
  description: '技術ブログの読書管理',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="ja"
      className={`h-full antialiased ${inter.variable} ${notoSansJp.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: BACKGROUND_INIT_SCRIPT }} />
      </head>
      <body className="bg-background text-foreground flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <QueryProvider>
            <RepositoryProvider>
              <Suspense fallback={null}>
                <NuqsAdapter>
                  <AppNav />
                  <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
                    {children}
                  </main>
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
