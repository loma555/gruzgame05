'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import sdk from '@farcaster/miniapp-sdk';

interface MiniAppContextValue {
  context: Awaited<typeof sdk.context> | null;
  isReady: boolean;
  isInMiniApp: boolean;
}

export const MiniAppContext = createContext<MiniAppContextValue>({
  context: null,
  isReady: false,
  isInMiniApp: false,
});

export function useMiniApp() {
  return useContext(MiniAppContext);
}

export function MiniAppProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<Awaited<typeof sdk.context> | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isInMiniApp, setIsInMiniApp] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const inApp = await sdk.isInMiniApp();
        setIsInMiniApp(inApp);
        if (inApp) {
          setContext(await sdk.context);
        }
        await sdk.actions.ready();
      } catch {
        // Outside Base App host
      } finally {
        setIsReady(true);
      }
    };

    void init();

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void sdk.actions.ready().catch(() => undefined);
      }
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  return (
    <MiniAppContext.Provider value={{ context, isReady, isInMiniApp }}>
      {children}
    </MiniAppContext.Provider>
  );
}
