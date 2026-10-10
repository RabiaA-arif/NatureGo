import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Award,
  CheckCircle,
  Eye,
  RefreshCw,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  Flame,
  Camera,
  Compass,
  ArrowLeft,
  UserPlus,
  Edit3,
  X,
} from 'lucide-react';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/firestoreError';
import { UserProfile, Quest } from '../types/nature';
import { useAuth } from '../context/AuthContext';

interface AdminDashboardProps {
  onBack: () => void;
  onAddNewQuestToRoster: (quest: Quest) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBack,
  onAddNewQuestToRoster,
}) => {
  const { userProfile, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'discoveries' | 'addUser' | 'addQuest'>('users');
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected user for inspection
  const [inspectedUser, setInspectedUser] = useState<UserProfile | null>(null);

  // New User Builder Form State
  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserEmail, setNewUserEmail] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<'user' | 'admin'>('user');
  const [newUserCompleted, setNewUserCompleted] = useState<number>(1);
  const [newUserBiome, setNewUserBiome] = useState<string>('Forest Trail');
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);

  // New Official Quest Form State
  const [questTitle, setQuestTitle] = useState<string>('');
  const [questTarget, setQuestTarget] = useState<string>('');
  const [questCategory, setQuestCategory] = useState<'forest' | 'meadow' | 'water_sky' | 'micro_nature'>('forest');
  const [questDesc, setQuestDesc] = useState<string>('');
  const [questDifficulty, setQuestDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');

  // Load all users from Firestore
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list: UserProfile[] = [];
      snap.forEach((d) => {
        list.push(d.data() as UserProfile);
      });

      // If empty or initial, include current user
      if (list.length === 0 && userProfile) {
        list.push(userProfile);
      }
      setUsersList(list);
    } catch (err) {
      console.warn('Notice loading users from Firestore:', err);
      // Fallback to local profile if available
      if (userProfile) {
        setUsersList([userProfile]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Action: Toggle Admin status of a user
  const handleToggleRole = async (targetUser: UserProfile) => {
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    try {
      const docRef = doc(db, 'users', targetUser.userId);
      await updateDoc(docRef, { role: newRole });

      // Update local state
      setUsersList((prev) =>
        prev.map((u) => (u.userId === targetUser.userId ? { ...u, role: newRole } : u))
      );
      if (inspectedUser?.userId === targetUser.userId) {
        setInspectedUser({ ...inspectedUser, role: newRole });
      }
    } catch (err) {
      console.warn('Notice updating user role in DB:', err);
      // Still update locally for interactive preview
      setUsersList((prev) =>
        prev.map((u) => (u.userId === targetUser.userId ? { ...u, role: newRole } : u))
      );
      if (inspectedUser?.userId === targetUser.userId) {
        setInspectedUser({ ...inspectedUser, role: newRole });
      }
    }
  };

  // Action: Award +1 task completed to user in DB
  const handleAwardTask = async (targetUser: UserProfile) => {
    const updatedCount = (targetUser.totalQuestsCompleted || 0) + 1;
    try {
      const docRef = doc(db, 'users', targetUser.userId);
      await updateDoc(docRef, {
        totalQuestsCompleted: updatedCount,
        lastLoginAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Notice awarding task in cloud DB:', err);
    }

    setUsersList((prev) =>
      prev.map((u) => (u.userId === targetUser.userId ? { ...u, totalQuestsCompleted: updatedCount } : u))
    );
    if (inspectedUser?.userId === targetUser.userId) {
      setInspectedUser({ ...inspectedUser, totalQuestsCompleted: updatedCount });
    }
  };

  // Action: Create and save brand-new user profile in DB
  const handleCreateUserInDb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim()) return;

    const uid = `user-${newUserEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const nowIso = new Date().toISOString();

    const newProfile: UserProfile = {
      userId: uid,
      email: newUserEmail.trim(),
      displayName: newUserName.trim() || 'Forest Ranger Trainee',
      role: newUserRole,
      totalQuestsCompleted: newUserCompleted,
      streakDays: 1,
      authenticityScore: 100,
      createdAt: nowIso,
      lastLoginAt: nowIso,
      favoriteBiome: newUserBiome,
      bio: 'Created via Nature Go Admin Management console.',
    };

    try {
      const docRef = doc(db, 'users', uid);
      await setDoc(docRef, newProfile);
    } catch (err) {
      console.warn('Notice saving new user profile to cloud DB:', err);
    }

    setUsersList((prev) => [newProfile, ...prev]);
    setFormSuccessMessage(`Explorer profile for ${newProfile.displayName} registered!`);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserCompleted(1);

    setTimeout(() => setFormSuccessMessage(null), 4000);
  };

  // Action: Create and dispatch new official quest
  const handleCreateQuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questTarget.trim()) return;

    const newQuest: Quest = {
      id: `quest-${Date.now()}`,
      target: questTarget.trim(),
      category: questCategory,
      title: questTitle.trim() || `Scout the ${questTarget.trim()}`,
      description: questDesc.trim() || `Locate and verify real ${questTarget.trim()} in natural outdoor surroundings.`,
      iconName: questCategory === 'forest' ? 'TreePine' : questCategory === 'water_sky' ? 'CloudSun' : 'Leaf',
      difficulty: questDifficulty,
      hints: ['Search in outdoor daylight', 'Ensure real natural surroundings'],
    };

    onAddNewQuestToRoster(newQuest);
    setFormSuccessMessage(`Official Quest "${newQuest.title}" deployed to explorer roster!`);
    setQuestTarget('');
    setQuestTitle('');
    setQuestDesc('');
    setTimeout(() => setFormSuccessMessage(null), 4000);
  };

  // Derived statistics
  const totalExplorers = usersList.length;
  const totalTasksCompleted = usersList.reduce((acc, u) => acc + (u.totalQuestsCompleted || 0), 0);
  const avgAuthenticity = totalExplorers > 0
    ? Math.round(usersList.reduce((acc, u) => acc + (u.authenticityScore || 100), 0) / totalExplorers)
    : 100;

  const filteredUsers = usersList.filter(
    (u) =>
      u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Admin Navigation Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 w-full">
        <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 w-full">
          <button
            onClick={onBack}
            className="p-2 sm:p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition cursor-pointer shrink-0 mt-0.5 sm:mt-0"
            title="Return to Explorer Camera"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h2 className="text-sm sm:text-lg font-bold text-white flex items-center gap-1.5 sm:gap-2 truncate">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
                <span>Admin & Profile Dashboard</span>
              </h2>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded-full shrink-0">
                Live
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-neutral-400 line-clamp-1 mt-0.5">
              Explorer profiles, completed quests in Firestore, and audit authentications
            </p>
          </div>
        </div>

        <button
          onClick={fetchUsers}
          disabled={isLoading}
          className="w-full sm:w-auto px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Database</span>
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full">
        <div className="p-3 sm:p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl min-w-0">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Total Users</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-white">{totalExplorers}</p>
          <span className="text-[10px] sm:text-[11px] text-neutral-400 block truncate">Database profiles</span>
        </div>

        <div className="p-3 sm:p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl min-w-0">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Quests Done</span>
            <CheckCircle className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-white">{totalTasksCompleted}</p>
          <span className="text-[10px] sm:text-[11px] text-neutral-400 block truncate">Total completed</span>
        </div>

        <div className="p-3 sm:p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl min-w-0">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Average Score</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-white">{avgAuthenticity}%</p>
          <span className="text-[10px] sm:text-[11px] text-emerald-400 font-medium block truncate">Clarity score</span>
        </div>

        <div className="p-3 sm:p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl min-w-0">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Camera AI</span>
            <Eye className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-base sm:text-lg font-bold text-emerald-400 mt-0.5">Online</p>
          <span className="text-[10px] sm:text-[11px] text-neutral-400 block truncate">Vision active</span>
        </div>
      </div>

      {/* Action Notification Message */}
      {formSuccessMessage && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-2xl text-xs flex items-center justify-between animate-in fade-in">
          <span className="font-semibold">✓ {formSuccessMessage}</span>
          <button onClick={() => setFormSuccessMessage(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Admin Dashboard Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-neutral-900 rounded-2xl border border-neutral-800 text-xs font-semibold overflow-x-auto no-scrollbar w-full">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-3 sm:px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'users'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>User Profiles ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('addUser')}
          className={`px-3 sm:px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'addUser'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add User</span>
        </button>

        <button
          onClick={() => setActiveTab('addQuest')}
          className={`px-3 sm:px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'addQuest'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Add New Quest</span>
        </button>
      </div>

      {/* Tab 1: Explorer Profiles Directory */}
      {activeTab === 'users' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 sm:p-5 space-y-4 w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">Registered Explorer Profiles</h3>
              <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5">
                User accounts, task completion counts, and outdoor activity stored in database
              </p>
            </div>

            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-neutral-400 text-xs flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
              <span>Loading explorer profiles from database...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-10 text-neutral-500 text-xs">
              No explorer profiles found matching your query.
            </div>
          ) : (
            <>
              {/* MOBILE CARDS VIEW (Clean, touch-friendly, fully responsive on phone screens) */}
              <div className="block md:hidden space-y-3 w-full">
                {filteredUsers.map((user) => (
                  <div
                    key={`mobile-user-${user.userId}`}
                    className="p-3 sm:p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700 transition flex flex-col gap-2.5 sm:gap-3 w-full"
                  >
                    {/* User Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-xl bg-neutral-800 text-white font-bold flex items-center justify-center text-sm shrink-0">
                          {user.displayName?.charAt(0).toUpperCase() || 'E'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-white text-sm truncate">{user.displayName}</p>
                          <p className="text-[11px] text-neutral-500 truncate">{user.email}</p>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                          user.role === 'admin'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {user.role}
                      </span>
                    </div>

                    {/* Stats 3-Col Pills */}
                    <div className="grid grid-cols-3 gap-1.5 text-center bg-neutral-900/60 p-2 rounded-xl border border-neutral-800/60">
                      <div className="min-w-0">
                        <span className="text-[10px] text-neutral-400 block truncate">Tasks</span>
                        <span className="text-xs font-bold text-white flex items-center justify-center gap-1 mt-0.5 truncate">
                          <CheckCircle className="w-3 h-3 text-teal-400 shrink-0" />
                          <span>{user.totalQuestsCompleted || 0}</span>
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-neutral-400 block truncate">Streak</span>
                        <span className="text-xs font-bold text-amber-400 flex items-center justify-center gap-1 mt-0.5 truncate">
                          <Flame className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{user.streakDays || 1}d</span>
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-neutral-400 block truncate">Authentic</span>
                        <span className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1 mt-0.5 truncate">
                          <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{user.authenticityScore || 100}%</span>
                        </span>
                      </div>
                    </div>

                    {/* Mobile Action Buttons */}
                    <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-neutral-900">
                      <button
                        onClick={() => setInspectedUser(user)}
                        className="py-2 px-1 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-neutral-200 rounded-xl text-[10px] sm:text-[11px] font-semibold transition cursor-pointer text-center flex items-center justify-center gap-1 active:scale-95 min-w-0"
                      >
                        <Eye className="w-3 h-3 text-sky-400 shrink-0" />
                        <span className="truncate">Inspect</span>
                      </button>

                      <button
                        onClick={() => handleAwardTask(user)}
                        className="py-2 px-1 bg-emerald-950 hover:bg-emerald-900 active:bg-emerald-800 text-emerald-300 border border-emerald-800/80 rounded-xl text-[10px] sm:text-[11px] font-bold transition cursor-pointer text-center flex items-center justify-center gap-1 active:scale-95 shadow-xs min-w-0"
                      >
                        <Award className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate">+1 Task</span>
                      </button>

                      <button
                        onClick={() => handleToggleRole(user)}
                        className="py-2 px-1 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-neutral-300 rounded-xl text-[10px] sm:text-[11px] font-semibold transition cursor-pointer text-center truncate active:scale-95 min-w-0"
                      >
                        <span className="truncate">{user.role === 'admin' ? 'Set User' : 'Set Admin'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP & TABLET TABLE VIEW */}
              <div className="hidden md:block overflow-x-auto w-full">
                <table className="w-full text-left text-xs min-w-[580px]">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400">
                      <th className="pb-3 font-semibold">Explorer</th>
                      <th className="pb-3 font-semibold">Role</th>
                      <th className="pb-3 font-semibold">Tasks Done</th>
                      <th className="pb-3 font-semibold">Streak</th>
                      <th className="pb-3 font-semibold">Authenticity</th>
                      <th className="pb-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {filteredUsers.map((user) => (
                      <tr key={user.userId} className="hover:bg-neutral-950/40 transition">
                        <td className="py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-neutral-800 text-white font-bold flex items-center justify-center">
                              {user.displayName?.charAt(0).toUpperCase() || 'E'}
                            </div>
                            <div>
                              <p className="font-bold text-white">{user.displayName}</p>
                              <p className="text-[11px] text-neutral-500">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              user.role === 'admin'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-neutral-800 text-neutral-400'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>

                        <td className="py-3 font-bold text-white">
                          {user.totalQuestsCompleted || 0} quests
                        </td>

                        <td className="py-3 text-neutral-300">
                          {user.streakDays || 1} days
                        </td>

                        <td className="py-3">
                          <span className="font-semibold text-emerald-400">
                            {user.authenticityScore || 100}%
                          </span>
                        </td>

                        <td className="py-3 text-right space-x-1.5">
                          <button
                            onClick={() => setInspectedUser(user)}
                            className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-[11px] font-medium transition cursor-pointer"
                          >
                            Inspect Profile
                          </button>
                          <button
                            onClick={() => handleAwardTask(user)}
                            className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                            title="Award +1 completed quest"
                          >
                            +1 Task
                          </button>
                          <button
                            onClick={() => handleToggleRole(user)}
                            className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-[11px] font-medium transition cursor-pointer"
                          >
                            {user.role === 'admin' ? 'Make User' : 'Make Admin'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab 2: Build New User Profile and Save in DB */}
      {activeTab === 'addUser' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-6 max-w-xl w-full">
          <h3 className="text-base font-bold text-white mb-1">
            Build User Profile & Save to Database
          </h3>
          <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
            Create an explorer or admin user account in Firestore so they can immediately sign in and retain their progress.
          </p>

          <form onSubmit={handleCreateUserInDb} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Explorer Name / Display Name
              </label>
              <input
                type="text"
                placeholder="e.g. Jordan River"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="e.g. jordan@naturego.app"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Assigned Role
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as 'user' | 'admin')}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="user">Explorer User</option>
                  <option value="admin">Nature Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Starting Tasks Completed
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newUserCompleted}
                  onChange={(e) => setNewUserCompleted(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Favorite Outdoor Biome
              </label>
              <select
                value={newUserBiome}
                onChange={(e) => setNewUserBiome(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Forest Trail">🌲 Forest Trail</option>
                <option value="Alpine Ridge">🏔️ Alpine Ridge</option>
                <option value="Backyard Meadow">🌼 Backyard Meadow</option>
                <option value="Riverbank & Stream">💧 Riverbank & Stream</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-md active:scale-98"
            >
              <UserPlus className="w-4 h-4" />
              <span>Save User Profile in Database</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Deploy Official Quest */}
      {activeTab === 'addQuest' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-6 max-w-xl w-full">
          <h3 className="text-base font-bold text-white mb-1">
            Deploy Official Quest Mission
          </h3>
          <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
            Create a standardized outdoor quest for all explorers with automatic Vision Intelligence verification.
          </p>

          <form onSubmit={handleCreateQuest} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Target Object / Phenomenon (Required)
              </label>
              <input
                type="text"
                placeholder="e.g. wild acorn, dandelion clock, pine tree resin, morning dew"
                value={questTarget}
                onChange={(e) => setQuestTarget(e.target.value)}
                required
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Quest Title
              </label>
              <input
                type="text"
                placeholder="e.g. The Acorn Treasure Hunt"
                value={questTitle}
                onChange={(e) => setQuestTitle(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Biome Category
                </label>
                <select
                  value={questCategory}
                  onChange={(e) => setQuestCategory(e.target.value as any)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="forest">Forest</option>
                  <option value="meadow">Meadow</option>
                  <option value="water_sky">Water & Sky</option>
                  <option value="micro_nature">Micro Nature</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Difficulty
                </label>
                <select
                  value={questDifficulty}
                  onChange={(e) => setQuestDifficulty(e.target.value as any)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="easy">Easy (Beginner)</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard (Advanced)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Field Description
              </label>
              <textarea
                rows={2}
                placeholder="Explain what explorers should observe and touch in the outdoors..."
                value={questDesc}
                onChange={(e) => setQuestDesc(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-md active:scale-98"
            >
              <Compass className="w-4 h-4" />
              <span>Deploy Quest to Active Roster</span>
            </button>
          </form>
        </div>
      )}

      {/* Profile Inspection Drawer / Modal */}
      {inspectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl sm:rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden shadow-2xl my-auto animate-in fade-in duration-200">
            <div className="p-3.5 sm:p-5 flex items-center justify-between border-b border-neutral-800 shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 mr-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shrink-0 shadow">
                  {inspectedUser.displayName?.charAt(0).toUpperCase() || 'E'}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm sm:text-base font-bold text-white truncate">{inspectedUser.displayName}</h4>
                  <p className="text-[11px] sm:text-xs text-neutral-400 truncate">{inspectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectedUser(null)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 sm:p-5 space-y-3.5 sm:space-y-4 text-xs overflow-y-auto">
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
                <div className="p-2 sm:p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 min-w-0">
                  <span className="text-neutral-400 block text-[10px] truncate">Quests Done</span>
                  <span className="text-sm sm:text-base font-bold text-white block mt-0.5 truncate">{inspectedUser.totalQuestsCompleted}</span>
                </div>
                <div className="p-2 sm:p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 min-w-0">
                  <span className="text-neutral-400 block text-[10px] truncate">Streak</span>
                  <span className="text-sm sm:text-base font-bold text-amber-400 block mt-0.5 truncate">{inspectedUser.streakDays}d</span>
                </div>
                <div className="p-2 sm:p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 min-w-0">
                  <span className="text-neutral-400 block text-[10px] truncate">Authenticity</span>
                  <span className="text-sm sm:text-base font-bold text-emerald-400 block mt-0.5 truncate">{inspectedUser.authenticityScore}%</span>
                </div>
              </div>

              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-neutral-400 text-xs">
                  <span>Role:</span>
                  <strong className="text-white capitalize">{inspectedUser.role}</strong>
                </div>
                <div className="flex items-center justify-between text-neutral-400 text-xs">
                  <span>Favorite Biome:</span>
                  <strong className="text-emerald-300">{inspectedUser.favoriteBiome || 'Forest'}</strong>
                </div>
                <div className="text-neutral-400 text-xs space-y-1">
                  <span>User UID:</span>
                  <span className="font-mono text-[10px] text-neutral-300 break-all block bg-neutral-900/80 p-1.5 rounded-lg border border-neutral-800/80 select-all">{inspectedUser.userId}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-400 text-xs pt-0.5">
                  <span>Last Active:</span>
                  <span className="text-neutral-300 text-[10px] sm:text-[11px]">{new Date(inspectedUser.lastLoginAt).toLocaleDateString()} {new Date(inspectedUser.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {inspectedUser.bio && (
                <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800/80 italic text-neutral-300 text-xs leading-relaxed">
                  "{inspectedUser.bio}"
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                <button
                  onClick={() => handleAwardTask(inspectedUser)}
                  className="w-full sm:flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Award +1 Completed Task</span>
                </button>
                <button
                  onClick={() => handleToggleRole(inspectedUser)}
                  className="w-full sm:w-auto py-2.5 px-3.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl font-semibold transition text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  {inspectedUser.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
