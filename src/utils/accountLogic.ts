import { INITIAL_ACCOUNTS } from '../data/initialAccounts';
import { UserAccount, UserRole } from '../types/endorsement';

export const GOOGLE_SHEETS_ACCOUNTS_TAB_NAME = 'Akun_Talent';

export const GOOGLE_SHEETS_ACCOUNTS_HEADERS = [
  'ID Akun',
  'Nama Lengkap',
  'Email Login',
  'Password',
  'Role',
  'Kategori Influencer',
  'Nomor WhatsApp',
  'Alamat',
  'Foto URL',
  'Dibuat Pada',
  'Terakhir Diperbarui',
];

/**
 * Check if the user has permission to view and manage talent accounts.
 * Restricted strictly to Owner and Admin.
 */
export function canManageTalentAccounts(role: UserRole): boolean {
  return role === 'owner' || role === 'admin';
}

/**
 * Authenticates user credentials against the account list.
 * Includes fallback to INITIAL_ACCOUNTS in case of stale local storage.
 */
export function authenticateUser(
  emailInput: string,
  passwordInput: string,
  accounts: UserAccount[]
): { success: boolean; account?: UserAccount; message?: string } {
  const cleanEmail = (emailInput || '').trim().toLowerCase();
  const cleanPassword = (passwordInput || '').trim();

  if (!cleanEmail || !cleanPassword) {
    return { success: false, message: 'Email dan password wajib diisi.' };
  }

  // 1. Search in passed accounts list
  let account = accounts.find((a) => (a.email || '').trim().toLowerCase() === cleanEmail);

  // 2. Fallback to INITIAL_ACCOUNTS to prevent login failure from stale browser localStorage
  if (!account) {
    account = INITIAL_ACCOUNTS.find((a) => (a.email || '').trim().toLowerCase() === cleanEmail);
  }

  if (!account) {
    return { success: false, message: 'Akun dengan email tersebut tidak ditemukan.' };
  }

  if (account.password.trim() !== cleanPassword) {
    return { success: false, message: 'Password salah. Silakan periksa kembali.' };
  }

  return { success: true, account };
}

/**
 * Changes password for an existing account.
 */
export function changeAccountPassword(
  emailInput: string,
  newPasswordInput: string,
  accounts: UserAccount[]
): { success: boolean; updatedAccounts?: UserAccount[]; message?: string } {
  const cleanEmail = (emailInput || '').trim().toLowerCase();
  const cleanPassword = (newPasswordInput || '').trim();

  if (!cleanEmail) {
    return { success: false, message: 'Email tidak boleh kosong.' };
  }

  if (!cleanPassword || cleanPassword.length < 5) {
    return { success: false, message: 'Password baru minimal 5 karakter.' };
  }

  let updatedAccounts = [...accounts];
  let index = updatedAccounts.findIndex((a) => (a.email || '').trim().toLowerCase() === cleanEmail);

  if (index === -1) {
    // Check in INITIAL_ACCOUNTS fallback
    const initAcc = INITIAL_ACCOUNTS.find((a) => (a.email || '').trim().toLowerCase() === cleanEmail);
    if (!initAcc) {
      return { success: false, message: 'Akun dengan email tersebut tidak ditemukan.' };
    }
    const newAcc: UserAccount = {
      ...initAcc,
      password: cleanPassword,
      updatedAt: new Date().toISOString(),
    };
    updatedAccounts.unshift(newAcc);
    return { success: true, updatedAccounts, message: 'Password berhasil diperbarui.' };
  }

  updatedAccounts[index] = {
    ...updatedAccounts[index],
    password: cleanPassword,
    updatedAt: new Date().toISOString(),
  };

  return { success: true, updatedAccounts, message: 'Password berhasil diperbarui.' };
}

/**
 * Creates a new Talent account by Owner or Admin.
 */
