"use client";
import { ReactNode, useState } from "react";
import { base } from "wagmi/chains";
import { createConfig, createStorage, cookieStorage, http, WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { baseAccount, injected } from "wagmi/connectors";
import { APP_DISPLAY_NAME } from "@/lib/appConfig";
import { MiniAppProvider } from "./providers/MiniAppProvider";

const config = createConfig({
  chains: [base],
  connectors: [
    farcasterMiniApp(),
    injected({ target: "rabby" }),
    injected({ target: "metaMask" }),
    injected(),
    baseAccount({
      appName: APP_DISPLAY_NAME,
    }),
  ],
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  transports: { [base.id]: http() },
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <MiniAppProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </MiniAppProvider>
  );
}
