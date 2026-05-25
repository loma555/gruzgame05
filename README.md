# Gruz Game 05 — Pokemon Tap

Base App mini app for **loma555** (Next.js + wagmi + Farcaster Mini App SDK).

## Config (hardcoded, no Vercel env)

| Item | Value |
|------|--------|
| Base App ID | `6a147457ed0edcf2e9a87728` → `lib/appConfig.ts` + `<meta name="base:app_id">` |
| Contract (Base Mainnet) | [0x2E1a2116d4A449d137953931C2C787Ad86b191Ad](https://basescan.org/address/0x2E1a2116d4A449d137953931C2C787Ad86b191Ad) |
| Builder code | `bc_we8y0l4n` |
| Builder calldata suffix | `0x62635f77653879306c346e0b0080218021802180218021802180218021` |

All onchain settings: `lib/contracts/gruzgame05Onchain.ts`

## Run

```bash
npm install
npm run dev
```

Optional local URL override: `.env.local` with `NEXT_PUBLIC_URL=http://localhost:3000`

## Verify builder calldata

```bash
node scripts/verify-calldata.mjs
```

## GitHub

Repo: https://github.com/loma555/gruzgame05

```bash
git config user.email "lomariss556j@rambler.ru"
git config user.name "loma555"
```
