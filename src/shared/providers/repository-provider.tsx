'use client';

import * as React from 'react';
import { RepositoryProvider as InnerProvider } from '@/shared/repository/context';
import type { RepositoryBundle } from '@/shared/repository/types';
import { createDexieRepository } from '@/features/articles/infrastructure/dexie-repository';

export function RepositoryProvider({ children }: { children: React.ReactNode }) {
  const [bundle] = React.useState<RepositoryBundle>(() => createDexieRepository());
  return <InnerProvider value={bundle}>{children}</InnerProvider>;
}
