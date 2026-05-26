"use client";

import { ReactNode, useState } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { miniAppWagmiConfig, webWagmiConfig } from "@/lib/wagmiConfigs";
import { WalletAutoConnect } from "../components/WalletAutoConnect";
import { useMiniApp } from "./MiniAppProvider";

export function WagmiEnvProvider({ children }: { children: ReactNode }) {
  const { isInMiniApp, isReady } = useMiniApp();
  const [queryClient] = useState(() => new QueryClient());

  if (!isReady || isInMiniApp === null) {
    return null;
  }

  const config = isInMiniApp ? miniAppWagmiConfig : webWagmiConfig;
  const envKey = isInMiniApp ? "miniapp" : "web";

  return (
    <WagmiProvider key={envKey} config={config}>
      <QueryClientProvider client={queryClient}>
        {isInMiniApp ? <WalletAutoConnect /> : null}
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
