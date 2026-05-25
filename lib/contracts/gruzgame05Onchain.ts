/** Deployed on Base Mainnet — https://basescan.org/address/0x2E1a2116d4A449d137953931C2C787Ad86b191Ad */
export const GRUZGAME05_CONTRACT_ADDRESS: `0x${string}` =
  "0x2E1a2116d4A449d137953931C2C787Ad86b191Ad";

export const GRUZGAME05_CHECKIN_PRICE_ETH = "0.00001";

/** From base.dev → Settings → Builder Codes (loma555). Fill when ready. */
export const GRUZGAME05_BUILDER_CODE = "";
export const GRUZGAME05_BUILDER_CODE_DATA_SUFFIX: `0x${string}` = "0x";

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
