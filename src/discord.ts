/**
 * Discord SDK Integration for Trivia Rumble Elite
 *
 * Supports Discord Embedded App Activity environment:
 * - Detects Discord iframe environment (frame_id, instance_id, discord_frame, or *.discordsays.com)
 * - Connects via @discord/embedded-app-sdk
 * - Uses silent-first OAuth (`prompt: 'none'`) so returning users never see repeated popups
 * - Falls back to interactive authorize once for first-time / unlinked / revoked users
 * - Passes client_id to /api/exchange for Confidential Client code exchange
 * - Safe openExternalUrl helper for opening external URLs inside Discord sandbox
 */

import { DiscordSDK } from '@discord/embedded-app-sdk';
import { DiscordAuthResult } from './types';

// Default Discord Application Client ID for Trivia Rumble Elite
export const CLIENT_ID = '1535428947624460328';

export type DiscordProfile = NonNullable<DiscordAuthResult['user']>;

export let discordSdk: DiscordSDK | null = null;
export let isDiscord = false;
export let channelId = 'lobby';

let cachedAuthPromise: Promise<DiscordAuthResult> | null = null;

export const inDiscordFrame = (() => {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.has('frame_id') || params.has('instance_id') || params.has('discord_frame')) {
    return true;
  }
  return /\.discordsays\.com$/i.test(window.location.hostname);
})();

