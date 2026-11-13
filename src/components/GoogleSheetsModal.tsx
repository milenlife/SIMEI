import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Globe,
  Loader2,
  Plus,
  RefreshCw,
  Upload,
  X,
} from 'lucide-react';
import { Endorsement } from '../types/endorsement';
import {
  createEndorsementSpreadsheet,
  extractSpreadsheetId,
  importEndorsementsFromSheet,
  syncEndorsementsToSheet,
} from '../services/googleSheets';
import { getCachedAccessToken } from '../services/firebase';

interface GoogleSheetsModalProps {
  endorsements: Endorsement[];
  onClose: () => void;
  onImportData: (imported: Partial<Endorsement>[]) => void;
  onGoogleSignIn: () => void;
  spreadsheetId: string;
  onSetSpreadsheetId: (id: string) => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  endorsements,
  onClose,
  onImportData,
  onGoogleSignIn,
  spreadsheetId,
  onSetSpreadsheetId,
}) => {
  const [sheetInput, setSheetInput] = useState(spreadsheetId);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Lock background body scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, []);

  const hasToken = !!getCachedAccessToken();

  // Create brand new Google Sheet
  const handleCreateNewSheet = async () => {
    if (!hasToken) {
      onGoogleSignIn();
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await createEndorsementSpreadsheet(
        `SIMEI Database - ${new Date().toLocaleDateString('id-ID')}`,
        endorsements
      );
      onSetSpreadsheetId(result.spreadsheetId);
      setSheetInput(result.spreadsheetId);
      setSuccessMessage(
        `Spreadsheet baru berhasil dibuat dengan ${result.updatedRows} baris data!`
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal membuat Google Spreadsheet.');
    } finally {
      setLoading(false);
    }
  };

  // Sync current data to existing Sheet
  const handleExportToSheet = async () => {
    if (!sheetInput.trim()) {
      setErrorMessage('Harap masukkan Spreadsheet ID atau URL Google Sheets terlebih dahulu.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const cleanId = extractSpreadsheetId(sheetInput);
      const result = await syncEndorsementsToSheet(cleanId, endorsements);
      onSetSpreadsheetId(cleanId);
      setSuccessMessage(
        `Berhasil menyinkronkan ${result.updatedRows} endorsement ke Google Sheets!`
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengekspor data ke Google Sheets.');
    } finally {
      setLoading(false);
    }
  };

  // Import from existing Sheet
  const handleImportFromSheet = async () => {
    if (!sheetInput.trim()) {
      setErrorMessage('Harap masukkan Spreadsheet ID atau URL Google Sheets terlebih dahulu.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const cleanId = extractSpreadsheetId(sheetInput);
      const rows = await importEndorsementsFromSheet(cleanId);
      if (rows.length === 0) {
        setErrorMessage('Tidak ada data endorsement yang ditemukan pada spreadsheet.');
      } else {
        onImportData(rows);
        onSetSpreadsheetId(cleanId);
        setSuccessMessage(`Berhasil mengimpor ${rows.length} data endorsement dari Google Sheets!`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengimpor data dari Google Sheets.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-hidden">
      <div className="relative w-full max-w-xl rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6 shadow-2xl space-y-5 overflow-y-auto overscroll-contain touch-pan-y max-h-[92vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">
                Integrasi Database Google Sheets
              </h2>
              <p className="text-xs text-zinc-400">
                Sinkronisasi dua arah real-time dengan spreadsheet Google Drive Anda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Auth check warning */}
        {!hasToken && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <AlertCircle className="h-4 w-4" />
              <span>Izin Google Workspace Diperlukan</span>
            </div>
            <p className="text-xs text-amber-200/80">
              Untuk membaca atau menulis langsung ke Google Sheets Anda, silakan hubungkan akun
              Google Anda terlebih dahulu.
            </p>
            <button
              onClick={onGoogleSignIn}
              className="mt-2 flex items-center gap-2 rounded-xl bg-amber-500/20 px-3.5 py-2 text-xs font-semibold text-amber-200 border border-amber-500/40 hover:bg-amber-500/30 transition-colors"
            >
              <span>Hubungkan Akun Google</span>
            </button>
          </div>
        )}

        {/* Success or Error banners */}
        {successMessage && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Option 1: Create New Sheet */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-emerald-400" />
                Opsi 1: Buat Spreadsheet Baru
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Otomatis membuat sheet dengan header lengkap (10 tahapan, rate card, link grup WA, dll).
              </p>
            </div>
            <button
              onClick={handleCreateNewSheet}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 shrink-0"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              <span>Buat Sheet Baru</span>
            </button>
          </div>
        </div>

        {/* Option 2: Connect Existing Spreadsheet */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <RefreshCw className="h-4 w-4 text-violet-400" />
            Opsi 2: Hubungkan Spreadsheet yang Ada
          </h3>
          <p className="text-[11px] text-zinc-400">
            Tempelkan URL Google Sheet atau Spreadsheet ID Anda:
          </p>

          <input
            type="text"
            value={sheetInput}
            onChange={(e) => setSheetInput(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/1abcXYZ.../edit atau ID"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-white focus:border-violet-500 focus:outline-none font-mono"
          />

          {spreadsheetId && (
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-zinc-400">Tersambung ke:</span>
              <a
                href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-emerald-400 hover:underline font-medium"
              >
                <span>Buka di Google Sheets</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={handleExportToSheet}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 text-xs font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
            >
              <Upload className="h-4 w-4 text-violet-400" />
              <span>Ekspor ke Sheets</span>
            </button>

            <button
              onClick={handleImportFromSheet}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 text-xs font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 transition-colors"
            >
              <Download className="h-4 w-4 text-cyan-400" />
              <span>Impor dari Sheets</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
