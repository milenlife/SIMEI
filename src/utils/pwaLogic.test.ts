import test from 'node:test';
import assert from 'node:assert/strict';
import {
  APP_BRAND_NAME,
  detectInstallPlatform,
  resolvePublicAssetPath,
} from './pwaLogic';

test('APP_BRAND_NAME is SIMEI and <= 12 chars for PWA short_name compliance', () => {
  assert.equal(APP_BRAND_NAME, 'SIMEI');
  assert.ok(APP_BRAND_NAME.length <= 12);
});

test('resolvePublicAssetPath supports root, relative, and GitHub Pages subpath bases', () => {
  assert.equal(resolvePublicAssetPath('simei-logo.png', '/'), '/simei-logo.png');
  assert.equal(resolvePublicAssetPath('/simei-logo.png', './'), './simei-logo.png');
  assert.equal(
    resolvePublicAssetPath('simei-logo.png', '/EndorseHub/'),
    '/EndorseHub/simei-logo.png'
  );
  assert.equal(
    resolvePublicAssetPath('/pwa-192x192.png', '/EndorseHub'),
    '/EndorseHub/pwa-192x192.png'
  );
});

test('detectInstallPlatform identifies standalone, iOS, Android, and desktop accurately', () => {
  assert.equal(
    detectInstallPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', true),
    'standalone'
  );
  assert.equal(
    detectInstallPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', false),
    'ios'
  );
  assert.equal(
    detectInstallPlatform('Mozilla/5.0 (Linux; Android 14; Pixel 8)', false),
    'android'
  );
  assert.equal(
    detectInstallPlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64)', false),
    'desktop'
  );
});
