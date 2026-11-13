import { Endorsement } from '../types/endorsement';
import {
  formatEndorsementsToSheetRows,
  parseSheetRowsToEndorsements,
} from '../utils/endorsementLogic';
import { getCachedAccessToken } from './firebase';

export interface SheetSyncResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  updatedRows: number;
}

/**
 * Extracts spreadsheetId from URL or raw ID
 */
export function extractSpreadsheetId(urlOrId: string): string {
  const match = urlOrId.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return urlOrId.trim();
}

/**
 * Creates a brand new Google Spreadsheet in the user's Drive with formatted headers
 */
export async function createEndorsementSpreadsheet(
  title: string,
  endorsements: Endorsement[]
): Promise<SheetSyncResult> {
  const token = getCachedAccessToken();
  if (!token) {
    throw new Error('Belum terautentikasi dengan akun Google. Silakan login terlebih dahulu.');
  }

  const rows = formatEndorsementsToSheetRows(endorsements);

  // 1. Create spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title || `SIMEI Database - ${new Date().toISOString().split('T')[0]}`,
      },
      sheets: [
        {
          properties: {
            title: 'Endorsements',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errorBody = await createRes.json();
    throw new Error(errorBody?.error?.message || 'Gagal membuat Google Spreadsheet baru.');
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;

  // 2. Populate data
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Endorsements!A1:P${rows.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `Endorsements!A1:P${rows.length}`,
        majorDimension: 'ROWS',
        values: rows,
      }),
    }
  );

  if (!updateRes.ok) {
    const errorBody = await updateRes.json();
    console.warn('Gagal mengisi baris awal:', errorBody);
  }

  return {
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    updatedRows: rows.length,
  };
}

/**
 * Exports current endorsements to an existing Google Spreadsheet
 */
export async function syncEndorsementsToSheet(
  spreadsheetId: string,
  endorsements: Endorsement[]
): Promise<SheetSyncResult> {
  const token = getCachedAccessToken();
  if (!token) {
    throw new Error('Sesi Google Sheets telah berakhir. Harap login kembali.');
  }

  const cleanId = extractSpreadsheetId(spreadsheetId);
  const rows = formatEndorsementsToSheetRows(endorsements);

  // Overwrite range matching exact row count and 16 columns (A..P)
  const targetRange = `A1:P${rows.length}`;
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(
      targetRange
    )}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: targetRange,
        majorDimension: 'ROWS',
        values: rows,
      }),
    }
  );

  if (!updateRes.ok) {
    const err = await updateRes.json();
    throw new Error(err?.error?.message || 'Gagal sinkronisasi data ke Google Sheets.');
  }

  return {
    spreadsheetId: cleanId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${cleanId}`,
    updatedRows: rows.length,
  };
}

/**
 * Imports endorsements from an existing Google Spreadsheet
 */
export async function importEndorsementsFromSheet(
  spreadsheetId: string
): Promise<Partial<Endorsement>[]> {
  const token = getCachedAccessToken();
  if (!token) {
    throw new Error('Token Google Sheets tidak tersedia. Silakan klik Login dengan Google.');
  }

  const cleanId = extractSpreadsheetId(spreadsheetId);

  // Fetch sheet metadata to find sheet tab name
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}?fields=sheets.properties`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!metaRes.ok) {
    const err = await metaRes.json();
    throw new Error(err?.error?.message || 'Spreadsheet tidak ditemukan atau tidak memiliki izin akses.');
  }

  const metaData = await metaRes.json();
  const firstSheetTitle = metaData?.sheets?.[0]?.properties?.title || 'Sheet1';

  // Fetch values from first tab
  const readRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(
      firstSheetTitle
    )}!A1:P200`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!readRes.ok) {
    const err = await readRes.json();
    throw new Error(err?.error?.message || 'Gagal membaca isi Google Sheets.');
  }

  const data = await readRes.json();
  const rawRows: (string | number)[][] = data.values || [];

  return parseSheetRowsToEndorsements(rawRows);
}

/**
 * Syncs user accounts to dedicated tab 'Akun_Talent' in Google Sheets
 */
export async function syncAccountsToDedicatedSheet(
  spreadsheetId: string,
  accounts: any[]
): Promise<SheetSyncResult> {
  const token = getCachedAccessToken();
  if (!token) {
    throw new Error('Sesi Google Sheets telah berakhir. Harap login terlebih dahulu.');
  }

  const cleanId = extractSpreadsheetId(spreadsheetId);
  const {
    formatAccountsToSheetRows,
    getAccountsSheetRange,
    GOOGLE_SHEETS_ACCOUNTS_TAB_NAME,
  } = await import('../utils/accountLogic');
  // Sanitize any cell exceeding Google Sheets' 50,000-character limit (e.g. large base64 avatars)
  const rows = formatAccountsToSheetRows(accounts).map((row) =>
    row.map((cell) =>
      typeof cell === 'string' && cell.length > 49000
        ? cell.startsWith('data:image/')
          ? ''
          : cell.slice(0, 49000)
        : cell
    )
  );

  // 1. Check if tab 'Akun_Talent' already exists
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}?fields=sheets.properties`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!metaRes.ok) {
    const err = await metaRes.json();
    throw new Error(err?.error?.message || 'Spreadsheet tidak ditemukan.');
  }

  const metaData = await metaRes.json();
  const sheets = metaData?.sheets || [];
  const tabExists = sheets.some(
    (s: any) => s.properties?.title === GOOGLE_SHEETS_ACCOUNTS_TAB_NAME
  );

  // 2. If tab does not exist, create tab 'Akun_Talent' via batchUpdate
  if (!tabExists) {
    const addTabRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: GOOGLE_SHEETS_ACCOUNTS_TAB_NAME,
                  gridProperties: {
                    frozenRowCount: 1,
                  },
                },
              },
            },
          ],
        }),
      }
    );

    if (!addTabRes.ok) {
      console.warn('Failed to add Akun_Talent tab:', await addTabRes.json());
    }
  }

  // 3. Write account rows into Akun_Talent tab using dynamic range covering all columns (A..K)
  const range = getAccountsSheetRange(rows.length);
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(
      range
    )}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values: rows,
      }),
    }
  );

  if (!updateRes.ok) {
    const err = await updateRes.json();
    throw new Error(err?.error?.message || 'Gagal menyimpan akun ke tab Akun_Talent.');
  }

  return {
    spreadsheetId: cleanId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${cleanId}`,
    updatedRows: rows.length,
  };
}

/**
 * Imports accounts from dedicated tab 'Akun_Talent' in Google Sheets
 */
export async function importAccountsFromDedicatedSheet(
  spreadsheetId: string
): Promise<any[]> {
  const token = getCachedAccessToken();
  if (!token) {
    throw new Error('Token Google Sheets tidak tersedia. Silakan klik Login dengan Google.');
  }

  const cleanId = extractSpreadsheetId(spreadsheetId);
  const {
    parseSheetRowsToAccounts,
    getAccountsSheetRange,
  } = await import('../utils/accountLogic');

  const readRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(
      getAccountsSheetRange(200)
    )}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!readRes.ok) {
    const err = await readRes.json();
    throw new Error(err?.error?.message || 'Gagal membaca tab Akun_Talent dari Google Sheets.');
  }

  const data = await readRes.json();
  const rawRows: string[][] = data.values || [];
  return parseSheetRowsToAccounts(rawRows);
}
