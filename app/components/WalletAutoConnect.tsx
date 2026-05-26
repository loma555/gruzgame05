"use client";

import { useEffect, useRef } from "react";
import { useAccount, useConnect, useReconnect } from "wagmi";
import { base } from "wagmi/chains";
import { useMiniApp } from "../providers/MiniAppProvider";

export function WalletAutoConnect() {
  const { isReady, isInMiniApp } = useMiniApp();
  const { isConnected, status } = useAccount();
  const { connectAsync, connectors, isPending } = useConnect();
  const { reconnect } = useReconnect();
  const attemptsRef = useRef(0);

  const farcasterConnector = connectors.find((connector) => connector.id === "farcaster");

  useEffect(() => {
    if (!isReady || !isInMiniApp) return;
    void reconnect();
  }, [isInMiniApp, isReady, reconnect]);

  useEffect(() => {
    if (
      !isReady ||
      !isInMiniApp ||
      !farcasterConnector ||
      isConnected ||
      isPending ||
      status === "connecting" ||
      status === "reconnecting"
    ) {
      return;
    }

    let cancelled = false;

    const tryConnect = async () => {
      while (!cancelled && attemptsRef.current < 12 && !isConnected) {
        attemptsRef.current += 1;
        try {
          await connectAsync({ connector: farcasterConnector, chainId: base.id });
          return;
        } catch {
          await new Promise((resolve) => setTimeout(resolve, 900));
        }
      }
    };

    const timer = setTimeout(() => {
      void tryConnect();
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    connectAsync,
    farcasterConnector,
    isConnected,
    isInMiniApp,
    isPending,
    isReady,
    status,
  ]);

  useEffect(() => {
    if (isConnected) {
      attemptsRef.current = 0;
    }
  }, [isConnected]);

  return null;
}
