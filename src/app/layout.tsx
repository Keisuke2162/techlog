import type { Metadata } from 'next';
import { Suspense } from 'react';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Toaster } from 'sonner';
import { AppNav } from '@/shared/ui/nav';
import { QueryProvider } from '@/shared/providers/query-provider';
import { RepositoryProvider } from '@/shared/providers/repository-provider';
import { ThemeProvider } from '@/shared/providers/theme-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'TechLog',
  description: '技術ブログの読書管理 (Phase 1 ローカル版)',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ja" className="h-full antialiased" suppressHydrationWarning>
      <body className="bg-background text-foreground flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <QueryProvider>
            <RepositoryProvider>
              <Suspense fallback={null}>
                <NuqsAdapter>
                  <AppNav />
                  <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
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