export function getDiscordAvatarUrl(user: DiscordProfile): string {
  if (user.avatar) {
    const ext = user.avatar.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=128`;
  }
  if (user.discriminator && user.discriminator !== '0') {
    const idx = Number(user.discriminator) % 5;
    return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
  }
  try {
    const idx = Number((BigInt(user.id) >> 22n) % 6n);
    return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
  } catch {
    return 'https://cdn.discordapp.com/embed/avatars/0.png';
  }
}

export function getDiscordDisplayName(user: DiscordProfile): string {
  const globalName = user.global_name?.trim();
  if (globalName) return globalName;
  if (user.username?.trim()) return user.username.trim();
  return `Player-${user.id.slice(-4)}`;
}

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

function isUserCancelledError(err: unknown): boolean {
  const msg = String((err as any)?.message || err || '').toLowerCase();
  return (
    msg.includes('access_denied') ||
    msg.includes('user denied') ||
    msg.includes('user rejected') ||
    msg.includes('cancelled by user') ||
    msg.includes('canceled by user')
  );
}

function isServerClientConfigError(err: unknown): boolean {
  const msg = String((err as any)?.message || err || '').toLowerCase();
  return (
    msg.includes('invalid_client') ||
    msg.includes('not configured on edge') ||
    msg.includes('not configured on server')
  );
}

async function resolveDiscordClientId(): Promise<string> {
  if (typeof window === 'undefined') return CLIENT_ID;
  const params = new URLSearchParams(window.location.search);
  const paramId = params.get('client_id') || params.get('application_id');
  if (paramId && paramId.trim()) return paramId.trim();

  // Discord Activity iframe URLs follow https://<APPLICATION_ID>.discordsays.com/
  const hostMatch = window.location.hostname.match(/^(\d{17,20})\.discordsays\.com$/i);
  if (hostMatch?.[1]) return hostMatch[1];

  const envId = (import.meta as any).env?.VITE_DISCORD_CLIENT_ID;
  if (envId && String(envId).trim()) return String(envId).trim();

  try {
    const resp = await fetch('/api/discord-config', { cache: 'no-store' });
    if (resp.ok) {
      const data = await resp.json();
      if (data?.clientId && String(data.clientId).trim()) {
        return String(data.clientId).trim();
      }
    }
  } catch {
    // Ignore and fall back to default CLIENT_ID
  }

  return CLIENT_ID;
}

async function exchangeAndAuthenticate(
  sdk: DiscordSDK,
  clientId: string,
  authData: { code?: string; access_token?: string }
): Promise<DiscordProfile | null> {
  // Public client (PKCE): the SDK returns an access_token directly
  if (authData.access_token) {
    const auth = await withTimeout(
      sdk.commands.authenticate({ access_token: String(authData.access_token) }),
      10000,
      'authenticate'
    );
    return (auth?.user as DiscordProfile) ?? null;
  }

  // Confidential client: returns a code -> exchange via /api/exchange
  if (authData.code) {
    const redirectUri = typeof window !== 'undefined' ? window.location.origin : undefined;
    const tokenResp = await fetch('/api/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: String(authData.code),
        client_id: clientId,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResp.ok) {
      const errBody = await tokenResp.text().catch(() => '');
      throw new Error(`[discord] /api/exchange failed (${tokenResp.status}): ${errBody}`);
    }

    const tokenJson = await tokenResp.json();
    if (!tokenJson?.access_token) {
      throw new Error('[discord] /api/exchange returned no access_token');
    }

    const auth = await withTimeout(
      sdk.commands.authenticate({ access_token: String(tokenJson.access_token) }),
      10000,
      'authenticate'
    );
    return (auth?.user as DiscordProfile) ?? null;
  }

  return null;
}

async function runAuthorize(sdk: DiscordSDK, clientId: string): Promise<DiscordProfile | null> {
  // 1. Silent check first (`prompt: 'none'`) so returning users who already
  //    authorized Trivia Rumble Elite authenticate silently without seeing
  //    the authorization popup again.
  let silentAuthResult: { code?: string; access_token?: string } | null = null;
  try {
    silentAuthResult = (await withTimeout(
      sdk.commands.authorize({
        client_id: clientId,
        response_type: 'code',
        state: '',
        prompt: 'none',
        scope: ['identify'],
      }),
      8000,
      'authorize(silent)'
    )) as { code?: string; access_token?: string } | null;
  } catch {
    // Expected for first-time users who have not authorized yet (consent_required).
    silentAuthResult = null;
  }

  if (silentAuthResult && (silentAuthResult.code || silentAuthResult.access_token)) {
    try {
      const user = await exchangeAndAuthenticate(sdk, clientId, silentAuthResult);
      if (user) return user;
    } catch (err) {
      console.warn('[Discord] silent token exchange failed:', err);
      // If Discord rejected the app credentials (e.g. mismatched DISCORD_CLIENT_SECRET),
      // showing an interactive popup won't resolve invalid_client — avoid annoying loop.
      if (isServerClientConfigError(err)) {
        return null;
      }
    }
  }

  // 2. First-time (or revoked) user: open interactive Discord OAuth popup once.
  try {
    const result = await withTimeout(
      sdk.commands.authorize({
        client_id: clientId,
        response_type: 'code',
        state: '',
        scope: ['identify'],
      }),
      180000,
      'authorize(interactive)'
    );
    if (!result) return null;
    return await exchangeAndAuthenticate(
      sdk,
      clientId,
      result as { code?: string; access_token?: string }
    );
  } catch (err) {
    if (!isUserCancelledError(err)) {
      console.warn('[Discord] authorize/exchange error:', err);
    }
    return null;
  }
}

export async function initDiscord(): Promise<DiscordAuthResult> {
  if (cachedAuthPromise) {
    return cachedAuthPromise;
  }

  cachedAuthPromise = (async (): Promise<DiscordAuthResult> => {
    if (!inDiscordFrame) {
      isDiscord = false;
      if (typeof window !== 'undefined') {
        channelId = new URLSearchParams(window.location.search).get('channel_id') || 'lobby';
      }
      return { isDiscord: false, channelId, user: null };
    }

    const params = new URLSearchParams(window.location.search);
    const fallbackChannel = params.get('channel_id') || 'lobby';

    try {
      const resolvedClientId = await resolveDiscordClientId();
      discordSdk = new DiscordSDK(resolvedClientId);
      await withTimeout(discordSdk.ready(), 8000, 'sdk.ready');
      isDiscord = true;
      channelId = discordSdk.channelId || fallbackChannel;

      const user = await runAuthorize(discordSdk, resolvedClientId);
      return { isDiscord: true, channelId, user };
    } catch (err) {
      console.warn('[Discord] init failed or running outside Discord client:', err);
      isDiscord = false;
      return { isDiscord: false, channelId: fallbackChannel, user: null };
    }
  })();

  return cachedAuthPromise;
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
