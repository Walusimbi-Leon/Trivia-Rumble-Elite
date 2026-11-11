/**
 * Discord SDK Integration for Trivia Rumble Elite
 * 
 * Supports Discord Embedded App Activity environment:
 * - Detects Discord iframe environment (frame_id or instance_id)
 * - Connects via @discord/embedded-app-sdk
 * - Handles both Public Client (PKCE access_token) and Confidential Client (code exchange)
 * - Safe openExternalLink helper for opening external URLs inside Discord sandbox
 */
import { DiscordSDK } from '@discord/embedded-app-sdk';
import { DiscordAuthResult } from './types';

// Discord Application Client ID for Trivia Rumble Elite
export const CLIENT_ID = '1535428947624460328';

export let discordSdk: DiscordSDK | null = null;
export let isDiscord = false;
export let channelId = 'lobby';

export const inDiscordFrame = (() => {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.has('frame_id') || params.has('instance_id') || params.has('discord_frame');
})();

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`[discord] ${label} timed out after ${ms}ms`));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

export async function initDiscord(): Promise<DiscordAuthResult> {
  if (!inDiscordFrame) {
    isDiscord = false;
    if (typeof window !== 'undefined') {
      channelId = new URLSearchParams(window.location.search).get('channel_id') || 'lobby';
    }
    return { isDiscord: false, channelId, user: null };
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const resolvedClientId = params.get('client_id') || CLIENT_ID;

    discordSdk = new DiscordSDK(resolvedClientId);
    await withTimeout(discordSdk.ready(), 8000, 'sdk.ready');
    isDiscord = true;
    channelId = discordSdk.channelId || params.get('channel_id') || 'lobby';

    const user = await runAuthorize(resolvedClientId);
    return { isDiscord: true, channelId, user };
  } catch (err) {
    console.warn('[Discord] init failed or running outside Discord client:', err);
    isDiscord = false;
    return { isDiscord: false, channelId: 'lobby', user: null };
  }
}

async function runAuthorize(clientId: string) {
  if (!discordSdk) return null;

  try {
    const result = await withTimeout(
      discordSdk.commands.authorize({ client_id: clientId, scope: ['identify'] }),
      12000,
      'authorize'
    );
    if (!result) return null;

    const authData = result as any;
    // Public client (PKCE): the SDK returns an access_token directly
    if (authData?.access_token) {
      const auth = await withTimeout(
        discordSdk.commands.authenticate({ access_token: String(authData.access_token) }),
        5000,
        'authenticate'
      );
      return auth?.user ?? null;
    }

    // Confidential client: returns a code -> exchange via /api/exchange
    if (authData?.code) {
      const tokenResp = await fetch('/api/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: String(authData.code) }),
      });
      if (!tokenResp.ok) return null;
      const { access_token } = await tokenResp.json();
      if (!access_token) return null;
      const auth = await withTimeout(
        discordSdk.commands.authenticate({ access_token }),
        5000,
        'authenticate'
      );
      return auth?.user ?? null;
    }
  } catch (e) {
    console.warn('[Discord] authorize error:', e);
  }
  return null;
}

export function openExternalUrl(url: string) {
  if (inDiscordFrame && discordSdk && typeof discordSdk.commands?.openExternalLink === 'function') {
    discordSdk.commands.openExternalLink({ url }).catch((err) => {
      console.warn('[discord] openExternalLink failed, falling back to window.open', err);
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
