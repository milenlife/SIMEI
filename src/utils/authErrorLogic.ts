export const FIREBASE_PROJECT_ID = 'gen-lang-client-0586483067';

/**
 * Converts Firebase Authentication errors into clear, actionable Indonesian messages
 * for the login screen so users and admins know exactly why Google Sign-In failed.
 */
export function formatGoogleSignInError(err: unknown, hostname = ''): string {
  const errObj = err as { code?: string; message?: string } | null | undefined;
  const code = typeof errObj?.code === 'string' ? errObj.code : '';
  const rawMessage =
    err instanceof Error
      ? err.message
      : typeof errObj?.message === 'string'
        ? errObj.message
        : String(err || '');

  if (code === 'auth/unauthorized-domain' || rawMessage.includes('auth/unauthorized-domain')) {
    const domainLabel = hostname ? `"${hostname}"` : 'domain ini';
    return (
      `Login Google diblokir karena domain ${domainLabel} belum terdaftar di Firebase Authorized Domains ` +
      `(Project: ${FIREBASE_PROJECT_ID}). Tambahkan ${domainLabel} di Firebase Console → Authentication → Settings → Authorized domains, ` +
      `atau silakan masuk menggunakan form Email & Password di atas.`
    );
  }

  if (code === 'auth/popup-blocked' || rawMessage.includes('auth/popup-blocked')) {
    return 'Popup login Google diblokir oleh browser Anda. Izinkan popup untuk situs ini lalu coba lagi.';
  }

  if (
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/cancelled-popup-request' ||
    rawMessage.includes('auth/popup-closed-by-user')
  ) {
    return 'Jendela login Google ditutup sebelum proses masuk selesai. Silakan coba lagi.';
  }

  if (code === 'auth/network-request-failed' || rawMessage.includes('auth/network-request-failed')) {
    return 'Gagal terhubung ke layanan Google karena gangguan koneksi internet. Periksa jaringan Anda lalu coba lagi.';
  }

  if (code === 'auth/operation-not-allowed' || rawMessage.includes('auth/operation-not-allowed')) {
    return `Provider Login Google belum diaktifkan di Firebase Console (Project: ${FIREBASE_PROJECT_ID}).`;
  }

  const detail = code || rawMessage || 'Terjadi kesalahan saat otentikasi Google';
  return `Gagal masuk dengan Akun Google (${detail}).`;
}
