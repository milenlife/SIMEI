import test from 'node:test';
import assert from 'node:assert/strict';
import {
  authenticateUser,
  changeAccountPassword,
  createTalentAccount,
  canManageTalentAccounts,
  updateUserProfile,
  formatAccountsToSheetRows,
  parseSheetRowsToAccounts,
  getAccountsSheetRange,
  columnNumberToLetter,
  GOOGLE_SHEETS_ACCOUNTS_HEADERS,
  GOOGLE_SHEETS_ACCOUNTS_TAB_NAME,
} from './accountLogic';
import { UserAccount } from '../types/endorsement';

const mockAccounts: UserAccount[] = [
  {
    id: 'acc-owner-01',
    email: 'owner@test.com',
    password: 'ownerSecret',
    displayName: 'Elena Owner',
    role: 'owner',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  },
  {
    id: 'acc-admin-01',
    email: 'admin@test.com',
    password: 'adminSecret',
    displayName: 'Dimas Admin',
    role: 'admin',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  },
  {
    id: 'acc-talent-01',
    email: 'clarissa@creator.id',
    password: 'talentSecret',
    displayName: 'Clarissa Maharani',
    role: 'talent',
    category: 'Beauty',
    phone: '08123456789',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  },
];

test('canManageTalentAccounts restricts talent account creation to Owner and Admin', () => {
  assert.equal(canManageTalentAccounts('owner'), true);
  assert.equal(canManageTalentAccounts('admin'), true);
  assert.equal(canManageTalentAccounts('talent'), false);
});

test('authenticateUser succeeds with correct credentials and fails with wrong ones', () => {
  const success = authenticateUser('owner@test.com', 'ownerSecret', mockAccounts);
  assert.equal(success.success, true);
  assert.equal(success.account?.displayName, 'Elena Owner');
  assert.equal(success.account?.role, 'owner');

  const wrongPassword = authenticateUser('owner@test.com', 'wrongPassword', mockAccounts);
  assert.equal(wrongPassword.success, false);
  assert.equal(wrongPassword.message?.includes('Password salah'), true);

  const nonExistent = authenticateUser('unknown@test.com', 'secret', mockAccounts);
  assert.equal(nonExistent.success, false);
  assert.equal(nonExistent.message?.includes('tidak ditemukan'), true);
});

test('changeAccountPassword updates existing password with validation', () => {
  const shortPass = changeAccountPassword('clarissa@creator.id', '123', mockAccounts);
  assert.equal(shortPass.success, false);
  assert.equal(shortPass.message?.includes('minimal 5 karakter'), true);

  const success = changeAccountPassword('clarissa@creator.id', 'newPass2026', mockAccounts);
  assert.equal(success.success, true);
  const updated = success.updatedAccounts?.find((a) => a.email === 'clarissa@creator.id');
  assert.equal(updated?.password, 'newPass2026');
});

test('createTalentAccount allows Admin to create talent account with password', () => {
  const res = createTalentAccount(
    {
      displayName: 'Ahmad Fauzi',
      email: 'fauzi@creator.id',
      password: 'customPassword123',
      category: 'Tech & Gadgets',
      phone: '081999888777',
    },
    mockAccounts,
    'admin'
  );

  assert.equal(res.success, true);
  assert.equal(res.newAccount?.displayName, 'Ahmad Fauzi');
  assert.equal(res.newAccount?.email, 'fauzi@creator.id');
  assert.equal(res.newAccount?.password, 'customPassword123');
  assert.equal(res.newAccount?.role, 'talent');
  assert.equal(res.updatedAccounts?.length, 4);
});

test('createTalentAccount blocks non-admin from creating accounts', () => {
  const res = createTalentAccount(
    {
      displayName: 'Hacker',
      email: 'hacker@test.id',
    },
    mockAccounts,
    'talent'
  );
  assert.equal(res.success, false);
  assert.equal(res.message?.includes('Hanya Owner dan Admin'), true);
});

test('formatAccountsToSheetRows and parseSheetRowsToAccounts serialize for Akun_Talent tab', () => {
  assert.equal(GOOGLE_SHEETS_ACCOUNTS_TAB_NAME, 'Akun_Talent');

  const rows = formatAccountsToSheetRows(mockAccounts);
  assert.equal(rows.length, 4); // 1 header + 3 accounts
  assert.equal(rows[0][0], 'ID Akun');
  assert.equal(rows[1][2], 'owner@test.com');
  assert.equal(rows[3][5], 'Beauty');

  const parsed = parseSheetRowsToAccounts(rows);
  assert.equal(parsed.length, 3);
  assert.equal(parsed[0].email, 'owner@test.com');
  assert.equal(parsed[2].category, 'Beauty');
  assert.equal(parsed[2].password, 'talentSecret');

  // Verify range covers all 11 columns (A..K) so Google Sheets never throws column J mismatch
  assert.equal(GOOGLE_SHEETS_ACCOUNTS_HEADERS.length, 11);
  assert.equal(rows[0].length, 11);
  assert.equal(rows[1].length, 11);
  assert.equal(columnNumberToLetter(11), 'K');
  assert.equal(getAccountsSheetRange(6), 'Akun_Talent!A1:K6');
});

test('updateUserProfile allows user to edit their own profile but blocks editing other accounts', () => {
  // Self edit succeeds
  const resSuccess = updateUserProfile(
    'clarissa@creator.id',
    'clarissa@creator.id',
    {
      displayName: 'Clarissa M. Update',
      phone: '081299998888',
      address: 'Bandung, Jawa Barat',
      photoURL: 'https://images.unsplash.com/new.jpg',
    },
    mockAccounts
  );

  assert.equal(resSuccess.success, true);
  assert.equal(resSuccess.updatedAccount?.displayName, 'Clarissa M. Update');
  assert.equal(resSuccess.updatedAccount?.phone, '081299998888');
  assert.equal(resSuccess.updatedAccount?.address, 'Bandung, Jawa Barat');

  // Editing another user's profile is strictly rejected
  const resBlocked = updateUserProfile(
    'clarissa@creator.id',
    'owner@test.com',
    {
      displayName: 'Hacked Name',
    },
    mockAccounts
  );

  assert.equal(resBlocked.success, false);
  assert.equal(resBlocked.message?.includes('Akses ditolak'), true);
});

test('authenticateUser authenticates lovian.yogi@gmail.com with lovian18 even if accounts array is empty (fallback)', () => {
  // Test with empty array (simulating stale or missing localStorage)
  const authRes = authenticateUser('lovian.yogi@gmail.com', 'lovian18', []);
  assert.equal(authRes.success, true);
  assert.equal(authRes.account?.email, 'lovian.yogi@gmail.com');
  assert.equal(authRes.account?.role, 'owner');
  assert.equal(authRes.account?.displayName, 'Lovian Yogi');

  // Test with case variations and leading/trailing spaces
  const authTrim = authenticateUser('  Lovian.Yogi@gmail.com  ', 'lovian18', []);
  assert.equal(authTrim.success, true);
  assert.equal(authTrim.account?.email, 'lovian.yogi@gmail.com');

  // Test wrong password
  const wrongPass = authenticateUser('lovian.yogi@gmail.com', 'wrongPass', []);
  assert.equal(wrongPass.success, false);
  assert.equal(wrongPass.message?.includes('Password salah'), true);
});
