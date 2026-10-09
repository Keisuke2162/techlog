'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, LayoutDashboard, Tags, Settings } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { ThemeToggle } from './theme-toggle';

const items = [
  { href: '/', label: 'ホーム', icon: LayoutDashboard },
  { href: '/articles', label: '記事', icon: BookOpen },
  { href: '/tags', label: 'タグ', icon: Tags },
  { href: '/settings', label: '設定', icon: Settings },
];

export function AppNav() {
  const pathname = usePathname();
  return (
    <header className="border-border/70 bg-background/70 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="group focus-ring inline-flex items-center gap-2.5 rounded-md"
          aria-label="TechLog ホーム"
        >
          <LogoMark />
          <span className="flex flex-col leading-none">
            <span className="font-display text-xl leading-none tracking-tight">TechLog</span>
            <span className="text-muted-foreground mt-0.5 text-[10px] tracking-[0.14em] uppercase">
              Reading Journal
            </span>
          </span>
        </Link>

        <nav aria-label="メインナビゲーション" className="flex items-center gap-1">
          <div className="border-border/70 bg-card/70 hidden items-center gap-1 rounded-full border p-1 shadow-xs backdrop-blur sm:inline-flex">
            {items.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === '/'
                  ? pathname === '/'
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all',
                    active
                      ? 'bg-gradient-flame text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/60',
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile icon-only strip */}
          <div className="flex items-center gap-0.5 sm:hidden">
            {items.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === '/'
                  ? pathname === '/'
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors',
                    active
                      ? 'bg-gradient-flame text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/60',
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </Link>
              );
            })}
          </div>

          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

function LogoMark() {
  return (
    <span
      aria-hidden
      className="bg-gradient-flame text-primary-foreground relative inline-flex h-9 w-9 items-center justify-center rounded-xl shadow-sm ring-1 ring-black/5 transition-transform group-hover:-rotate-6"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Open book + bookmark */}
        <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10a2 2 0 0 1 2 2v13a1.5 1.5 0 0 0-1.5-1.5H5.5A1.5 1.5 0 0 1 4 16V5.5Z" />
        <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H14a2 2 0 0 0-2 2v13a1.5 1.5 0 0 1 1.5-1.5h5A1.5 1.5 0 0 0 20 16V5.5Z" />
      </svg>
      <span className="bg-primary-soft ring-background absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ring-2" />
    </span>
  );
}
