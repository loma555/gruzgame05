"use client";

import { useEffect, useRef } from "react";
import { useAccount, useConnect, useReconnect } from "wagmi";
import { base } from "wagmi/chains";
import { useMiniApp } from "../providers/MiniAppProvider";

function pickMiniAppConnector(connectors: ReturnType<typeof useConnect>["connectors"]) {
  return (
    connectors.find((connector) => connector.id === "farcaster") ??
    connectors.find((connector) => connector.id === "baseAccount") ??
    connectors.find((connector) => connector.name.toLowerCase().includes("base")) ??
    null
  );
}

export function WalletAutoConnect() {
  const { isReady, context } = useMiniApp();
  const { isConnected, status } = useAccount();
  const { connectAsync, connectors, isPending } = useConnect();
  const { reconnect } = useReconnect();
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!isReady) return;
    void reconnect();
  }, [isReady, reconnect]);

  useEffect(() => {
    if (!isReady || isConnected || isPending || status === "connecting" || status === "reconnecting") {
      return;
    }

    const inMiniApp = Boolean(context);
    if (!inMiniApp) {
      return;
    }

    let cancelled = false;

    const tryConnect = async () => {
      while (!cancelled && attemptsRef.current < 10 && !isConnected) {
        const connector = pickMiniAppConnector(connectors);
        if (!connector) {
          return;
        }

        attemptsRef.current += 1;
        try {
          await connectAsync({ connector, chainId: base.id });
          return;
        } catch {
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      }
    };

    const timer = setTimeout(() => {
      void tryConnect();
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [connectAsync, connectors, context, isConnected, isPending, isReady, status]);

  useEffect(() => {
    if (isConnected) {
      attemptsRef.current = 0;
    }
  }, [isConnected]);

  return null;
}
