import { UserAccount, UserProfile, UserRole } from '../types/endorsement';

export const SESSION_STORAGE_KEY = 'simei_auth_session_v1';

export type AuthProviderType = 'password' | 'google';

export interface StoredAuthSession {
  isAuthenticated: boolean;
  provider: AuthProviderType;
  user: UserProfile;
  savedAt: string;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const GUEST_USER_PROFILE: UserProfile = {
  uid: 'guest',
  email: '',
  displayName: 'Tamu',
  role: 'talent',
};

function getSafeStorage(storage?: StorageLike): StorageLike | null {
  if (storage) return storage;
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

export function resolveGoogleUserRole(email: string, accounts: UserAccount[]): UserRole {
  const clean = (email || '').trim().toLowerCase();
  if (!clean) return 'talent';

  const matched = accounts.find((a) => (a.email || '').trim().toLowerCase() === clean);
  if (matched) return matched.role;

  if (clean === 'mami.elen14@gmail.com' || clean === 'lovian.yogi@gmail.com') {
    return 'owner';
  }
  if (clean.includes('admin')) {
    return 'admin';
  }
  return 'talent';
}

export function saveAuthSession(
  user: UserProfile,
  provider: AuthProviderType = 'password',
  storage?: StorageLike
): void {
  const store = getSafeStorage(storage);
  if (!store) return;

  const cleanEmail = (user.email || '').trim();
  if (!cleanEmail || user.uid === 'guest') {
    return;
  }

  const payload: StoredAuthSession = {
    isAuthenticated: true,
    provider,
    user: {
      ...user,
      email: cleanEmail,
    },
    savedAt: new Date().toISOString(),
  };

  try {
    store.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function loadAuthSession(
  accounts: UserAccount[],
  storage?: StorageLike
): { isAuthenticated: boolean; user: UserProfile; provider?: AuthProviderType } {
  const store = getSafeStorage(storage);
  if (!store) {
    return { isAuthenticated: false, user: GUEST_USER_PROFILE };
  }

  try {
    const raw = store.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return { isAuthenticated: false, user: GUEST_USER_PROFILE };
    }

    const parsed = JSON.parse(raw) as Partial<StoredAuthSession>;
    if (
      !parsed ||
      parsed.isAuthenticated !== true ||
      !parsed.user ||
      !parsed.user.email ||
      parsed.user.uid === 'guest'
    ) {
      return { isAuthenticated: false, user: GUEST_USER_PROFILE };
    }

    const cleanEmail = parsed.user.email.trim().toLowerCase();
    const matchedAccount = accounts.find(
      (a) => (a.email || '').trim().toLowerCase() === cleanEmail
    );

    const validRole: UserRole = matchedAccount
      ? matchedAccount.role
      : ['owner', 'admin', 'talent'].includes(parsed.user.role as string)
        ? (parsed.user.role as UserRole)
        : 'talent';

    const hydratedUser: UserProfile = {
      ...parsed.user,
      uid: matchedAccount?.id || parsed.user.uid,
      email: matchedAccount?.email || parsed.user.email,
      displayName: matchedAccount?.displayName || parsed.user.displayName || 'Pengguna',
      role: validRole,
      category: matchedAccount?.category ?? parsed.user.category,
      phone: matchedAccount?.phone ?? parsed.user.phone,
      address: matchedAccount?.address ?? parsed.user.address,
      photoURL: matchedAccount?.photoURL ?? parsed.user.photoURL,
    };

    return {
      isAuthenticated: true,
      user: hydratedUser,
      provider: parsed.provider === 'google' ? 'google' : 'password',
    };
  } catch {
    return { isAuthenticated: false, user: GUEST_USER_PROFILE };
  }
}

export function clearAuthSession(storage?: StorageLike): void {
  const store = getSafeStorage(storage);
  if (!store) return;
  try {
    store.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage removal errors
  }
}
