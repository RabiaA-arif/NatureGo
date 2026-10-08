import React, { useState } from 'react';
import {
  X,
  Compass,
  ShieldCheck,
  User,
  Sparkles,
  ArrowRight,
  Lock,
  Mail,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'user' | 'admin';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'user',
}) => {
  const { loginWithGoogle, loginAsDemoExplorer, loginAsAdmin, isLoading } = useAuth();
  const [tab, setTab] = useState<'user' | 'admin'>(defaultTab);

  // User login form state
  const [explorerName, setExplorerName] = useState<string>('');
  const [explorerEmail, setExplorerEmail] = useState<string>('');

  // Admin login state
  const [adminEmail, setAdminEmail] = useState<string>('rabiaarifai55@gmail.com');
  const [adminPasscode, setAdminPasscode] = useState<string>('');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setErrorNotice(null);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: unknown) {
      console.warn('Google login popup notice, switching to instant login:', err);
      // Fallback for iframe where popup might be blocked
      await loginAsDemoExplorer(explorerName || 'Nature Explorer', explorerEmail || 'explorer@naturego.app');
      onClose();
    }
  };

  const handleExplorerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);
    try {
      const name = explorerName.trim() || 'Alex Woodland';
      const email = explorerEmail.trim() || 'alex.woodland@naturego.app';
      await loginAsDemoExplorer(name, email);
      onClose();
    } catch (err: unknown) {
      setErrorNotice((err as Error).message || 'Failed to login');
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);
    try {
      await loginAsAdmin(adminEmail.trim() || 'rabiaarifai55@gmail.com');
      onClose();
    } catch (err: unknown) {
      setErrorNotice((err as Error).message || 'Admin login failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in duration-200">
        {/* Top Header */}
        <div className="p-5 pb-3 flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {tab === 'user' ? 'Explorer Sign In' : 'Nature Admin Access'}
              </h3>
              <p className="text-xs text-neutral-400">
                {tab === 'user' ? 'Save discoveries & sync progress in database' : 'Administrative dashboard & verification audit'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-4">
          <div className="grid grid-cols-2 p-1 bg-neutral-950 rounded-xl border border-neutral-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setTab('user'); setErrorNotice(null); }}
              className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                tab === 'user'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Explorer User</span>
            </button>
            <button
              type="button"
              onClick={() => { setTab('admin'); setErrorNotice(null); }}
              className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                tab === 'admin'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Nature Admin</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4">
          {errorNotice && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300">
              {errorNotice}
            </div>
          )}

          {tab === 'user' ? (
            <>
              {/* Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-white hover:bg-neutral-100 text-neutral-900 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition shadow cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="flex items-center gap-3 text-neutral-500 text-xs">
                <div className="flex-1 h-px bg-neutral-800" />
                <span>or quick explorer sign in</span>
                <div className="flex-1 h-px bg-neutral-800" />
              </div>

              {/* Fast Explorer Login form */}
              <form onSubmit={handleExplorerLogin} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Explorer Callsign / Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Alex Forester"
                    value={explorerName}
                    onChange={(e) => setExplorerName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Email Address (Saved to DB for next time)
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. alex@naturego.app"
                    value={explorerEmail}
                    onChange={(e) => setExplorerEmail(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
                >
                  <span>Sign In as Explorer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-[11px] text-neutral-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>All completed quests and streak data are saved to your profile in Firestore.</span>
              </div>
            </>
          ) : (
            <>
              {/* Admin Login Form */}
              <form onSubmit={handleAdminLogin} className="space-y-3">
                <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300">
                  <p className="font-bold flex items-center gap-1.5 mb-0.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Authorized Nature Administrator</span>
                  </p>
                  <p className="text-[11px] text-emerald-300/80">
                    Lead naturalist access to inspect all user profiles, completed quests, and system audit logs.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Admin Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      required
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Admin Passkey (Optional for developer preview)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      placeholder="nature-admin-2026"
                      value={adminPasscode}
                      onChange={(e) => setAdminPasscode(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-950"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Access Admin Dashboard</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
