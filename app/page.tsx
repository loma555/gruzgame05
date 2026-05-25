"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMiniApp } from "./providers/MiniAppProvider";
import { encodeFunctionData, parseEther } from "viem";
import { base } from "wagmi/chains";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSendTransaction,
  useSwitchChain,
  useWaitForTransactionReceipt,
} from "wagmi";
import { isFarcasterMiniAppConnector, miniAppConnector } from "@/lib/wagmiConfig";
import {
  GRUZGAME05_CHECKIN_PRICE_ETH,
  getGruzGame05ContractAddress,
  gruzGame05OnchainAbi,
  isGruzGame05ContractConfigured,
  withGruzGame05BuilderCodeDataSuffix,
} from "@/lib/contracts/gruzgame05Onchain";
import styles from "./page.module.css";

type View = "menu" | "tap" | "leaderboard" | "checkin";

interface GameState {
  score: number;
  streak: number;
  multiplier: number;
  canCheckinNow: boolean;
  todayKey: string;
  totalCheckins: number;
}

interface LeaderboardRow {
  rank: number;
  wallet: string;
  score: number;
  streak: number;
}

interface PlayerState {
  score: number;
  streak: number;
  lastCheckinSlot: number | null;
  totalCheckins: number;
}

const STORAGE_KEY = "gruzgame05:players";
const CHECKIN_INTERVAL_SECONDS = 2 * 60;

function shortWallet(wallet: string) {
  if (!wallet) return "";
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

function formatCountdownFromSeconds(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function getCurrentCheckinSlot(nowMs: number = Date.now()): number {
  return Math.floor(nowMs / (CHECKIN_INTERVAL_SECONDS * 1000));
}

function getSecondsToNextCheckinWindow(nowMs: number = Date.now()): number {
  const nowSeconds = Math.floor(nowMs / 1000);
  const remainder = nowSeconds % CHECKIN_INTERVAL_SECONDS;
  return remainder === 0 ? CHECKIN_INTERVAL_SECONDS : CHECKIN_INTERVAL_SECONDS - remainder;
}

function parsePlayers(): Record<string, PlayerState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, PlayerState>;
    return parsed ?? {};
  } catch {
    return {};
  }
}

function savePlayers(players: Record<string, PlayerState>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
}

