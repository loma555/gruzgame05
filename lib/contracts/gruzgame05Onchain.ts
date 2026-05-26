/** Deployed on Base Mainnet — https://basescan.org/address/0x2E1a2116d4A449d137953931C2C787Ad86b191Ad */
export const GRUZGAME05_CONTRACT_ADDRESS: `0x${string}` =
  "0x2E1a2116d4A449d137953931C2C787Ad86b191Ad";

export const GRUZGAME05_CHECKIN_PRICE_ETH = "0.00001";

/** base.dev → Builder Codes (loma555 / gruzgame05) */
export const GRUZGAME05_BUILDER_CODE = "bc_we8y0l4n";
export const GRUZGAME05_BUILDER_CODE_DATA_SUFFIX: `0x${string}` =
  "0x62635f77653879306c346e0b0080218021802180218021802180218021";

export const gruzGame05OnchainAbi = [
  {
    inputs: [{ internalType: "uint256", name: "tapsCount", type: "uint256" }],
    name: "tap",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "checkIn",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "player", type: "address" }],
    name: "getPlayer",
    outputs: [
      { internalType: "uint256", name: "score", type: "uint256" },
      { internalType: "uint256", name: "streak", type: "uint256" },
      { internalType: "uint256", name: "lastCheckinSlot", type: "uint256" },
      { internalType: "bool", name: "canCheckin", type: "bool" },
      { internalType: "uint256", name: "totalCheckins", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "limit", type: "uint256" }],
    name: "getLeaderboard",
    outputs: [
      {
        components: [
          { internalType: "address", name: "player", type: "address" },
          { internalType: "uint256", name: "score", type: "uint256" },
        ],
        internalType: "struct GruzGame05Onchain.LeaderboardEntry[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export function withGruzGame05BuilderCodeDataSuffix(data: `0x${string}`): `0x${string}` {
  const suffix = GRUZGAME05_BUILDER_CODE_DATA_SUFFIX;
  if (!suffix || suffix === "0x" || suffix.length <= 2) {
    return data;
  }
  return `${data}${suffix.slice(2)}` as `0x${string}`;
}

export function getGruzGame05ContractAddress(): `0x${string}` {
  return GRUZGAME05_CONTRACT_ADDRESS;
}

export function isGruzGame05ContractConfigured(): boolean {
  return (
    GRUZGAME05_CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000"
  );
}
