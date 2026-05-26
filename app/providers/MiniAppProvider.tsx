"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import sdk from "@farcaster/miniapp-sdk";

interface MiniAppContextValue {
  context: Awaited<typeof sdk.context> | null;
  isReady: boolean;
  /** null while detecting; true inside Base App / Farcaster mini app host. */
  isInMiniApp: boolean | null;
}

export const MiniAppContext = createContext<MiniAppContextValue>({
  context: null,
  isReady: false,
  isInMiniApp: null,
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
  const [isInMiniApp, setIsInMiniApp] = useState<boolean | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const inApp = await sdk.isInMiniApp();
        setIsInMiniApp(inApp);
        if (inApp) {
          setContext(await sdk.context);
        }
        await signalMiniAppReady();
      } catch {
        setIsInMiniApp(false);
      } finally {
        setIsReady(true);
      }
    };

    void init();

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void signalMiniAppReady();
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  return (
    <MiniAppContext.Provider value={{ context, isReady, isInMiniApp }}>
      {children}
    </MiniAppContext.Provider>
  );
}
