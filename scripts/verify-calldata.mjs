/**
 * After you set builder code in lib/contracts/gruzgame05Onchain.ts, run:
 * node scripts/verify-calldata.mjs
 */
import { encodeFunctionData } from "viem";

const BUILDER_CODE = process.env.BUILDER_CODE ?? "";
const BUILDER_SUFFIX = process.env.BUILDER_SUFFIX ?? "0x";

const abi = [
  {
    inputs: [{ name: "tapsCount", type: "uint256" }],
    name: "tap",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const data = encodeFunctionData({
  abi,
  functionName: "tap",
  args: [1n],
});

const suffix = BUILDER_SUFFIX.startsWith("0x") ? BUILDER_SUFFIX.slice(2) : BUILDER_SUFFIX;
const full = suffix ? `${data}${suffix}` : data;

console.log("builder code:", BUILDER_CODE || "(not set)");
console.log("tap calldata:", full);
