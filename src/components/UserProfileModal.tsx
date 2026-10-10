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
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { JournalEntry } from '../types/nature';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdminDashboard?: () => void;
  journalEntries?: JournalEntry[];
}

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface DailyStreakData {
  dateStr: string;
  dayName: string;
  shortDate: string;
  questsCount: number;
  isCompleted: boolean;
  isToday: boolean;
  statusLabel: string;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenAdminDashboard,
  journalEntries,
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
  const completedDateSet = new Set<string>(userProfile.completedDates || []);
  if (userProfile.lastQuestDate) {
    completedDateSet.add(userProfile.lastQuestDate);
  }

  // Also include dates covered by current active streak if lastQuestDate is recent
  if (userProfile.streakDays > 0 && userProfile.lastQuestDate) {
    const [lY, lM, lD] = userProfile.lastQuestDate.split('-').map(Number);
    const lastDateObj = new Date(lY, lM - 1, lD);
    for (let s = 0; s < userProfile.streakDays; s++) {
      const pastD = new Date(lastDateObj);
      pastD.setDate(pastD.getDate() - s);
      const y = pastD.getFullYear();
      const m = String(pastD.getMonth() + 1).padStart(2, '0');
      const d = String(pastD.getDate()).padStart(2, '0');
      completedDateSet.add(`${y}-${m}-${d}`);
    }
  }

  // Load journal entries to get exact counts per day
  const resolvedEntries: JournalEntry[] = journalEntries || (() => {
    try {
      const saved = localStorage.getItem('nature_go_journal');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  })();

  const countsByDate = new Map<string, number>();
  resolvedEntries.forEach((entry) => {
    if (entry.timestamp) {
      const d = new Date(entry.timestamp);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${day}`;
      countsByDate.set(key, (countsByDate.get(key) || 0) + 1);
    }
  });

  // Generate 7-day rolling data for the Recharts bar chart
  const chartData: DailyStreakData[] = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
    const shortDate = `${d.getMonth() + 1}/${d.getDate()}`;
    const isToday = dateStr === todayStr;

    const journalCount = countsByDate.get(dateStr) || 0;
    const isMarkedCompleted = completedDateSet.has(dateStr);
    // If user completed a quest according to streak or completedDates, guarantee at least 1
    const questsCount = Math.max(journalCount, isMarkedCompleted ? 1 : 0);
    const isCompleted = questsCount > 0;

    let statusLabel = 'No Quests';
    if (isToday) {
      statusLabel = isCompleted ? 'Completed Today!' : 'Incomplete (Goal: 1 Quest)';
    } else if (isCompleted) {
      statusLabel = 'Streak Maintained';
    } else {
      statusLabel = 'No Activity';
    }

    return {
      dateStr,
      dayName,
      shortDate,
      questsCount,
      isCompleted,
      isToday,
      statusLabel,
    };
  });

  // Calculate weekly stats
  const activeDaysCount = chartData.filter((d) => d.isCompleted).length;
  const totalWeeklyQuests = chartData.reduce((acc, curr) => acc + curr.questsCount, 0);

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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl sm:rounded-3xl w-full max-w-lg max-h-[94vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in duration-200">
        {/* Header */}
        <div className="p-3.5 sm:p-5 flex items-center justify-between border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base sm:text-lg shadow shrink-0">
              {userProfile.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'E'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  {userProfile.displayName}
                </h3>
                {isAdmin ? (
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-800 shrink-0">
                    Admin
                  </span>
                ) : (
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded-full shrink-0">
                    Explorer
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-neutral-400 truncate">{userProfile.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-3.5 sm:p-5 space-y-4 sm:space-y-5">
          {/* Daily Streak Highlight Card */}
          <div className="bg-gradient-to-br from-amber-950/40 via-neutral-900 to-neutral-950 border border-amber-900/60 rounded-2xl p-3.5 sm:p-4.5 shadow-md">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-2.5 sm:gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5 sm:w-7 sm:h-7 text-amber-400 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-400">
                      Daily Streak
                    </span>
                    <span className="text-neutral-500">·</span>
                    <span className="text-[11px] sm:text-xs text-neutral-400 flex items-center gap-1">
                      <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                      Best: <strong className="text-white">{longestStreak}d</strong>
                    </span>
                  </div>
                  <h4 className="text-xl sm:text-2xl font-black text-white mt-0.5 flex items-baseline gap-1.5 sm:gap-2">
                    <span>{streakDays}</span>
                    <span className="text-xs sm:text-sm font-semibold text-neutral-300">
                      {streakDays === 1 ? 'day streak' : 'days streak'}
                    </span>
                  </h4>
                </div>
              </div>

              {/* Status Badge */}
              <div
                className={`px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-bold border flex items-center gap-1.5 shrink-0 self-start sm:self-auto ${
                  isCompletedToday
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800/80'
                    : streakDays > 0
                    ? 'bg-amber-950 text-amber-300 border-amber-800/80'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                }`}
              >
                {isCompletedToday ? (
                  <>
                    <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>Done Today!</span>
                  </>
                ) : streakDays > 0 ? (
                  <>
                    <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                    <span>Active Streak</span>
                  </>
                ) : (
                  <>
                    <Compass className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>Start Today</span>
                  </>
                )}
              </div>
            </div>

            {/* Streak Status Tip Message */}
            <p className="text-[11px] sm:text-xs text-neutral-300 mb-3 leading-relaxed bg-neutral-950/60 p-2 sm:p-2.5 rounded-xl border border-neutral-800/60">
              {isCompletedToday ? (
                <span className="text-emerald-300 font-medium">
                  ✓ Great job! You completed a quest today. Come back tomorrow to keep it going!
                </span>
              ) : streakDays > 0 ? (
                <span className="text-amber-300 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Complete at least 1 quest today to reach {streakDays + 1} days!
                  </span>
                </span>
              ) : (
                <span className="text-neutral-400">
                  Head outside and complete your first quest to start your daily streak!
                </span>
              )}
            </p>

            {/* 7-Day Recharts Bar Chart Visualization */}
            <div className="bg-neutral-950/70 border border-neutral-800/80 rounded-2xl p-2.5 sm:p-3.5 mb-3 sm:mb-3.5 overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">
                    Past 7 Days
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px]">
                  <span className="text-neutral-400">
                    Active:{' '}
                    <strong className="text-emerald-400 font-bold">
                      {activeDaysCount}/7d
                    </strong>
                  </span>
                  <span className="text-neutral-600">·</span>
                  <span className="text-neutral-400">
                    Quests:{' '}
                    <strong className="text-white font-bold">
                      {totalWeeklyQuests}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Recharts Bar Chart */}
              <div className="w-full h-36 min-h-[144px] relative overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 12, right: 4, left: -24, bottom: 2 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#262626"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="dayName"
                      stroke="#737373"
                      fontSize={10}
                      tickLine={false}
                      axisLine={{ stroke: '#333333' }}
                    />
                    <YAxis
                      stroke="#737373"
                      fontSize={10}
                      tickLine={false}
                      axisLine={{ stroke: '#333333' }}
                      allowDecimals={false}
                      domain={[0, (dataMax: number) => Math.max(2, dataMax + 1)]}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length > 0) {
                          const data = payload[0].payload as DailyStreakData;
                          return (
                            <div className="bg-neutral-950/95 border border-neutral-700/80 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-xs pointer-events-none min-w-[140px]">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="font-bold text-white">
                                  {data.dayName} · {data.shortDate}
                                </span>
                                {data.isToday && (
                                  <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold border border-amber-500/40">
                                    TODAY
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 my-1">
                                <span className="text-base font-black text-emerald-400">
                                  {data.questsCount}
                                </span>
                                <span className="text-neutral-300 font-medium">
                                  {data.questsCount === 1 ? 'quest' : 'quests'}
                                </span>
                              </div>
                              <div className="pt-1.5 mt-1 border-t border-neutral-800 flex items-center gap-1.5 text-[10px]">
                                {data.isCompleted ? (
                                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                    <Flame className="w-3 h-3 text-amber-400 shrink-0" />
                                    Streak Maintained!
                                  </span>
                                ) : data.isToday ? (
                                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                                    Pending Today (Goal: 1)
                                  </span>
                                ) : (
                                  <span className="text-neutral-500">
                                    No Quests
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                      cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    />
                    <Bar
                      dataKey="questsCount"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={32}
                    >
                      {chartData.map((entry, index) => {
                        let fill = '#262626'; // Missed day / 0
                        if (entry.isCompleted) {
                          fill = entry.isToday ? '#10b981' : '#059669';
                        } else if (entry.isToday) {
                          fill = '#b45309'; // Amber reminder bar
                        }
                        return (
                          <Cell
                            key={`streak-cell-${index}`}
                            fill={fill}
                            stroke={
                              entry.isToday
                                ? entry.isCompleted
                                  ? '#34d399'
                                  : '#f59e0b'
                                : undefined
                            }
                            strokeWidth={entry.isToday ? 2 : 0}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Chart Legend / Guide */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 mt-2 pt-2 border-t border-neutral-900 text-[9px] sm:text-[10px] text-neutral-400">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-xs bg-emerald-500 inline-block" />
                    <span>Done (≥1)</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-xs bg-amber-500 inline-block" />
                    <span>Today Goal</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-xs bg-neutral-800 inline-block" />
                    <span>None</span>
                  </span>
                </div>
                <span className="text-neutral-500 italic hidden sm:inline">
                  Daily streak extends with each verified quest
                </span>
              </div>
            </div>

            {/* 7-Day Rolling Weekly Visual Tracker */}
            <div>
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-neutral-400 mb-1.5 sm:mb-2 font-medium">
                <span>Daily Status Checklist</span>
                <span className="text-emerald-400 font-medium">
                  {streakDays > 0 ? `🔥 ${streakDays}d Streak` : 'Start your streak!'}
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {chartData.map((day) => (
                  <div
                    key={day.dateStr}
                    className={`flex flex-col items-center justify-center p-1 sm:p-2 rounded-lg sm:rounded-xl border text-center transition min-w-0 ${
                      day.isCompleted
                        ? 'bg-emerald-950/70 border-emerald-600/70 text-emerald-300 shadow-sm'
                        : day.isToday
                        ? 'bg-amber-950/40 border-amber-600/60 text-amber-300 ring-1 ring-amber-500/40'
                        : 'bg-neutral-950/60 border-neutral-800 text-neutral-500'
                    }`}
                  >
                    <span className="text-[9px] sm:text-[10px] font-semibold uppercase block mb-0.5 sm:mb-1 truncate w-full">
                      {day.dayName}
                    </span>

                    <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs">
                      {day.isCompleted ? (
                        <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" />
                      ) : day.isToday ? (
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-400 animate-ping" />
                      ) : (
                        <span className="text-neutral-600 text-[10px] font-bold">·</span>
                      )}
                    </div>

                    <span className="text-[8px] sm:text-[9px] mt-0.5 text-neutral-400 font-medium truncate w-full">
                      {day.isToday ? 'Today' : `${day.questsCount}q`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Core Profile Stats Bar */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
            <div className="p-2 sm:p-3 bg-neutral-950 rounded-xl sm:rounded-2xl border border-neutral-800/80 min-w-0">
              <div className="flex items-center justify-center gap-1 text-emerald-400 mb-0.5">
                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-base sm:text-lg font-bold text-white">
                  {userProfile.totalQuestsCompleted}
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-neutral-400 block truncate">Quests Done</span>
            </div>

            <div className="p-2 sm:p-3 bg-neutral-950 rounded-xl sm:rounded-2xl border border-neutral-800/80 min-w-0">
              <div className="flex items-center justify-center gap-1 text-amber-400 mb-0.5">
                <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-base sm:text-lg font-bold text-white">
                  {streakDays}d
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-neutral-400 block truncate">Streak</span>
            </div>

            <div className="p-2 sm:p-3 bg-neutral-950 rounded-xl sm:rounded-2xl border border-neutral-800/80 min-w-0">
              <div className="flex items-center justify-center gap-1 text-teal-400 mb-0.5">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-base sm:text-lg font-bold text-white">
                  {userProfile.authenticityScore}%
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-neutral-400 block truncate">Authenticity</span>
            </div>
          </div>

          {/* Profile Edit Form */}
          <form onSubmit={handleSave} className="space-y-3 sm:space-y-4 pt-1">
            {savedNotice && (
              <div className="p-2.5 sm:p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
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
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Preferred Nature Biome
              </label>
              <select
                value={favoriteBiome}
                onChange={(e) => setFavoriteBiome(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
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
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full sm:w-auto px-4 py-2 bg-neutral-800 hover:bg-rose-950/60 hover:text-rose-400 text-neutral-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {isAdmin && onOpenAdminDashboard && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAdminDashboard();
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Admin Dashboard</span>
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow cursor-pointer"
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
