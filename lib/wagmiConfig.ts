"use client";

import { base } from "wagmi/chains";
import { createConfig, createStorage, cookieStorage, http } from "wagmi";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { baseAccount, injected } from "wagmi/connectors";
import { APP_DISPLAY_NAME } from "@/lib/appConfig";

export const miniAppConnector = farcasterMiniApp();

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    miniAppConnector,
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

export function isFarcasterMiniAppConnector(connector: { id: string; name: string }) {
  const id = connector.id.toLowerCase();
  const name = connector.name.toLowerCase();
  return id === "farcaster" || id.includes("farcaster") || name.includes("farcaster");
}
