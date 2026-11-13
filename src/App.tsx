import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  FileSpreadsheet,
  Kanban,
  LayoutGrid,
  List,
  Plus,
  Shield,
  Sparkles,
  Table as TableIcon,
  Users,
} from 'lucide-react';
import { DashboardOverview } from './components/DashboardOverview';
import { EndorsementDetailModal } from './components/EndorsementDetailModal';
import { EndorsementFormModal } from './components/EndorsementFormModal';
import { EndorsementKanban } from './components/EndorsementKanban';
import { EndorsementTable } from './components/EndorsementTable';
import { GeminiStudioModal } from './components/GeminiStudioModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { LoginPage } from './components/LoginPage';
import { MonthlyReportView } from './components/MonthlyReportView';
import { Navbar } from './components/Navbar';
import { NotificationDrawer } from './components/NotificationDrawer';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ProfileModal } from './components/ProfileModal';
import { TalentAccountManagerModal } from './components/TalentAccountManagerModal';
import { INITIAL_ACCOUNTS } from './data/initialAccounts';
import { INITIAL_ENDORSEMENTS, INITIAL_NOTIFICATIONS } from './data/initialData';
import {
  googleSignIn,
  initAuth,
  logout,
  markNotificationAsRead,
  saveAuditLogToFirestore,
  saveEndorsementToFirestore,
  saveNotificationToFirestore,
  subscribeToEndorsements,
  subscribeToNotifications,
} from './services/firebase';
import {
  AuditLogItem,
  Endorsement,
  NotificationItem,
  StageName,
  UserAccount,
  UserProfile,
  UserRole,
} from './types/endorsement';
import {
  canCreateEndorsement,
  canDeleteEndorsement,
  canEditEndorsement,
  canModifyEndorsements,
  canViewProject,
  createAuditLog,
  generateStageNotification,
  getStageByIndex,
  STAGES,
} from './utils/endorsementLogic';
import { formatGoogleSignInError } from './utils/authErrorLogic';
import {
  clearAuthSession,
  GUEST_USER_PROFILE,
  loadAuthSession,
  resolveGoogleUserRole,
  saveAuthSession,
} from './utils/sessionLogic';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'endorsements' | 'reports' | 'ai-tools'>(
    'dashboard'
  );
  const [endorsementView, setEndorsementView] = useState<'kanban' | 'table'>('kanban');

  // Accounts state (seeded with Owner, Admin, and Talents)
  const [accounts, setAccounts] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('endorsehub_user_accounts');
      const savedAccounts: UserAccount[] = saved ? JSON.parse(saved) : [];

      const map = new Map<string, UserAccount>();
      // First populate INITIAL_ACCOUNTS
      for (const init of INITIAL_ACCOUNTS) {
        map.set(init.email.trim().toLowerCase(), init);
      }
      // Then merge saved accounts so newly created talent accounts are preserved
      for (const acc of savedAccounts) {
        const key = (acc.email || '').trim().toLowerCase();
        if (!key) continue;
        const existing = map.get(key);
        if (existing) {
          map.set(key, {
            ...existing,
            ...acc,
            role: acc.role || existing.role,
            password: acc.password || existing.password,
          });
        } else {
          map.set(key, acc);
        }
      }

      const merged = Array.from(map.values());
      localStorage.setItem('endorsehub_user_accounts', JSON.stringify(merged));
      return merged;
    } catch {
      return INITIAL_ACCOUNTS;
    }
  });

  // Persistent authentication & current active user (survives refresh until explicit logout)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => loadAuthSession(accounts).isAuthenticated
  );

  // State for Endorsements & Notifications
  const [endorsements, setEndorsements] = useState<Endorsement[]>(() => {
    const saved = localStorage.getItem('endorsehub_items');
    return saved ? JSON.parse(saved) : INITIAL_ENDORSEMENTS;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('endorsehub_notifs');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() => {
    const saved = localStorage.getItem('endorsehub_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // Current active user restored from persistent session
  const [currentUser, setCurrentUser] = useState<UserProfile>(
    () => loadAuthSession(accounts).user
  );

  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    return localStorage.getItem('endorsehub_sheet_id') || '';
  });

  // Modals state
  const [selectedEndorsement, setSelectedEndorsement] = useState<Endorsement | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEndorsement, setEditingEndorsement] = useState<Endorsement | null>(null);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isTalentManagerOpen, setIsTalentManagerOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Sync accounts to local storage
  useEffect(() => {
    localStorage.setItem('endorsehub_user_accounts', JSON.stringify(accounts));
  }, [accounts]);

  // Sync to local storage for persistence & instant responsiveness
  useEffect(() => {
    localStorage.setItem('endorsehub_items', JSON.stringify(endorsements));
  }, [endorsements]);

  useEffect(() => {
    localStorage.setItem('endorsehub_notifs', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('endorsehub_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('endorsehub_role', currentUser.role);
  }, [currentUser.role]);

  useEffect(() => {
    if (spreadsheetId) {
      localStorage.setItem('endorsehub_sheet_id', spreadsheetId);
    }
  }, [spreadsheetId]);

  // Firebase auth & real-time listeners initialization
  useEffect(() => {
    const unsubscribeAuth = initAuth((user) => {
      const stored = loadAuthSession(accounts);
      // Do not overwrite an active Email/Password session with a cached Firebase Google session
      if (stored.isAuthenticated && stored.provider === 'password') {
        return;
      }

      const role = resolveGoogleUserRole(user.email || '', accounts);
      const googleProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Pengguna Google',
        photoURL: user.photoURL || undefined,
        role,
      };
      setCurrentUser(googleProfile);
      setIsAuthenticated(true);
      saveAuthSession(googleProfile, 'google');
    });

    // Real-time Firestore subscriptions (gracefully falls back if rules or network offline)
    const unsubEndorsements = subscribeToEndorsements(
      (items) => {
        if (items && items.length > 0) {
          setEndorsements(items);
        }
      },
      (err) => console.warn('Using local endorsements cache:', err)
    );

    const unsubNotifs = subscribeToNotifications((items) => {
      if (items && items.length > 0) {
        setNotifications(items);
      }
    });

    return () => {
      unsubscribeAuth();
      if (typeof unsubEndorsements === 'function') unsubEndorsements();
      if (typeof unsubNotifs === 'function') unsubNotifs();
    };
  }, []);

  // Filter endorsements based on current user role (Talent can only view their own projects!)
  const visibleEndorsements = endorsements.filter((item) =>
    canViewProject(currentUser.role, currentUser.email, item)
  );

  // Handle stage change with automatic notification and audit logging
  const handleUpdateStage = (item: Endorsement, newStage: StageName) => {
    if (!canEditEndorsement(currentUser.role, currentUser.email, item)) {
      alert('Hanya Admin, Owner, atau Talent pemilik proyek ini yang dapat memperbarui tahapan endorsement.');
      return;
    }

    const fromStage = item.stage;
    const stageIdx = STAGES.findIndex((s) => s.name === newStage);

    const updatedItem: Endorsement = {
      ...item,
      stage: newStage,
      stageIndex: stageIdx >= 0 ? stageIdx : item.stageIndex,
      updatedAt: new Date().toISOString(),
    };

    // 1. Update endorsements state
    setEndorsements((prev) => prev.map((e) => (e.id === item.id ? updatedItem : e)));

    if (selectedEndorsement?.id === item.id) {
      setSelectedEndorsement(updatedItem);
    }

    // 2. Generate and save automatic notification
    const newNotif = generateStageNotification(
      item,
      fromStage,
      newStage,
      currentUser.displayName || currentUser.email
    );
    setNotifications((prev) => [newNotif, ...prev]);

    // 3. Generate audit log
    const newLog = createAuditLog(
      item.id,
      'PERUBAHAN TAHAPAN',
      currentUser.displayName || currentUser.email,
      currentUser.role,
      `Berpindah dari [${fromStage}] ke [${newStage}]`
    );
    setAuditLogs((prev) => [newLog, ...prev]);

    // 4. Async sync to Firestore
    saveEndorsementToFirestore(updatedItem).catch((e) => console.warn('Firestore sync:', e));
    saveNotificationToFirestore(newNotif).catch((e) => console.warn('Notif sync:', e));
    saveAuditLogToFirestore(newLog).catch((e) => console.warn('Log sync:', e));
  };

  // Quick advance stage on Kanban
  const handleAdvanceStage = (item: Endorsement) => {
    if (item.stageIndex >= 9) return;
    const nextStage = getStageByIndex(item.stageIndex + 1).name;
    handleUpdateStage(item, nextStage);
  };

  // Handle create endorsement (Talent can now create their own endorsements)
  const handleCreateEndorsement = (data: Partial<Endorsement>) => {
    if (!canCreateEndorsement(currentUser.role)) {
      alert('Anda tidak memiliki izin menambah endorsement.');
      return;
    }

    const isTalentUser = currentUser.role === 'talent';

    const newEndorsement: Endorsement = {
      id: `end_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      brandName: data.brandName || 'Brand Baru',
      campaignTitle: data.campaignTitle || 'Campaign',
      talentName: isTalentUser ? currentUser.displayName : (data.talentName || 'Talent'),
      talentEmail: isTalentUser ? currentUser.email : (data.talentEmail || 'talent@creator.id'),
      platform: data.platform || 'Instagram',
      fee: Number(data.fee) || 50000,
      stage: data.stage || 'Undangan masuk',
      stageIndex: data.stageIndex || 0,
      deadline: data.deadline || new Date().toISOString().split('T')[0],
      whatsAppGroupLink: data.whatsAppGroupLink,
      notes: data.notes,
      paymentStatus: data.paymentStatus || 'unpaid',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setEndorsements((prev) => [newEndorsement, ...prev]);
    setIsCreateModalOpen(false);

    // Initial audit log
    const log = createAuditLog(
      newEndorsement.id,
      'KAMPANYE DIBUAT',
      currentUser.displayName || currentUser.email,
      currentUser.role,
      `Membuat kampanye "${newEndorsement.campaignTitle}" untuk ${newEndorsement.brandName}`
    );
    setAuditLogs((prev) => [log, ...prev]);

    saveEndorsementToFirestore(newEndorsement).catch((e) => console.warn(e));
    saveAuditLogToFirestore(log).catch((e) => console.warn(e));
  };

  // Handle update endorsement details
  const handleUpdateEndorsement = (updated: Endorsement) => {
    setEndorsements((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    if (selectedEndorsement?.id === updated.id) {
      setSelectedEndorsement(updated);
    }
    if (editingEndorsement?.id === updated.id) {
      setEditingEndorsement(null);
    }
    saveEndorsementToFirestore(updated).catch((e) => console.warn(e));
  };

  // Handle delete endorsement (Owner only)
  const handleDeleteEndorsement = (item: Endorsement) => {
    if (!canDeleteEndorsement(currentUser.role)) {
      alert('Hanya Owner yang memiliki wewenang menghapus endorsement.');
      return;
    }

    if (window.confirm(`Yakin ingin menghapus endorsement "${item.brandName} - ${item.campaignTitle}"?`)) {
      setEndorsements((prev) => prev.filter((e) => e.id !== item.id));
      if (selectedEndorsement?.id === item.id) {
        setSelectedEndorsement(null);
      }
    }
  };

  // Handle Google Sign in
  const handleGoogleSignIn = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await googleSignIn();
      if (res?.user) {
        if (!isAuthenticated) {
          const resolvedRole = resolveGoogleUserRole(res.user.email || '', accounts);
          const googleProfile: UserProfile = {
            uid: res.user.uid,
            email: res.user.email || 'user@gmail.com',
            displayName: res.user.displayName || 'Pengguna Google',
            photoURL: res.user.photoURL || undefined,
            role: resolvedRole,
          };
          setCurrentUser(googleProfile);
          saveAuthSession(googleProfile, 'google');
        }
        return { success: true };
      }
      return {
        success: false,
        error: 'Login dengan akun Google tidak mengembalikan data pengguna.',
      };
    } catch (e: unknown) {
      const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
      const errorMsg = formatGoogleSignInError(e, hostname);
      console.warn('Google sign in error:', e);
      return { success: false, error: errorMsg };
    }
  };

  // Handle Logout (only triggered explicitly by the logged-in user)
  const handleLogout = async () => {
    clearAuthSession();
    try {
      await logout();
    } catch (err) {
      console.warn('Firebase signOut warning:', err);
    }
    setCurrentUser(GUEST_USER_PROFILE);
    setIsAuthenticated(false);
    setCurrentTab('dashboard');
  };

  // Handle importing data from Google Sheets
  const handleImportFromSheets = (imported: Partial<Endorsement>[]) => {
    const valid = imported.filter((i) => i.brandName && i.campaignTitle) as Endorsement[];
    if (valid.length > 0) {
      // Merge with existing avoiding duplicates by ID
      const existingIds = new Set(endorsements.map((e) => e.id));
      const newItems: Endorsement[] = [];
      const updatedList = endorsements.map((e) => {
        const found = valid.find((v) => v.id === e.id);
        return found ? { ...e, ...found } : e;
      });

      for (const item of valid) {
        if (!existingIds.has(item.id)) {
          newItems.push({
            id: item.id || `end_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            brandName: item.brandName,
            campaignTitle: item.campaignTitle,
            talentName: item.talentName || 'Talent',
            talentEmail: item.talentEmail || 'talent@creator.id',
            platform: item.platform || 'Instagram',
            fee: item.fee || 0,
            stage: item.stage || 'Undangan masuk',
            stageIndex: item.stageIndex || 0,
            deadline: item.deadline || new Date().toISOString().split('T')[0],
            paymentStatus: item.paymentStatus || 'unpaid',
            whatsAppGroupLink: item.whatsAppGroupLink,
            postedUrl: item.postedUrl,
            notes: item.notes,
            insights: item.insights,
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }

      const merged = [...updatedList, ...newItems];
      setEndorsements(merged);
      merged.forEach((item) => saveEndorsementToFirestore(item).catch(() => {}));
    }
  };

  // If not authenticated, render Login Page as requested
  if (!isAuthenticated) {
    return (
      <>
        <LoginPage
          accounts={accounts}
          onLoginSuccess={(userProfile) => {
            saveAuthSession(userProfile, 'password');
            setCurrentUser(userProfile);
            setIsAuthenticated(true);
            setAccounts((prev) => {
              const clean = (userProfile.email || '').trim().toLowerCase();
              const exists = prev.some((a) => (a.email || '').trim().toLowerCase() === clean);
              if (!exists) {
                const fromInit = INITIAL_ACCOUNTS.find((a) => (a.email || '').trim().toLowerCase() === clean);
                if (fromInit) {
                  const next = [fromInit, ...prev];
                  localStorage.setItem('endorsehub_user_accounts', JSON.stringify(next));
                  return next;
                }
              }
              return prev;
            });
          }}
          onUpdateAccounts={(updatedAccounts) => {
            setAccounts(updatedAccounts);
            localStorage.setItem('endorsehub_user_accounts', JSON.stringify(updatedAccounts));
          }}
          onGoogleSignIn={async () => {
            const res = await handleGoogleSignIn();
            if (res.success) {
              setIsAuthenticated(true);
            }
            return res;
          }}
        />
        <OfflineIndicator />
      </>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-violet-500/30 selection:text-violet-200">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentUser={currentUser}
        onGoogleSignIn={handleGoogleSignIn}
        onLogout={handleLogout}
        unreadNotifCount={notifications.filter((n) => !n.read).length}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        isSheetsConnected={!!spreadsheetId}
        onOpenTalentManager={() => setIsTalentManagerOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8 py-5 sm:py-6 min-w-0">
        {/* TAB 1: Dashboard & Pipeline */}
        {currentTab === 'dashboard' && (
          <DashboardOverview
            endorsements={visibleEndorsements}
            currentUser={currentUser}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
            onSelectEndorsement={setSelectedEndorsement}
            onGoToTab={setCurrentTab}
          />
        )}

        {/* TAB 2: Daftar Endorsement (Kanban & Table) */}
        {currentTab === 'endorsements' && (
          <div className="space-y-6">
            {/* View Switcher Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  Daftar Endorsement & Pemantauan 10 Tahapan
                </h1>
                <p className="text-xs text-zinc-400 mt-1">
                  {currentUser.role === 'talent'
                    ? `Menampilkan proyek yang Anda kerjakan (${visibleEndorsements.length} kampanye aktif)`
                    : `Menampilkan semua proyek agensi (${visibleEndorsements.length} kampanye total)`}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* View Switcher: Kanban vs Table */}
                <div className="flex rounded-xl bg-zinc-900 p-1 border border-zinc-800 text-xs">
                  <button
                    onClick={() => setEndorsementView('kanban')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all ${
                      endorsementView === 'kanban'
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Kanban className="h-4 w-4" />
                    <span>Papan Kanban (10 Tahap)</span>
                  </button>

                  <button
                    onClick={() => setEndorsementView('table')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all ${
                      endorsementView === 'table'
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <TableIcon className="h-4 w-4" />
                    <span>Tabel Rinci</span>
                  </button>
                </div>

                {canCreateEndorsement(currentUser.role) && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-violet-600/25 hover:opacity-95"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Tambah Endorsement</span>
                  </button>
                )}
              </div>
            </div>

            {/* Kanban or Table View */}
            {endorsementView === 'kanban' ? (
              <EndorsementKanban
                endorsements={visibleEndorsements}
                currentUser={currentUser}
                onSelectEndorsement={setSelectedEndorsement}
                onAdvanceStage={handleAdvanceStage}
                onOpenCreateModal={() => setIsCreateModalOpen(true)}
              />
            ) : (
              <EndorsementTable
                endorsements={visibleEndorsements}
                currentUser={currentUser}
                onSelectEndorsement={setSelectedEndorsement}
                onEditEndorsement={setEditingEndorsement}
                onDeleteEndorsement={handleDeleteEndorsement}
                onOpenCreateModal={() => setIsCreateModalOpen(true)}
              />
            )}
          </div>
        )}

        {/* TAB 3: Laporan Bulanan */}
        {currentTab === 'reports' && (
          <MonthlyReportView
            endorsements={visibleEndorsements}
            currentUser={currentUser}
            onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
            onSelectEndorsement={setSelectedEndorsement}
          />
        )}

        {/* TAB 4: Gemini AI Studio */}
        {currentTab === 'ai-tools' && <GeminiStudioModal />}
      </main>

      {/* Detail Modal */}
      {selectedEndorsement && (
        <EndorsementDetailModal
          endorsement={selectedEndorsement}
          currentUser={currentUser}
          auditLogs={auditLogs}
          onClose={() => setSelectedEndorsement(null)}
          onUpdateStage={handleUpdateStage}
          onUpdateEndorsement={handleUpdateEndorsement}
        />
      )}

      {/* Create / Edit Form Modal */}
      {(isCreateModalOpen || editingEndorsement) && (
        <EndorsementFormModal
          initialData={editingEndorsement}
          currentUser={currentUser}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingEndorsement(null);
          }}
          onSubmit={(data) => {
            if (editingEndorsement) {
              handleUpdateEndorsement({
                ...editingEndorsement,
                ...data,
                updatedAt: new Date().toISOString(),
              } as Endorsement);
            } else {
              handleCreateEndorsement(data);
            }
          }}
        />
      )}

      {/* Google Sheets Modal (Owner & Admin only) */}
      {isSheetsModalOpen && currentUser.role !== 'talent' && (
        <GoogleSheetsModal
          endorsements={endorsements}
          spreadsheetId={spreadsheetId}
          onSetSpreadsheetId={setSpreadsheetId}
          onClose={() => setIsSheetsModalOpen(false)}
          onImportData={handleImportFromSheets}
          onGoogleSignIn={handleGoogleSignIn}
        />
      )}

      {/* Notification Drawer */}
      <NotificationDrawer
        notifications={notifications}
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onMarkAsRead={(id) => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
          );
          markNotificationAsRead(id);
        }}
        onMarkAllAsRead={() => {
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
          notifications.forEach((n) => markNotificationAsRead(n.id));
        }}
        onSelectEndorsementById={(id) => {
          const found = endorsements.find((e) => e.id === id);
          if (found) setSelectedEndorsement(found);
        }}
      />

      {/* Talent Account Manager Modal (Dedicated 'Akun_Talent' Sheet Tab) */}
      {isTalentManagerOpen && (
        <TalentAccountManagerModal
          currentUser={currentUser}
          accounts={accounts}
          spreadsheetId={spreadsheetId}
          onClose={() => setIsTalentManagerOpen(false)}
          onUpdateAccounts={(updated) => {
            setAccounts(updated);
            localStorage.setItem('endorsehub_user_accounts', JSON.stringify(updated));
          }}
        />
      )}

      {/* User Profile Modal (Strictly editable by owner of the profile only) */}
      {isProfileModalOpen && (
        <ProfileModal
          currentUser={currentUser}
          accounts={accounts}
          onClose={() => setIsProfileModalOpen(false)}
          onUpdateProfile={(updatedProfile, updatedAccounts) => {
            setCurrentUser(updatedProfile);
            setAccounts(updatedAccounts);
            const activeProvider = loadAuthSession(updatedAccounts).provider || 'password';
            saveAuthSession(updatedProfile, activeProvider);
            localStorage.setItem('endorsehub_user_accounts', JSON.stringify(updatedAccounts));
            localStorage.setItem('endorsehub_role', updatedProfile.role);
          }}
        />
      )}

      <OfflineIndicator />
    </div>
  );
}
