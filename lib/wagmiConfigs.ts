import { base } from "wagmi/chains";
import { createConfig, createStorage, cookieStorage, http } from "wagmi";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { baseAccount, injected } from "wagmi/connectors";
import { APP_DISPLAY_NAME } from "@/lib/appConfig";

/** Base App / Farcaster mini app — embedded wallet only, no Base Account connector. */
export const miniAppWagmiConfig = createConfig({
  chains: [base],
  connectors: [farcasterMiniApp()],
  transports: { [base.id]: http() },
});

/** Browser site — Rabby / MetaMask / injected; Base Account optional for desktop. */
export const webWagmiConfig = createConfig({
  chains: [base],
  connectors: [
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
