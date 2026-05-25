import { APP_DISPLAY_NAME } from "./lib/appConfig";
import { getSiteUrl } from "./lib/siteUrl";

const ROOT_URL = getSiteUrl();

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 *
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
 */
export const farcasterConfig = {
  accountAssociation: {
    header: '',
    payload: '',
    signature: '',
  },
  miniapp: {
    version: '1',
    name: APP_DISPLAY_NAME,
    subtitle: `${APP_DISPLAY_NAME} — gruzgame05`,
    description: 'Tap the Pokemon, perform onchain check-ins every 2 minutes, and climb the trainer leaderboard on Base.',
    imageUrl: `${ROOT_URL}/pokeball.png`,
    buttonTitle: 'Tap Pokemon',
    screenshotUrls: [`${ROOT_URL}/pokeball.png`],
    iconUrl: `${ROOT_URL}/pokeball.png`,
    splashImageUrl: `${ROOT_URL}/pokeball.png`,
    splashBackgroundColor: '#0ea5e9',
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: 'games',
    tags: ['game', 'tap', 'pokemon', 'leaderboard', 'onchain', 'base'],
    heroImageUrl: `${ROOT_URL}/pokeball.png`,
    tagline: 'Tap. Check in. Catch the lead.',
    ogTitle: APP_DISPLAY_NAME,
    ogDescription: 'Pokemon tap game for Base App.',
    ogImageUrl: `${ROOT_URL}/pokeball.png`,
    castShareUrl: ROOT_URL,
  },
} as const;
