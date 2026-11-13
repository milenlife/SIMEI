import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileSpreadsheet,
  KeyRound,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Upload,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { UserAccount, UserProfile, UserRole } from '../types/endorsement';
import { canManageTalentAccounts, createTalentAccount } from '../utils/accountLogic';
import {
  importAccountsFromDedicatedSheet,
  syncAccountsToDedicatedSheet,
} from '../services/googleSheets';

interface TalentAccountManagerModalProps {
  currentUser: UserProfile;
  accounts: UserAccount[];
  onUpdateAccounts: (updated: UserAccount[]) => void;
  spreadsheetId: string;
  onClose: () => void;
}

export const TalentAccountManagerModal: React.FC<TalentAccountManagerModalProps> = ({
  currentUser,
  accounts,
  onUpdateAccounts,
  spreadsheetId,
  onClose,
}) => {
  const canAccess = canManageTalentAccounts(currentUser.role);

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

  // New Talent Form State
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('talent123');
  const [category, setCategory] = useState('Beauty & Skincare');
  const [phone, setPhone] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Status message
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [sheetLoading, setSheetLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (!canAccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-zinc-950 p-6 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Akses Dibatasi</h2>
          <p className="text-xs text-zinc-400">
            Hanya pengguna dengan peran <b>Owner</b> dan <b>Admin</b> yang memiliki wewenang untuk
            melihat dan menambah akun login talent.
          </p>
          <button
            onClick={onClose}
            className="rounded-xl bg-zinc-800 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  // Generate random password
  const generateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$';
    let res = '';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
  };

  const handleCreateTalentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    const result = createTalentAccount(
      { displayName, email, password, category, phone },
      accounts,
      currentUser.role
    );

    if (result.success && result.updatedAccounts) {
      onUpdateAccounts(result.updatedAccounts);
      setStatusMsg({
        type: 'success',
        text: `Akun talent "${displayName}" (${email}) berhasil dibuat!`,
      });

      // Clear form
      setDisplayName('');
      setEmail('');
      setPassword('talent123');
      setPhone('');
    } else {
      setStatusMsg({ type: 'error', text: result.message || 'Gagal membuat akun.' });
    }
  };

  // Sync accounts to dedicated Google Sheet tab 'Akun_Talent'
  const handleSyncToSheets = async () => {
    if (!spreadsheetId) {
      setStatusMsg({
        type: 'error',
        text: 'Spreadsheet ID belum terhubung. Buka menu Google Sheets di navbar terlebih dahulu.',
      });
      return;
    }

    setSheetLoading(true);
    setStatusMsg(null);
    try {
      const res = await syncAccountsToDedicatedSheet(spreadsheetId, accounts);
      setStatusMsg({
        type: 'success',
        text: `Berhasil menyimpan ${res.updatedRows} data akun ke Google Sheet (Tab terpisah: Akun_Talent)!`,
      });
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Gagal menyimpan ke Google Sheets.',
      });
    } finally {
      setSheetLoading(false);
    }
  };

  // Import accounts from dedicated Google Sheet tab
  const handleImportFromSheets = async () => {
    if (!spreadsheetId) {
      setStatusMsg({
        type: 'error',
        text: 'Spreadsheet ID belum terhubung.',
      });
      return;
    }

    setSheetLoading(true);
    setStatusMsg(null);
    try {
      const imported = await importAccountsFromDedicatedSheet(spreadsheetId);
      if (imported.length === 0) {
        setStatusMsg({
          type: 'error',
          text: 'Tidak ada data akun pada tab Akun_Talent.',
        });
      } else {
        // Merge with existing
        const existingMap = new Map(accounts.map((a) => [a.email.toLowerCase(), a]));
        for (const item of imported) {
          existingMap.set(item.email.toLowerCase(), item);
        }
        const merged = Array.from(existingMap.values());
        onUpdateAccounts(merged);
        setStatusMsg({
          type: 'success',
          text: `Berhasil mengimpor ${imported.length} data akun dari Google Sheets tab Akun_Talent!`,
        });
      }
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Gagal membaca tab Akun_Talent dari Google Sheets.',
      });
    } finally {
      setSheetLoading(false);
    }
  };

  const copyCreds = (acc: UserAccount) => {
    const text = `Akun SIMEI Talent:\nNama: ${acc.displayName}\nEmail: ${acc.email}\nPassword: ${acc.password}\nLogin di: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopiedId(acc.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const talentAccounts = accounts.filter((a) => a.role === 'talent');
  const filteredTalents = talentAccounts.filter(
    (t) =>
      !searchQuery ||
      t.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.category && t.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 p-5 sm:p-6 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  Kelola & Tambah Akun Talent
                </h2>
                <span className="rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10px] font-semibold px-2 py-0.5">
                  Owner & Admin Only
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Buat akun login talent lengkap dengan password, tersimpan otomatis di Google Sheets
                tab khusus <b>`Akun_Talent`</b>
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

        {/* Status Banner */}
        {statusMsg && (
          <div
            className={`mx-5 sm:mx-6 mt-4 flex items-center gap-2.5 rounded-xl p-3 text-xs ${
              statusMsg.type === 'success'
                ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border border-rose-500/30 bg-rose-500/10 text-rose-300'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y p-5 sm:p-6 space-y-6">
          {/* Top Form: Tambah Akun Talent Baru */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="h-4 w-4 text-violet-400" />
              Formulir Pembuatan Akun Talent Baru
            </h3>

            <form onSubmit={handleCreateTalentSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-zinc-300 block mb-1">
                    Nama Lengkap Talent *
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Contoh: Sarah Natasha"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-white focus:border-violet-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-zinc-300 block mb-1">
                    Email Login Talent *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sarah@creator.id"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-white focus:border-violet-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Password with generator */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-zinc-300">Password Login *</label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-[10px] text-violet-400 hover:text-violet-300 font-semibold"
                    >
                      Acak Sandi
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-white font-mono focus:border-violet-500 focus:outline-none"
                  />
                </div>

                {/* Kategori */}
                <div>
                  <label className="font-semibold text-zinc-300 block mb-1">
                    Kategori Influencer
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-white focus:border-violet-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Beauty & Skincare">Beauty & Skincare</option>
                    <option value="Fashion & Lifestyle">Fashion & Lifestyle</option>
                    <option value="Food & Culinary">Food & Culinary</option>
                    <option value="Tech & Gadgets">Tech & Gadgets</option>
                    <option value="Mom & Parenting">Mom & Parenting</option>
                    <option value="Gaming & Esports">Gaming & Esports</option>
                    <option value="General Creator">General Creator</option>
                  </select>
                </div>

                {/* Phone / WA */}
                <div>
                  <label className="font-semibold text-zinc-300 block mb-1">Nomor WhatsApp</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08123456789"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-white focus:border-violet-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-zinc-400">
                  Talent dapat langsung menggunakan email & password ini untuk masuk ke SIMEI.
                </span>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 px-4 py-2 font-bold text-white shadow-md shadow-violet-600/30 hover:opacity-95"
                >
                  <Plus className="h-4 w-4" />
                  <span>Buatkan Akun Talent</span>
                </button>
              </div>
            </form>
          </div>

          {/* Google Sheets Sync Card for Akun_Talent */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-white">
                  Database Google Sheets Khusus: Tab `Akun_Talent`
                </p>
                <p className="text-zinc-400 text-[11px] mt-0.5">
                  Menyimpan daftar login talent terpisah dari lembar data kampanye endorsement
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSyncToSheets}
                disabled={sheetLoading}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 font-semibold text-white transition-all disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                <span>{sheetLoading ? 'Menyinkronkan...' : 'Simpan Akun ke Sheets'}</span>
              </button>

              <button
                type="button"
                onClick={handleImportFromSheets}
                disabled={sheetLoading}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 font-semibold text-zinc-200 transition-colors disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                <span>Impor Akun</span>
              </button>
            </div>
          </div>

          {/* Table: Daftar Akun Talent Terdaftar */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-400" />
                  Daftar Akun Talent Terdaftar ({talentAccounts.length} Akun)
                </h3>
                <p className="text-xs text-zinc-400">
                  Data kredensial login aktif untuk influencer agensi
                </p>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari talent atau email..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-800 text-zinc-400 text-[11px] font-semibold uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Nama Talent</th>
                    <th className="py-2.5 px-3">Email Login</th>
                    <th className="py-2.5 px-3">Password</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3">WhatsApp</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredTalents.map((acc) => (
                    <tr key={acc.id} className="hover:bg-zinc-800/30">
                      <td className="py-3 px-3 font-semibold text-white">{acc.displayName}</td>
                      <td className="py-3 px-3 text-zinc-300 font-mono text-[11px]">{acc.email}</td>
                      <td className="py-3 px-3 text-violet-300 font-mono bg-zinc-950/40 rounded px-2 py-1">
                        {acc.password}
                      </td>
                      <td className="py-3 px-3 text-zinc-400">{acc.category || '-'}</td>
                      <td className="py-3 px-3 text-zinc-400">{acc.phone || '-'}</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => copyCreds(acc)}
                          className="flex items-center gap-1 ml-auto text-[11px] font-medium text-zinc-400 hover:text-white"
                          title="Salin rincian login untuk dikirimkan ke talent"
                        >
                          {copiedId === acc.id ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-400" />
                              <span className="text-emerald-400">Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Salin Info Login</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
