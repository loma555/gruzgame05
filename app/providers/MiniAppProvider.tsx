'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import sdk from '@farcaster/miniapp-sdk';

interface MiniAppContextValue {
  context: Awaited<typeof sdk.context> | null;
  isReady: boolean;
}

export const MiniAppContext = createContext<MiniAppContextValue>({
  context: null,
  isReady: false,
});

export function useMiniApp() {
  return useContext(MiniAppContext);
}

async function signalMiniAppReady() {
  try {
    const isInApp = await sdk.isInMiniApp();
    if (isInApp) {
      await sdk.actions.ready();
    }
  } catch {
    // Safe no-op outside Base App or if host is not ready yet.
  }
}

export function MiniAppProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<Awaited<typeof sdk.context> | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const isInApp = await sdk.isInMiniApp();
        if (isInApp) {
          setContext(await sdk.context);
        }
        await signalMiniAppReady();
      } finally {
        setIsReady(true);
      }
    };

    void init();

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void signalMiniAppReady();
      }
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  return (
    <MiniAppContext.Provider value={{ context, isReady }}>
      {children}
    </MiniAppContext.Provider>
  );
}
