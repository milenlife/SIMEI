export const APP_BRAND_NAME = 'SIMEI';
export const APP_FULL_TITLE = 'SIMEI - Sistem Manajemen Endorsement';

/**
 * Resolves a public asset path cleanly regardless of whether Vite is serving
 * from root ('/'), a relative build ('./'), or a GitHub Pages subpath ('/EndorseHub/').
 */
export function resolvePublicAssetPath(assetFile: string, baseUrl: string = '/'): string {
  const cleanFile = assetFile.replace(/^\/+/, '');
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${normalizedBase}${cleanFile}`;
}

export type InstallPlatform = 'standalone' | 'ios' | 'android' | 'desktop';

export function detectInstallPlatform(userAgent: string, isStandalone: boolean): InstallPlatform {
  if (isStandalone) return 'standalone';
  const ua = (userAgent || '').toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'desktop';
}