export function createTalentAccount(
  data: {
    displayName: string;
    email: string;
    password?: string;
    category?: string;
    phone?: string;
  },
  accounts: UserAccount[],
  creatorRole: UserRole
): { success: boolean; newAccount?: UserAccount; updatedAccounts?: UserAccount[]; message?: string } {
  if (!canManageTalentAccounts(creatorRole)) {
    return { success: false, message: 'Hanya Owner dan Admin yang memiliki izin menambah akun talent.' };
  }

  const cleanEmail = data.email.trim().toLowerCase();
  const cleanName = data.displayName.trim();
  const cleanPassword = (data.password || 'talent123').trim();

  if (!cleanName || !cleanEmail) {
    return { success: false, message: 'Nama talent dan email wajib diisi.' };
  }

  if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return { success: false, message: 'Format email tidak valid.' };
  }

  const exists = accounts.some((a) => a.email.toLowerCase() === cleanEmail);
  if (exists) {
    return { success: false, message: `Email ${cleanEmail} sudah terdaftar dalam sistem.` };
  }

  const newAccount: UserAccount = {
    id: `acc-talent-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    email: cleanEmail,
    password: cleanPassword,
    displayName: cleanName,
    role: 'talent',
    category: data.category?.trim() || 'General Creator',
    phone: data.phone?.trim() || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updatedAccounts = [newAccount, ...accounts];
  return { success: true, newAccount, updatedAccounts, message: 'Akun talent berhasil dibuat!' };
}

/**
 * Converts user accounts to Google Sheet 2D array for dedicated tab Akun_Talent
 */
/**
 * Updates a user profile. Strictly restricted so that only the account owner themselves can edit their profile.
 */
export function updateUserProfile(
  loggedInEmail: string,
  targetEmail: string,
  updatedData: {
    displayName: string;
    phone?: string;
    address?: string;
    photoURL?: string;
  },
  accounts: UserAccount[]
): {
  success: boolean;
  updatedAccounts?: UserAccount[];
  updatedAccount?: UserAccount;
  message?: string;
} {
  const cleanLoggedIn = loggedInEmail.trim().toLowerCase();
  const cleanTarget = targetEmail.trim().toLowerCase();

  // Strict check: only the account owner themselves can edit their own profile!
  if (!cleanLoggedIn || cleanLoggedIn !== cleanTarget) {
    return {
      success: false,
      message: 'Akses ditolak: Profil hanya dapat diedit oleh pemilik akun itu sendiri.',
    };
  }

  const cleanName = updatedData.displayName.trim();
  if (!cleanName) {
    return { success: false, message: 'Nama lengkap tidak boleh kosong.' };
  }

  const index = accounts.findIndex((a) => a.email.toLowerCase() === cleanTarget);
  if (index === -1) {
    return { success: false, message: 'Akun pengguna tidak ditemukan.' };
  }

  const updatedAccount: UserAccount = {
    ...accounts[index],
    displayName: cleanName,
    phone: updatedData.phone !== undefined ? updatedData.phone.trim() : accounts[index].phone,
    address: updatedData.address !== undefined ? updatedData.address.trim() : accounts[index].address,
    photoURL: updatedData.photoURL !== undefined ? updatedData.photoURL.trim() : accounts[index].photoURL,
    updatedAt: new Date().toISOString(),
  };

  const updatedAccounts = [...accounts];
  updatedAccounts[index] = updatedAccount;

  return {
    success: true,
    updatedAccounts,
    updatedAccount,
    message: 'Profil berhasil diperbarui!',
  };
}

export function columnNumberToLetter(colCount: number): string {
  let n = Math.max(1, Math.floor(colCount));
  let letters = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

export function getAccountsSheetRange(rowCount: number): string {
  const lastCol = columnNumberToLetter(GOOGLE_SHEETS_ACCOUNTS_HEADERS.length);
  return `${GOOGLE_SHEETS_ACCOUNTS_TAB_NAME}!A1:${lastCol}${Math.max(1, rowCount)}`;
}

/**
 * Converts user accounts to Google Sheet 2D array for dedicated tab Akun_Talent
 */
export function formatAccountsToSheetRows(accounts: UserAccount[]): string[][] {
  const dataRows = accounts.map((a) => [
    a.id,
    a.displayName,
    a.email,
    a.password,
    a.role,
    a.category || '',
    a.phone || '',
    a.address || '',
    a.photoURL || '',
    a.createdAt,
    a.updatedAt,
  ]);

  return [GOOGLE_SHEETS_ACCOUNTS_HEADERS, ...dataRows];
}

/**
 * Parses rows from Google Sheet Akun_Talent tab into UserAccount[]
 */
export function parseSheetRowsToAccounts(rows: string[][]): UserAccount[] {
  if (!rows || rows.length <= 1) return [];

  const contentRows = rows.slice(1);
  const accounts: UserAccount[] = [];

  for (const row of contentRows) {
    const id = String(row[0] || '').trim();
    const displayName = String(row[1] || '').trim();
    const email = String(row[2] || '').trim();
    const password = String(row[3] || 'talent123').trim();
    const roleStr = String(row[4] || 'talent').trim().toLowerCase();
    const role: UserRole = ['owner', 'admin', 'talent'].includes(roleStr)
      ? (roleStr as UserRole)
      : 'talent';
    const category = String(row[5] || '').trim();
    const phone = String(row[6] || '').trim();
    // Support both 9-col and 11-col layouts
    let address = '';
    let photoURL = '';
    let createdAt = new Date().toISOString();
    let updatedAt = new Date().toISOString();

    if (row.length >= 11) {
      address = String(row[7] || '').trim();
      photoURL = String(row[8] || '').trim();
      createdAt = String(row[9] || new Date().toISOString()).trim();
      updatedAt = String(row[10] || new Date().toISOString()).trim();
    } else {
      createdAt = String(row[7] || new Date().toISOString()).trim();
      updatedAt = String(row[8] || new Date().toISOString()).trim();
    }

    if (email && displayName) {
      accounts.push({
        id: id || `acc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        displayName,
        email,
        password,
        role,
        category: category || undefined,
        phone: phone || undefined,
        address: address || undefined,
        photoURL: photoURL || undefined,
        createdAt,
        updatedAt,
      });
    }
  }

  return accounts;
}
