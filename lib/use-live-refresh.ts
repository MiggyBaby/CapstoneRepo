'use client';

import { useEffect, useRef } from 'react';

export function useLiveRefresh(refresh: () => void, intervalMs = 15000) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refreshRef.current();
    };
    const interval = window.setInterval(refreshWhenVisible, intervalMs);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    window.addEventListener('focus', refreshWhenVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.removeEventListener('focus', refreshWhenVisible);
    };
  }, [intervalMs]);
}
