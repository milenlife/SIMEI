import test from 'node:test';
import assert from 'node:assert/strict';
import { formatGoogleSignInError, FIREBASE_PROJECT_ID } from './authErrorLogic';

test('formatGoogleSignInError explains unauthorized-domain clearly with hostname and project ID', () => {
  const msg = formatGoogleSignInError(
    { code: 'auth/unauthorized-domain', message: 'Firebase: Error (auth/unauthorized-domain).' },
    'milenlife.github.io'
  );
  assert.ok(msg.includes('milenlife.github.io'));
  assert.ok(msg.includes(FIREBASE_PROJECT_ID));
  assert.ok(msg.includes('Authorized domains'));
});

test('formatGoogleSignInError handles popup-blocked and popup-closed-by-user', () => {
  const blocked = formatGoogleSignInError({ code: 'auth/popup-blocked' });
  assert.ok(blocked.toLowerCase().includes('popup'));

  const closed = formatGoogleSignInError({ code: 'auth/popup-closed-by-user' });
  assert.ok(closed.toLowerCase().includes('ditutup'));
});

test('formatGoogleSignInError falls back cleanly for unknown errors', () => {
  const unknown = formatGoogleSignInError(new Error('Unexpected token'));
  assert.ok(unknown.includes('Unexpected token'));
});
