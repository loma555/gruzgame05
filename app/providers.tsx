"use client";

import { ReactNode } from "react";
import { MiniAppProvider } from "./providers/MiniAppProvider";
import { WagmiEnvProvider } from "./providers/WagmiEnvProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MiniAppProvider>
      <WagmiEnvProvider>{children}</WagmiEnvProvider>
    </MiniAppProvider>
  );
}
