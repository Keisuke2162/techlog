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
    <header className="border-border/70 bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="focus-visible:ring-ring inline-flex items-center gap-2 rounded-md text-sm font-semibold tracking-tight focus-visible:ring-2 focus-visible:outline-none"
          aria-label="TechLog"
        >
          <LogoMark />
          <span>TechLog</span>
        </Link>

        <nav aria-label="メインナビゲーション" className="flex items-center gap-0.5">
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
                  'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors',
                  active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/60',
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
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
      className="bg-primary/15 text-primary inline-flex h-6 w-6 items-center justify-center rounded-md"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10a2 2 0 0 1 2 2v13a1.5 1.5 0 0 0-1.5-1.5H5.5A1.5 1.5 0 0 1 4 16V5.5Z" />
        <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H14a2 2 0 0 0-2 2v13a1.5 1.5 0 0 1 1.5-1.5h5A1.5 1.5 0 0 0 20 16V5.5Z" />
      </svg>
    </span>
  );
}
