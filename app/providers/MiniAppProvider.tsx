"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import sdk from "@farcaster/miniapp-sdk";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import {
  WagmiProvider,
  createConfig,
  http,
  useAccount,
  useConnect,
} from "wagmi";
import { base } from "wagmi/chains";
import { baseAccount, injected } from "wagmi/connectors";
import { APP_DISPLAY_NAME } from "@/lib/appConfig";

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    injected({ target: "rabby" }),
    injected({ target: "metaMask" }),
    injected(),
    baseAccount({
      appName: APP_DISPLAY_NAME,
    }),
    farcasterMiniApp(),
  ],
  transports: {
    [base.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}

const queryClient = new QueryClient();

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

function WalletAutoConnect() {
  const { isConnected, status } = useAccount();
  const { connectAsync, connectors, isPending } = useConnect();

  useEffect(() => {
    if (isConnected || isPending || status === "connecting" || status === "reconnecting") {
      return;
    }

    const connector =
      connectors.find((c) => c.id === "baseAccount") ??
      connectors.find((c) => c.id === "farcaster");

    if (!connector) {
      return;
    }

    void connectAsync({ connector, chainId: base.id }).catch(() => undefined);
  }, [connectAsync, connectors, isConnected, isPending, status]);

  return null;
}

export function MiniAppProvider({ children }: PropsWithChildren) {
  const [context, setContext] = useState<Awaited<typeof sdk.context> | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const isInApp = await sdk.isInMiniApp();
        if (isInApp) {
          setContext(await sdk.context);
        }
      } catch {
        // Outside mini app host
      }

      try {
        await sdk.actions.ready();
      } catch {
        // Safe no-op outside Base App
      } finally {
        setIsReady(true);
      }
    };

    void init();
  }, []);

  return (
    <MiniAppContext.Provider value={{ context, isReady }}>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <WalletAutoConnect />
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </MiniAppContext.Provider>
  );
}