export default function Home() {
  const { context, isReady: isMiniAppReady, isInMiniApp } = useMiniApp();
  const { address, isConnected, chainId } = useAccount();
  const contractAddress = getGruzGame05ContractAddress();
  const contractReady = isGruzGame05ContractConfigured();
  const [view, setView] = useState<View>("menu");
  const [state, setState] = useState<GameState | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [countdown, setCountdown] = useState("00:00:00");
  const [error, setError] = useState("");
  const [checkedUsersCount, setCheckedUsersCount] = useState(0);
  const [pendingTaps, setPendingTaps] = useState(0);
  const [isSubmittingTap, setIsSubmittingTap] = useState(false);
  const [isSubmittingCheckin, setIsSubmittingCheckin] = useState(false);
  const [showWalletOptions, setShowWalletOptions] = useState(false);
  const name = useMemo(
    () => context?.user?.displayName || (address ? `Тренер ${address.slice(2, 6).toUpperCase()}` : "Тренер"),
    [context?.user?.displayName, address],
  );

  const { connectAsync, connectors, isPending: isConnectPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const {
    data: txHash,
    isPending: isWritePending,
    sendTransactionAsync,
    reset: resetSendTransaction,
  } = useSendTransaction();
  const {
    isLoading: isTxMining,
    isSuccess: isTxMined,
    isError: isTxFailed,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: Boolean(txHash) },
  });

  const pendingActionRef = useRef<"tap" | "checkin" | null>(null);
  const processedTxHashRef = useRef<string | null>(null);

  const walletConnectors = useMemo(
    () =>
      connectors.filter((connector) => {
        const name = connector.name.toLowerCase();
        return (
          name.includes("rabby") ||
          name.includes("metamask") ||
          name.includes("injected") ||
          name.includes("base") ||
          name.includes("farcaster")
        );
      }),
    [connectors],
  );

  const farcasterConnector = useMemo(
    () => connectors.find(isFarcasterMiniAppConnector) ?? miniAppConnector,
    [connectors],
  );

  const preferredConnector = useMemo(() => {
    if (isInMiniApp) {
      return farcasterConnector;
    }
    return (
      walletConnectors.find((connector) => connector.name.toLowerCase().includes("rabby")) ??
      walletConnectors.find((connector) => connector.name.toLowerCase().includes("metamask")) ??
      walletConnectors.find((connector) => connector.name.toLowerCase().includes("injected")) ??
      walletConnectors[0]
    );
  }, [farcasterConnector, isInMiniApp, walletConnectors]);

  const ensureWalletReady = useCallback(async (): Promise<boolean> => {
    if (!contractReady) {
      setError("Контракт не настроен. Проверьте GRUZGAME05_CONTRACT_ADDRESS в lib/contracts/gruzgame05Onchain.ts");
      return false;
    }

    if (!isConnected || !address) {
      const connector = preferredConnector;
      if (!connector) {
        setError(isInMiniApp ? "Не удалось подключить кошелёк Base App." : "Подключи кошелёк.");
        return false;
      }
      try {
        await connectAsync({ connector, chainId: base.id });
        setShowWalletOptions(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не удалось подключить кошелёк.");
        if (!isInMiniApp) {
          setShowWalletOptions(true);
        }
        return false;
      }
    }

    if (chainId !== base.id) {
      try {
        await switchChainAsync({ chainId: base.id });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Переключите сеть на Base Mainnet.");
        return false;
      }
    }

    return true;
  }, [
    address,
    chainId,
    connectAsync,
    contractReady,
    isConnected,
    isInMiniApp,
    preferredConnector,
    switchChainAsync,
  ]);

  useEffect(() => {
    if (!isMiniAppReady || !isInMiniApp || isConnected || isConnectPending) {
      return;
    }
    void connectAsync({ connector: farcasterConnector, chainId: base.id }).catch(() => undefined);
  }, [
    connectAsync,
    farcasterConnector,
    isConnected,
    isConnectPending,
    isInMiniApp,
    isMiniAppReady,
  ]);

  const updateLeaderboard = useCallback(() => {
    const players = parsePlayers();
    const rows = Object.entries(players)
      .map(([wallet, player]) => ({
        wallet,
        score: player.score,
        streak: player.streak,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map((row, index) => ({
        rank: index + 1,
        wallet: row.wallet,
        score: row.score,
        streak: row.streak,
      }));
    setLeaderboard(rows);
    setCheckedUsersCount(Object.values(players).filter((player) => player.totalCheckins > 0).length);
  }, []);

  const fetchState = useCallback(async () => {
    if (!address) return;
    try {
      const players = parsePlayers();
      const key = address.toLowerCase();
      const currentSlot = getCurrentCheckinSlot();
      const player = players[key] ?? {
        score: 0,
        streak: 0,
        lastCheckinSlot: null,
        totalCheckins: 0,
      };
      const canCheckinNow = player.lastCheckinSlot !== currentSlot;

      setState({
        score: player.score,
        streak: player.streak,
        multiplier: 1 + player.streak * 0.1,
        canCheckinNow,
        todayKey: String(currentSlot),
        totalCheckins: player.totalCheckins,
      });
      setCountdown(formatCountdownFromSeconds(getSecondsToNextCheckinWindow()));
      updateLeaderboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка чтения локального состояния.");
    }
  }, [address, updateLeaderboard]);

  useEffect(() => {
    if (!isConnected || !address) return;
    setError("");
    void fetchState();
  }, [isConnected, address, fetchState]);

  useEffect(() => {
    let remaining = getSecondsToNextCheckinWindow();
    const tick = () => {
      setCountdown(formatCountdownFromSeconds(remaining));
      if (remaining <= 0) {
        remaining = getSecondsToNextCheckinWindow();
        void fetchState();
      } else {
        remaining = Math.max(0, remaining - 1);
      }
    };
    tick();
    const interval = setInterval(() => {
      tick();
    }, 1000);
    return () => clearInterval(interval);
  }, [fetchState]);

  const finalizeTransaction = useCallback(
    async (hash: string, action: "tap" | "checkin") => {
      if (!address) return;

      try {
        if (action === "checkin") {
          const players = parsePlayers();
          const key = address.toLowerCase();
          const currentSlot = getCurrentCheckinSlot();
          const previousSlot = currentSlot - 1;
          const player = players[key] ?? {
            score: 0,
            streak: 0,
            lastCheckinSlot: null,
            totalCheckins: 0,
          };

          if (player.lastCheckinSlot !== currentSlot) {
            const nextStreak = player.lastCheckinSlot === previousSlot ? player.streak + 1 : 1;
            players[key] = {
              ...player,
              streak: nextStreak,
              lastCheckinSlot: currentSlot,
              totalCheckins: player.totalCheckins + 1,
            };
            savePlayers(players);
          }
        }

        if (action === "tap") {
          const players = parsePlayers();
          const key = address.toLowerCase();
          const player = players[key] ?? {
            score: 0,
            streak: 0,
            lastCheckinSlot: null,
            totalCheckins: 0,
          };
          const tapsToApply = pendingTaps;
          if (tapsToApply > 0) {
            const tapPoints = tapsToApply * (1 + player.streak * 0.1);
            players[key] = {
              ...player,
              score: Number((player.score + tapPoints).toFixed(2)),
            };
            savePlayers(players);
            setPendingTaps(0);
          }
        }

        await fetchState();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка обновления состояния после транзакции.");
      } finally {
        setIsSubmittingCheckin(false);
        setIsSubmittingTap(false);
        pendingActionRef.current = null;
        processedTxHashRef.current = hash;
        resetSendTransaction();
      }
    },
    [address, fetchState, pendingTaps, resetSendTransaction],
  );

  useEffect(() => {
    if (!txHash || processedTxHashRef.current === txHash) return;

    if (isTxFailed) {
      processedTxHashRef.current = txHash;
      setIsSubmittingCheckin(false);
      setIsSubmittingTap(false);
      pendingActionRef.current = null;
      resetSendTransaction();
      setError("Транзакция не подтвердилась в сети. Попробуйте ещё раз.");
      return;
    }

    if (!isTxMined) return;

    const action = pendingActionRef.current;
    if (!action) {
      processedTxHashRef.current = txHash;
      resetSendTransaction();
      return;
    }

    void finalizeTransaction(txHash, action);
  }, [finalizeTransaction, isTxFailed, isTxMined, resetSendTransaction, txHash]);

  const handleTap = () => {
    if (!state || isBusy) return;
    void (async () => {
      if (!(await ensureWalletReady())) return;
      setPendingTaps((prev) => prev + 1);
    })();
  };

  const handleConnectWallet = async (connector = preferredConnector) => {
    if (!connector) {
      setError("Установи Rabby или MetaMask и попробуй подключить кошелек снова.");
      return;
    }

    setError("");
    try {
      await connectAsync({ connector, chainId: base.id });
      setShowWalletOptions(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось подключить кошелек.");
      setShowWalletOptions(true);
    }
  };

  const handleSyncTaps = async () => {
    if (pendingTaps <= 0 || !(await ensureWalletReady())) return;
    setError("");
    try {
      processedTxHashRef.current = null;
      pendingActionRef.current = "tap";
      setIsSubmittingTap(true);
      const data = withGruzGame05BuilderCodeDataSuffix(
        encodeFunctionData({
          abi: gruzGame05OnchainAbi,
          functionName: "tap",
          args: [BigInt(pendingTaps)],
        }),
      );
      await sendTransactionAsync({
        to: contractAddress,
        data,
        value: BigInt(0),
        chainId: base.id,
      });
    } catch (err) {
      pendingActionRef.current = null;
      setIsSubmittingTap(false);
      resetSendTransaction();
      setError(err instanceof Error ? err.message : "Не удалось отправить onchain транзакцию для тапов.");
    }
  };

  const handleCheckin = async () => {
    if (!state?.canCheckinNow || !(await ensureWalletReady())) return;
    setError("");
    try {
      processedTxHashRef.current = null;
      pendingActionRef.current = "checkin";
      setIsSubmittingCheckin(true);
      const data = withGruzGame05BuilderCodeDataSuffix(
        encodeFunctionData({
          abi: gruzGame05OnchainAbi,
          functionName: "checkIn",
        }),
      );
      await sendTransactionAsync({
        to: contractAddress,
        data,
        value: parseEther(GRUZGAME05_CHECKIN_PRICE_ETH),
        chainId: base.id,
      });
    } catch (err) {
      pendingActionRef.current = null;
      setIsSubmittingCheckin(false);
      resetSendTransaction();
      setError(err instanceof Error ? err.message : "Не удалось отправить ончейн check-in транзакцию.");
    }
  };

  const isBusy = isWritePending || isTxMining || isSubmittingCheckin || isSubmittingTap;
  const isCorrectChain = chainId === base.id;
  const multiplier = state ? state.multiplier : 1;
  const projectedScore = Number(((state?.score ?? 0) + pendingTaps * multiplier).toFixed(2));

  return (
    <main className={styles.container}>
      <div className={styles.skyLayer} />
      <div className={styles.cloudLayer} />
      <div className={styles.grassLayer} />
      <div className={styles.pokeballLayer} />

      <section className={styles.card}>
        <h1 className={styles.title}>POKÉMON TAP</h1>
        {!isConnected || !address ? (
          <div className={styles.walletPanel}>
            <p className={styles.warning}>
              {isInMiniApp
                ? isConnectPending
                  ? "Подключение кошелька Base App..."
                  : "Кошелёк Base App подключается автоматически."
                : "Подключи Rabby, MetaMask или Base Account, чтобы играть через сайт."}
            </p>
            {!isInMiniApp && (
            <button
              className={styles.pokemonButton}
              type="button"
              onClick={() => {
                if (walletConnectors.length > 1) {
                  setShowWalletOptions((current) => !current);
                  return;
                }
                void handleConnectWallet();
              }}
              disabled={isConnectPending}
            >
              {isConnectPending ? "Подключение..." : "Подключить кошелек"}
            </button>
            )}
            {isInMiniApp && isConnectPending && (
              <p className={styles.hint}>Ожидайте подключения...</p>
            )}
            {!isInMiniApp && showWalletOptions && (
              <div className={styles.walletOptions}>
                {walletConnectors.length === 0 ? (
                  <p className={styles.hint}>Rabby или MetaMask не найдены в браузере.</p>
                ) : (
                  walletConnectors.map((connector) => (
                    <button
                      className={styles.smallButton}
                      type="button"
                      key={connector.uid}
                      onClick={() => void handleConnectWallet(connector)}
                      disabled={isConnectPending}
                    >
                      {connector.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        ) : !isCorrectChain ? (
          <p className={styles.warning}>Переключите сеть кошелька на Base Mainnet.</p>
        ) : (
          <div className={styles.playerLine}>
            <span>{name}</span>
            <span>{shortWallet(address)}</span>
            <button className={styles.disconnectButton} type="button" onClick={() => disconnect()}>
              Отключить
            </button>
          </div>
        )}

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.scorePanel}>
          <div>
            <p className={styles.metaLabel}>Очки</p>
            <p className={styles.metaValue}>{projectedScore.toFixed(2)}</p>
          </div>
          <div>
            <p className={styles.metaLabel}>Streak</p>
            <p className={styles.metaValue}>{state?.streak ?? 0}</p>
          </div>
          <div>
            <p className={styles.metaLabel}>Множитель</p>
            <p className={styles.metaValue}>x{multiplier.toFixed(2)}</p>
          </div>
        </div>

        <p className={styles.hint}>Тренеров с check-in: {checkedUsersCount}</p>

        {view === "menu" && (
          <div className={styles.menuButtons}>
            <button className={styles.pokemonButton} onClick={() => setView("leaderboard")} type="button">
              Лидерборд
            </button>
            <button className={styles.pokemonButton} onClick={() => setView("checkin")} type="button">
              Ончейн чек-ин
            </button>
            <button className={styles.pokemonButton} onClick={() => setView("tap")} type="button">
              К покемону!
            </button>
          </div>
        )}

        {view === "tap" && (
          <div className={styles.viewBlock}>
            <button
              className={styles.pokemonTapButton}
              type="button"
              onClick={handleTap}
              disabled={!state || isBusy}
            >
              <span className={styles.sparkle}>✨</span>
              <div className={styles.pokemonVisual}>
                <Image
                  src="/pokeball.png"
                  alt="Pokeball"
                  width={200}
                  height={200}
                  className={styles.pokeballSprite}
                  priority
                />
              </div>
              <span className={styles.tapCaption}>ТАПАЙ ПОКЕМОНА</span>
            </button>
            <p className={styles.hint}>Базовый тап = 1 очко. Каждый check-in добавляет +10% к тапу.</p>
            <p className={styles.hint}>Неотправленных тапов: {pendingTaps}</p>
            <button
              className={styles.pokemonButton}
              type="button"
              onClick={() => void handleSyncTaps()}
              disabled={pendingTaps <= 0 || isBusy}
            >
              {isSubmittingTap || isWritePending || isTxMining
                ? "Транзакция..."
                : `Отправить ${pendingTaps} тап(ов) onchain`}
            </button>
          </div>
        )}

        {view === "checkin" && (
          <div className={styles.viewBlock}>
            <p className={styles.checkinText}>
              Следующее окно check-in: <strong>каждые 2 минуты</strong>
            </p>
            <p className={styles.hint}>Стоимость check-in: {GRUZGAME05_CHECKIN_PRICE_ETH} ETH</p>
            <p className={styles.timer}>{countdown}</p>
            <button
              className={styles.pokemonButton}
              type="button"
              onClick={() => void handleCheckin()}
              disabled={!state?.canCheckinNow || isBusy}
            >
              {isBusy
                ? "Транзакция..."
                : state?.canCheckinNow
                  ? "Сделать ончейн check-in"
                  : "Чек-ин уже сделан в этом окне"}
            </button>
            {txHash && <p className={styles.hint}>Tx: {shortWallet(txHash)}</p>}
            <p className={styles.hint}>Всего твоих check-in: {state?.totalCheckins ?? 0}</p>
          </div>
        )}

        {view === "leaderboard" && (
          <div className={styles.viewBlock}>
            <button className={styles.smallButton} type="button" onClick={() => updateLeaderboard()}>
              Обновить
            </button>
            <div className={styles.leaderboard}>
              {leaderboard.length === 0 ? (
                <p className={styles.hint}>Пока нет тренеров. Станьте первым!</p>
              ) : (
                leaderboard.map((row) => (
                  <div className={styles.leaderboardRow} key={`${row.wallet}-${row.rank}`}>
                    <span>#{row.rank}</span>
                    <span>{shortWallet(row.wallet)}</span>
                    <span>
                      {row.score.toFixed(2)} / x{(1 + row.streak * 0.1).toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {view !== "menu" && (
          <button className={styles.backButton} type="button" onClick={() => setView("menu")} disabled={isBusy}>
            В меню
          </button>
        )}
      </section>
    </main>
  );
}
