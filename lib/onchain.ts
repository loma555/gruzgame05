import { createPublicClient, http, type Address } from "viem";
import { base } from "wagmi/chains";
import {
  GRUZGAME05_CONTRACT_ADDRESS,
  gruzGame05OnchainAbi,
} from "@/lib/contracts/gruzgame05Onchain";

export const basePublicClient = createPublicClient({
  chain: base,
  transport: http(),
});

export async function readOnchainPlayer(wallet: Address) {
  const result = await basePublicClient.readContract({
    address: GRUZGAME05_CONTRACT_ADDRESS,
    abi: gruzGame05OnchainAbi,
    functionName: "getPlayer",
    args: [wallet],
  });

  const [score, streak, lastCheckinSlot, canCheckin, totalCheckins] = result as readonly [
    bigint,
    bigint,
    bigint,
    boolean,
    bigint,
  ];

  return {
    score: Number(score),
    streak: Number(streak),
    lastCheckinSlot: Number(lastCheckinSlot),
    canCheckin,
    totalCheckins: Number(totalCheckins),
  };
}

export async function readOnchainLeaderboard(limit = 20) {
  const rows = await basePublicClient.readContract({
    address: GRUZGAME05_CONTRACT_ADDRESS,
    abi: gruzGame05OnchainAbi,
    functionName: "getLeaderboard",
    args: [BigInt(limit)],
  });

  return (rows as readonly { player: Address; score: bigint }[]).map((row, index) => ({
    rank: index + 1,
    wallet: row.player,
    score: Number(row.score),
  }));
}
