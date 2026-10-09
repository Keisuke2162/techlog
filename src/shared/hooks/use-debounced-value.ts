'use client';

import * as React from 'react';
import { useDebouncedCallback } from './use-debounced';

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value);
  const commit = useDebouncedCallback(setDebounced, delay);
  React.useEffect(() => {
    commit(value);
  }, [value, commit]);
  return debounced;
}
