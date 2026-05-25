# Gruz Game 05 — Pokemon Tap

Base App mini app (Next.js + wagmi + Farcaster Mini App SDK).

Based on [Build an app on Base](https://docs.base.org/apps/quickstart/build-app) and the `gruzgame04` scaffold.

## Stack

- Next.js App Router
- wagmi + viem (`base` mainnet)
- `@base-org/account` connector
- Farcaster Mini App SDK + Quick Auth

## Environment

Copy `.example.env` to `.env.local` (optional):

```bash
NEXT_PUBLIC_URL=http://localhost:3000
```

**Vercel:** no manual env required.

- Site URL: auto from `VERCEL_PROJECT_PRODUCTION_URL` / `VERCEL_URL` via `lib/siteUrl.ts`
- Contract address: hardcoded in `lib/contracts/gruzgame05Onchain.ts`
- Builder code: set in the same file when you have it from [base.dev](https://base.dev)

## Run

```bash
npm install
npm run dev
```

**Deployed contract (Base Mainnet):** [0x2E1a2116d4A449d137953931C2C787Ad86b191Ad](https://basescan.org/address/0x2E1a2116d4A449d137953931C2C787Ad86b191Ad)

Add builder code + data suffix from base.dev in `lib/contracts/gruzgame05Onchain.ts` when ready.

## GitHub (loma555)

Verified commits: SSH signing key `~/.ssh/id_ed25519_github_sign` — add as **Signing key** on GitHub.

```bash
git config user.email "lomariss556j@rambler.ru"
git config user.name "loma555"
```

GitHub CLI auth: `gh auth status` → account `loma555`.
