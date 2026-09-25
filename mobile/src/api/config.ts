import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * HealthHub Patient Mobile API Configuration
 * Backend runs via Laravel: `php artisan serve --host=0.0.0.0 --port=8000`
 */
export function resolveHostIp(): string {
  // 1. Host from Expo dev server (automatic when scanning QR on iPhone/Android on Wi-Fi)
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any)?.manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any)?.manifest?.debuggerHost;

  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return hostIp;
    }
  }

  // 2. Linking URI fallback e.g. exp://10.120.3.140:8081
  const linkingUri = (Constants as any)?.linkingUri;
  if (typeof linkingUri === 'string' && linkingUri.includes('//')) {
    const withoutProto = linkingUri.split('//')[1];
    const ip = withoutProto.split(':')[0].split('/')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return ip;
    }
  }

  // 3. Current active local LAN Wi-Fi IP
  return '10.120.3.140';
}

/**
 * Return an ordered list of candidate backend API URLs to try.
 * Prioritizes local loopback on simulators/emulators and LAN IP for physical devices.
 */
export function getCandidateApiUrls(): string[] {
  const candidates: string[] = [];

  // 1. Explicitly configured URL from .env if valid and not a known dead/placeholder IP
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl && !envUrl.includes('10.10.60.227') && !envUrl.includes('[IP_ADDRESS]')) {
    candidates.push(envUrl.replace(/\/+$/, ''));
  }

  // 2. Simulator / Emulator defaults
  if (Platform.OS === 'android') {
    candidates.push('http://10.0.2.2:8000/api');
  } else {
    // iOS Simulator / macOS / Web can directly access localhost/127.0.0.1
    candidates.push('http://127.0.0.1:8000/api');
    candidates.push('http://localhost:8000/api');
  }

  // 3. Dynamic Expo host IP (needed for physical phones on Wi-Fi)
  const hostIp = resolveHostIp();
  if (hostIp && hostIp !== '127.0.0.1' && hostIp !== 'localhost') {
    candidates.push(`http://${hostIp}:8000/api`);
  }

  // 4. Current machine LAN IP
  candidates.push('http://10.120.3.140:8000/api');

  return Array.from(new Set(candidates.filter(Boolean)));
}

export function resolveApiBaseUrl(): string {
  const candidates = getCandidateApiUrls();
  return candidates[0] || 'http://127.0.0.1:8000/api';
}

export function resolveWebPortalUrl(): string {
  if (process.env.EXPO_PUBLIC_WEB_URL) {
    return process.env.EXPO_PUBLIC_WEB_URL;
  }
  const ip = resolveHostIp();
  return `http://${ip}:3000`;
}

export let API_BASE_URL = resolveApiBaseUrl();
export const WEB_PORTAL_URL = resolveWebPortalUrl();

export function setWorkingApiBaseUrl(url: string): void {
  API_BASE_URL = url;
}
