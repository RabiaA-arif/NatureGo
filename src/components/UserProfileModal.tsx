import React, { useState } from 'react';
import {
  X,
  User,
  ShieldCheck,
  Award,
  Flame,
  CheckCircle,
  Save,
  LogOut,
  Sparkles,
  Compass,
  Calendar,
  AlertCircle,
  Trophy,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdminDashboard?: () => void;
}

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenAdminDashboard,
}) => {
  const { userProfile, updateProfileData, logout, isAdmin } = useAuth();

  const [displayName, setDisplayName] = useState<string>(userProfile?.displayName || '');
  const [favoriteBiome, setFavoriteBiome] = useState<string>(userProfile?.favoriteBiome || 'Forest Trail');
  const [bio, setBio] = useState<string>(userProfile?.bio || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  if (!isOpen || !userProfile) return null;

  const todayStr = getTodayString();
  const isCompletedToday = userProfile.lastQuestDate === todayStr;
  const streakDays = userProfile.streakDays ?? 0;
  const longestStreak = Math.max(userProfile.longestStreak ?? 0, streakDays);

  // Set of dates user completed quests
  const completedDateSet = new Set(userProfile.completedDates || []);
  if (userProfile.lastQuestDate) {
    completedDateSet.add(userProfile.lastQuestDate);
  }

  // Generate 7-day rolling streak tracker
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
    const isToday = dateStr === todayStr;
    const isCompleted = completedDateSet.has(dateStr);
    return { dateStr, dayName, isToday, isCompleted };
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedNotice(false);

    try {
      await updateProfileData({
        displayName: displayName.trim() || userProfile.displayName,
        favoriteBiome,
        bio: bio.trim(),
      });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch (err) {
      console.error('Failed to update profile in DB:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in duration-200">
        {/* Header */}
        <div className="p-5 flex items-center justify-between border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow">
              {userProfile.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'E'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {userProfile.displayName}
                </h3>
                {isAdmin ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-800">
                    Admin
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full">
                    Explorer
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">{userProfile.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-5 space-y-5">
          {/* Daily Streak Highlight Card */}
          <div className="bg-gradient-to-br from-amber-950/40 via-neutral-900 to-neutral-950 border border-amber-900/60 rounded-2xl p-4.5 shadow-md">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                  <Flame className="w-7 h-7 text-amber-400 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                      Daily Nature Streak
                    </span>
                    <span className="text-neutral-500">·</span>
                    <span className="text-xs text-neutral-400 flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      Best: <strong className="text-white">{longestStreak} days</strong>
                    </span>
                  </div>
                  <h4 className="text-2xl font-black text-white mt-0.5 flex items-baseline gap-2">
                    <span>{streakDays}</span>
                    <span className="text-sm font-semibold text-neutral-300">
                      {streakDays === 1 ? 'consecutive day' : 'consecutive days'}
                    </span>
                  </h4>
                </div>
              </div>

              {/* Status Badge */}
              <div
                className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 shrink-0 ${
                  isCompletedToday
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800/80'
                    : streakDays > 0
                    ? 'bg-amber-950 text-amber-300 border-amber-800/80'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                }`}
              >
                {isCompletedToday ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Completed Today!</span>
                  </>
                ) : streakDays > 0 ? (
                  <>
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>Active Streak</span>
                  </>
                ) : (
                  <>
                    <Compass className="w-3.5 h-3.5" />
                    <span>Ready to Start</span>
                  </>
                )}
              </div>
            </div>

            {/* Streak Status Tip Message */}
            <p className="text-xs text-neutral-300 mb-3.5 leading-relaxed bg-neutral-950/60 p-2.5 rounded-xl border border-neutral-800/60">
              {isCompletedToday ? (
                <span className="text-emerald-300 font-medium">
                  ✓ Outstanding! You completed a nature quest today. Come back tomorrow to keep the flame burning!
                </span>
              ) : streakDays > 0 ? (
                <span className="text-amber-300 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    Your streak is at stake! Complete at least one outdoor quest today to extend it to {streakDays + 1} days.
                  </span>
                </span>
              ) : (
                <span className="text-neutral-400">
                  Head outside and verify your first natural discovery today to begin your daily outdoor streak!
                </span>
              )}
            </p>

            {/* 7-Day Rolling Weekly Visual Tracker */}
            <div>
              <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-2 font-medium">
                <span>Last 7 Days Activity</span>
                <span>Complete $\ge$ 1 quest daily</span>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {weekDays.map((day) => (
                  <div
                    key={day.dateStr}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition ${
                      day.isCompleted
                        ? 'bg-emerald-950/70 border-emerald-600/70 text-emerald-300 shadow-sm'
                        : day.isToday
                        ? 'bg-amber-950/40 border-amber-600/60 text-amber-300 ring-1 ring-amber-500/40'
                        : 'bg-neutral-950/60 border-neutral-800 text-neutral-500'
                    }`}
                  >
                    <span className="text-[10px] font-semibold uppercase block mb-1">
                      {day.dayName}
                    </span>

                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs">
                      {day.isCompleted ? (
                        <Flame className="w-4 h-4 text-amber-400" />
                      ) : day.isToday ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                      ) : (
                        <span className="text-neutral-600 text-xs font-bold">·</span>
                      )}
                    </div>

                    <span className="text-[9px] mt-0.5 text-neutral-400">
                      {day.isToday ? 'Today' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Core Profile Stats Bar */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800/80">
              <div className="flex items-center justify-center gap-1 text-emerald-400 mb-0.5">
                <CheckCircle className="w-4 h-4" />
                <span className="text-lg font-bold text-white">
                  {userProfile.totalQuestsCompleted}
                </span>
              </div>
              <span className="text-[11px] text-neutral-400">Quests Completed</span>
            </div>

            <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800/80">
              <div className="flex items-center justify-center gap-1 text-amber-400 mb-0.5">
                <Flame className="w-4 h-4" />
                <span className="text-lg font-bold text-white">
                  {streakDays}d
                </span>
              </div>
              <span className="text-[11px] text-neutral-400">Current Streak</span>
            </div>

            <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800/80">
              <div className="flex items-center justify-center gap-1 text-teal-400 mb-0.5">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-lg font-bold text-white">
                  {userProfile.authenticityScore}%
                </span>
              </div>
              <span className="text-[11px] text-neutral-400">Authenticity Score</span>
            </div>
          </div>

          {/* Profile Edit Form */}
          <form onSubmit={handleSave} className="space-y-4 pt-1">
            {savedNotice && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Profile and daily streak data saved in Firestore database!</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Explorer Callsign / Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Preferred Nature Biome
              </label>
              <select
                value={favoriteBiome}
                onChange={(e) => setFavoriteBiome(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Forest Trail">🌲 Forest Trail</option>
                <option value="Alpine Summit">🏔️ Alpine Summit & Ridge</option>
                <option value="Backyard & Meadow">🌼 Backyard & Wild Meadow</option>
                <option value="Riverbank & Wetlands">💧 Riverbank & Wetlands</option>
                <option value="Sky & Atmosphere">☁️ Sky & Atmospheric Horizons</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Field Bio & Naturalist Notes
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell other explorers about your favorite outdoor spots..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2.5 bg-neutral-800 hover:bg-rose-950/60 hover:text-rose-400 text-neutral-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>

              <div className="flex items-center gap-2">
                {isAdmin && onOpenAdminDashboard && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAdminDashboard();
                    }}
                    className="px-4 py-2.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Admin Dashboard</span>
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
