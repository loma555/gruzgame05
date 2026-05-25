"use client";

import { useEffect, useRef } from "react";
import { useAccount, useConnect, useReconnect } from "wagmi";
import { base } from "wagmi/chains";

function pickBaseAppConnector(connectors: ReturnType<typeof useConnect>["connectors"]) {
  return (
    connectors.find((c) => c.id === "baseAccount") ??
    connectors.find((c) => c.id === "farcaster") ??
    connectors.find((c) => c.name.toLowerCase().includes("base")) ??
    null
  );
}

/**
 * Auto-connect wallet in Base App (same flow as manual "Base" in gruzgame04).
 */
export function AutoConnectBaseWallet() {
  const { isConnected, status } = useAccount();
  const { connectAsync, connectors, isPending } = useConnect();
  const { reconnect } = useReconnect();
  const connectAttempted = useRef(false);

  useEffect(() => {
    void reconnect();
  }, [reconnect]);

  useEffect(() => {
    if (isConnected) {
      connectAttempted.current = false;
      return;
    }
    if (isPending || status === "connecting" || status === "reconnecting") {
      return;
    }
    if (connectAttempted.current) {
      return;
    }

    const connector = pickBaseAppConnector(connectors);
    if (!connector) {
      return;
    }

    connectAttempted.current = true;
    void connectAsync({ connector, chainId: base.id }).catch(() => {
      connectAttempted.current = false;
    });
  }, [connectAsync, connectors, isConnected, isPending, status]);

  return null;
}
