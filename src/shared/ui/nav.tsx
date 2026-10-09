'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, LayoutDashboard, Tags, Settings } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { ThemeToggle } from './theme-toggle';

const items = [
  { href: '/', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/articles', label: '記事', icon: BookOpen },
  { href: '/tags', label: 'タグ', icon: Tags },
  { href: '/settings', label: '設定', icon: Settings },
];

export function AppNav() {
  const pathname = usePathname();
  return (
    <header className="border-border bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span aria-hidden className="text-xl">
            📚
          </span>
          <span>TechLog</span>
        </Link>
        <nav aria-label="メインナビゲーション" className="flex items-center gap-1">
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
                  'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
                  active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
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
