'use client';

import * as React from 'react';
import type { RepositoryBundle } from './types';

const RepositoryContext = React.createContext<RepositoryBundle | null>(null);

export function RepositoryProvider({
  value,
  children,
}: {
  value: RepositoryBundle;
  children: React.ReactNode;
}) {
  return <RepositoryContext.Provider value={value}>{children}</RepositoryContext.Provider>;
}

export function useRepository(): RepositoryBundle {
  const value = React.useContext(RepositoryContext);
  if (!value) {
    throw new Error('useRepository must be used within RepositoryProvider');
  }
  return value;
}
