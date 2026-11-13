import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clearAuthSession,
  GUEST_USER_PROFILE,
  loadAuthSession,
  resolveGoogleUserRole,
  saveAuthSession,
  SESSION_STORAGE_KEY,
  StorageLike,
} from './sessionLogic';
import { UserAccount, UserProfile } from '../types/endorsement';

function createMemoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
  };
}

const sampleAccounts: UserAccount[] = [
  {
    id: 'acc_owner',
    email: 'lovian.yogi@gmail.com',
    password: 'lovian18',
    displayName: 'Lovian Yogi',
    role: 'owner',
    phone: '081111111',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  },
  {
    id: 'acc_talent',
    email: 'clarissa@creator.id',
    password: 'talent123',
    displayName: 'Clarissa Maharani',
    role: 'talent',
    category: 'Beauty',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  },
];

test('loadAuthSession stays logged out when no session exists', () => {
  const storage = createMemoryStorage();
  const res = loadAuthSession(sampleAccounts, storage);
  assert.equal(res.isAuthenticated, false);
  assert.equal(res.user.uid, GUEST_USER_PROFILE.uid);
});

test('saveAuthSession persists login across simulated page refreshes until clearAuthSession', () => {
  const storage = createMemoryStorage();
  const talentUser: UserProfile = {
    uid: 'acc_talent',
    email: 'clarissa@creator.id',
    displayName: 'Clarissa Maharani',
    role: 'talent',
  };

  saveAuthSession(talentUser, 'password', storage);

  // Simulated reload
  const restored = loadAuthSession(sampleAccounts, storage);
  assert.equal(restored.isAuthenticated, true);
  assert.equal(restored.provider, 'password');
  assert.equal(restored.user.email, 'clarissa@creator.id');
  assert.equal(restored.user.role, 'talent');
  assert.equal(restored.user.category, 'Beauty');

  // Explicit logout clears session
  clearAuthSession(storage);
  const afterLogout = loadAuthSession(sampleAccounts, storage);
  assert.equal(afterLogout.isAuthenticated, false);
  assert.equal(afterLogout.user.uid, 'guest');
});

test('loadAuthSession handles corrupted storage gracefully and syncs updated profile fields', () => {
  const storage = createMemoryStorage();
  storage.setItem(SESSION_STORAGE_KEY, '{invalid-json');
  const corrupted = loadAuthSession(sampleAccounts, storage);
  assert.equal(corrupted.isAuthenticated, false);

  saveAuthSession(
    {
      uid: 'acc_owner',
      email: 'lovian.yogi@gmail.com',
      displayName: 'Old Name',
      role: 'talent', // even if stale in session, matchedAccount enforces true role
    },
    'password',
    storage
  );

  const synced = loadAuthSession(sampleAccounts, storage);
  assert.equal(synced.isAuthenticated, true);
  assert.equal(synced.user.displayName, 'Lovian Yogi');
  assert.equal(synced.user.role, 'owner');
  assert.equal(synced.user.phone, '081111111');
});

test('resolveGoogleUserRole resolves owner, account-matched, and default talent roles', () => {
  assert.equal(resolveGoogleUserRole('lovian.yogi@gmail.com', sampleAccounts), 'owner');
  assert.equal(resolveGoogleUserRole('clarissa@creator.id', sampleAccounts), 'talent');
  assert.equal(resolveGoogleUserRole('admin.team@gmail.com', sampleAccounts), 'admin');
  assert.equal(resolveGoogleUserRole('someone@gmail.com', sampleAccounts), 'talent');
});
