import React, { useState, useEffect } from 'react';
import {
  Compass,
  Camera,
  BookOpen,
  Headphones,
  Award,
  Sparkles,
  ShieldCheck,
  X,
  User,
  LogIn,
  CheckCircle,
  Flame,
  RotateCcw,
  LogOut,
} from 'lucide-react';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db, auth } from './firebase/config';
import { INITIAL_QUESTS } from './data/quests';
import {
  Quest,
  VisionVerificationResult,
  JournalEntry,
  Badge,
  CompletedQuestRecord,
} from './types/nature';
import { CameraViewfinder } from './components/CameraViewfinder';
import { VerificationCard } from './components/VerificationCard';
import { QuestSelector } from './components/QuestSelector';
import { FieldJournal } from './components/FieldJournal';
import { ScreenFreeMode } from './components/ScreenFreeMode';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import { playChimeSuccess, playChimeReject } from './utils/audio';

const INITIAL_BADGES: Badge[] = [
  {
    id: 'first_find',
    name: 'First Find',
    description: 'Find your very first nature item outside.',
    icon: '🌱',
    unlocked: false,
    targetCount: 1,
    currentCount: 0,
  },
  {
    id: 'woodland_scout',
    name: 'Forest Scout',
    description: 'Find 3 forest items (leaf, bark, or pinecone).',
    icon: '🌲',
    unlocked: false,
    targetCount: 3,
    currentCount: 0,
  },
  {
    id: 'elemental_seeker',
    name: 'Water & Sky',
    description: 'Find 2 water or open sky items.',
    icon: '🌊',
    unlocked: false,
    targetCount: 2,
    currentCount: 0,
  },
  {
    id: 'anti_spoof_master',
    name: 'Clear Daylight',
    description: 'Take 3 verified nature photos in natural outdoor light.',
    icon: '🛡️',
    unlocked: false,
    targetCount: 3,
    currentCount: 0,
  },
  {
    id: 'master_naturalist',
    name: 'Nature Explorer',
    description: 'Save 5 verified finds to your journal.',
    icon: '🧭',
    unlocked: false,
    targetCount: 5,
    currentCount: 0,
  },
];

function NatureGoContent() {
  const { userProfile, isAdmin, recordQuestCompletion, logout } = useAuth();
  const activeUserId = userProfile?.userId || 'guest';

  // Distinct UI Mode: 'explorer' (User UI) vs 'admin' (Admin Console UI)
  const [appMode, setAppMode] = useState<'explorer' | 'admin'>('explorer');

  // Separated Quests Data Stores:
  // 1. Admin Official Quests (published by admin to all explorers)
  const [adminOfficialQuests, setAdminOfficialQuests] = useState<Quest[]>(() => {
    try {
      const saved = localStorage.getItem('nature_go_admin_official_quests');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 2. User Personal Custom Quests (scoped strictly to current user)
  const [userCustomQuests, setUserCustomQuests] = useState<Quest[]>(() => {
    try {
      const saved = localStorage.getItem(`nature_go_custom_quests_${activeUserId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Combined quests available in explorer catalog
  const allQuests = [...INITIAL_QUESTS, ...adminOfficialQuests, ...userCustomQuests];

  const [currentQuest, setCurrentQuest] = useState<Quest>(allQuests[0]);
  const [activeTab, setActiveTab] = useState<'camera' | 'quests' | 'journal'>('camera');
  const [isScreenFreeMode, setIsScreenFreeMode] = useState<boolean>(false);
  const [showHowItWorks, setShowHowItWorks] = useState<boolean>(true);
  const [isCurrentRepeat, setIsCurrentRepeat] = useState<boolean>(false);

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'user' | 'admin'>('user');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Vision verification state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [lastCapturedImage, setLastCapturedImage] = useState<string | null>(null);
  const [lastVerificationResult, setLastVerificationResult] = useState<VisionVerificationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCurrentSaved, setIsCurrentSaved] = useState<boolean>(false);

  // Separated User Journal Entries & Badges (scoped per user)
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    try {
      const scoped = localStorage.getItem(`nature_go_journal_${activeUserId}`);
      if (scoped) return JSON.parse(scoped);
      const legacy = localStorage.getItem('nature_go_journal');
      return legacy ? JSON.parse(legacy) : [];
    } catch {
      return [];
    }
  });

  const [badges, setBadges] = useState<Badge[]>(() => {
    try {
      const scoped = localStorage.getItem(`nature_go_badges_${activeUserId}`);
      if (scoped) return JSON.parse(scoped);
      const legacy = localStorage.getItem('nature_go_badges');
      return legacy ? JSON.parse(legacy) : INITIAL_BADGES;
    } catch {
      return INITIAL_BADGES;
    }
  });

  // Completed Quests Tracking Map (tracks completion count & timestamps per quest target)
  const [completedQuestsMap, setCompletedQuestsMap] = useState<Record<string, CompletedQuestRecord>>(() => {
    try {
      const saved = localStorage.getItem(`nature_go_completed_quests_${activeUserId}`);
      if (saved) return JSON.parse(saved);
      // Pre-seed from existing journal entries
      const map: Record<string, CompletedQuestRecord> = {};
      const legacy = localStorage.getItem('nature_go_journal');
      const entries: JournalEntry[] = legacy ? JSON.parse(legacy) : [];
      entries.forEach((e) => {
        const key = e.questTarget.toLowerCase().trim();
        const existingCount = map[key]?.count || 0;
        map[key] = {
          questId: key,
          questTarget: e.questTarget,
          count: existingCount + 1,
          firstCompletedAt: e.timestamp || Date.now(),
          lastCompletedAt: e.timestamp || Date.now(),
        };
      });
      return map;
    } catch {
      return {};
    }
  });

  // Synchronize scoped storage when active user changes
  useEffect(() => {
    try {
      const scopedJournal = localStorage.getItem(`nature_go_journal_${activeUserId}`);
      if (scopedJournal) {
        setJournalEntries(JSON.parse(scopedJournal));
      } else if (activeUserId === 'guest') {
        const legacy = localStorage.getItem('nature_go_journal');
        if (legacy) setJournalEntries(JSON.parse(legacy));
      } else {
        setJournalEntries([]);
      }

      const scopedBadges = localStorage.getItem(`nature_go_badges_${activeUserId}`);
      if (scopedBadges) {
        setBadges(JSON.parse(scopedBadges));
      } else {
        setBadges(INITIAL_BADGES);
      }

      const scopedCompleted = localStorage.getItem(`nature_go_completed_quests_${activeUserId}`);
      if (scopedCompleted) {
        setCompletedQuestsMap(JSON.parse(scopedCompleted));
      } else {
        setCompletedQuestsMap({});
      }

      const scopedCustom = localStorage.getItem(`nature_go_custom_quests_${activeUserId}`);
      if (scopedCustom) {
        setUserCustomQuests(JSON.parse(scopedCustom));
      } else {
        setUserCustomQuests([]);
      }
    } catch (e) {
      console.warn('Notice loading user data partition:', e);
    }
  }, [activeUserId]);

  // Sync user discoveries from Firestore database when authenticated user signs in
  useEffect(() => {
    if (!userProfile?.userId || !auth.currentUser || auth.currentUser.uid !== userProfile.userId) return;

    async function loadUserDiscoveries() {
      try {
        const discoveriesRef = collection(db, 'users', userProfile!.userId, 'discoveries');
        const snap = await getDocs(discoveriesRef);
        const cloudEntries: JournalEntry[] = [];
        snap.forEach((docSnap) => {
          cloudEntries.push(docSnap.data() as JournalEntry);
        });

        if (cloudEntries.length > 0) {
          setJournalEntries((prev) => {
            const map = new Map<string, JournalEntry>();
            prev.forEach((item) => map.set(item.id, item));
            cloudEntries.forEach((item) => map.set(item.id, item));
            return Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
          });
        }
      } catch (err) {
        console.warn('Notice syncing discoveries from cloud:', err);
      }
    }

    loadUserDiscoveries();
  }, [userProfile?.userId]);

  // Persist user journal
  useEffect(() => {
    try {
      localStorage.setItem(`nature_go_journal_${activeUserId}`, JSON.stringify(journalEntries));
      localStorage.setItem('nature_go_journal', JSON.stringify(journalEntries));
    } catch (e) {
      console.warn('Failed to save journal to localStorage:', e);
    }
  }, [journalEntries, activeUserId]);

  // Persist completed quests map
  useEffect(() => {
    try {
      localStorage.setItem(`nature_go_completed_quests_${activeUserId}`, JSON.stringify(completedQuestsMap));
    } catch (e) {
      console.warn('Failed to save completed quests map:', e);
    }
  }, [completedQuestsMap, activeUserId]);

  // Persist user custom quests
  useEffect(() => {
    try {
      localStorage.setItem(`nature_go_custom_quests_${activeUserId}`, JSON.stringify(userCustomQuests));
    } catch (e) {
      console.warn('Failed to save custom quests:', e);
    }
  }, [userCustomQuests, activeUserId]);

  // Persist admin official quests
  useEffect(() => {
    try {
      localStorage.setItem('nature_go_admin_official_quests', JSON.stringify(adminOfficialQuests));
    } catch (e) {
      console.warn('Failed to save admin official quests:', e);
    }
  }, [adminOfficialQuests]);

  // Recalculate badges based on completed tasks
  useEffect(() => {
    const updated = badges.map((badge) => {
      let count = 0;
      if (badge.id === 'first_find') {
        count = journalEntries.length;
      } else if (badge.id === 'woodland_scout') {
        count = journalEntries.filter((e) =>
          ['green leaf', 'tree bark', 'pinecone', 'leaf', 'bark'].some((t) =>
            e.questTarget.toLowerCase().includes(t)
          )
        ).length;
      } else if (badge.id === 'elemental_seeker') {
        count = journalEntries.filter((e) =>
          ['water', 'sky', 'cloud', 'rain'].some((t) =>
            e.questTarget.toLowerCase().includes(t)
          )
        ).length;
      } else if (badge.id === 'anti_spoof_master') {
        count = journalEntries.filter((e) => e.verification.confidence_score >= 0.85).length;
      } else if (badge.id === 'master_naturalist') {
        count = journalEntries.length;
      }
      return {
        ...badge,
        currentCount: count,
        unlocked: count >= badge.targetCount,
      };
    });

    setBadges(updated);
    try {
      localStorage.setItem(`nature_go_badges_${activeUserId}`, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save badges to localStorage:', e);
    }
  }, [journalEntries, activeUserId]);

  // Current Quest Completion Info
  const currentRecord =
    completedQuestsMap[currentQuest.id] ||
    completedQuestsMap[currentQuest.target.toLowerCase().trim()];
  const isCurrentCompleted = Boolean(currentRecord && currentRecord.count > 0);
  const currentCompletionCount = currentRecord?.count || 0;

  // Primary Vision Verification
  const handleVerifyImage = async (dataUrl: string, mimeType: string, scenarioId?: string) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setLastCapturedImage(dataUrl);
    setLastVerificationResult(null);
    setIsCurrentSaved(false);

    try {
      const response = await fetch('/api/verify-quest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: dataUrl,
          mimeType,
          questTarget: currentQuest.target,
          scenarioId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Verification server error');
      }

      const result: VisionVerificationResult = data.result;
      setLastVerificationResult(result);

      if (result.is_valid) {
        playChimeSuccess();
      } else {
        playChimeReject();
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Vision verification error:', error);
      setErrorMessage(
        error.message || 'Vision verification service encountered an issue. Please try again.'
      );
      playChimeReject();
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save verified task to Journal, Database & mark Quest as Completed
  const handleSaveToJournal = async () => {
    if (!lastCapturedImage || !lastVerificationResult || isCurrentSaved) return;

    const newEntry: JournalEntry = {
      id: `entry-${Date.now()}`,
      questTarget: currentQuest.target,
      questTitle: currentQuest.title,
      photoDataUrl: lastCapturedImage,
      timestamp: Date.now(),
      verification: lastVerificationResult,
    };

    setJournalEntries((prev) => [newEntry, ...prev]);
    setIsCurrentSaved(true);

    // Update quest completion record
    const qId = currentQuest.id;
    const targetKey = currentQuest.target.toLowerCase().trim();
    const existingRec = completedQuestsMap[qId] || completedQuestsMap[targetKey];
    const newCount = (existingRec?.count || 0) + 1;
    const updatedRecord: CompletedQuestRecord = {
      questId: qId,
      questTarget: currentQuest.target,
      count: newCount,
      firstCompletedAt: existingRec?.firstCompletedAt || Date.now(),
      lastCompletedAt: Date.now(),
    };

    setCompletedQuestsMap((prev) => ({
      ...prev,
      [qId]: updatedRecord,
      [targetKey]: updatedRecord,
    }));

    // Save to Firestore Database under user's profile if authenticated
    if (userProfile?.userId) {
      if (auth.currentUser && auth.currentUser.uid === userProfile.userId) {
        try {
          const docRef = doc(db, 'users', userProfile.userId, 'discoveries', newEntry.id);
          await setDoc(docRef, newEntry);
        } catch (err) {
          console.warn('Could not save discovery to Firestore database:', err);
        }
      }
      // Record completed task and update streak & authenticity score in user profile DB & state
      await recordQuestCompletion(lastVerificationResult.confidence_score);
    }
  };

  // Add custom quest (scoped to user)
  const handleAddCustomQuest = (target: string, title: string) => {
    const newQuest: Quest = {
      id: `custom-${Date.now()}`,
      target,
      category: 'custom',
      title,
      description: `Custom outdoor search for "${target}". Must be real outdoor nature.`,
      iconName: 'Compass',
      difficulty: 'medium',
      hints: ['Locate this in outdoor natural surroundings', 'Avoid indoor or digital items'],
    };

    setUserCustomQuests((prev) => [newQuest, ...prev]);
    setCurrentQuest(newQuest);
    setIsCurrentRepeat(false);
    setActiveTab('camera');
    setLastVerificationResult(null);
    setLastCapturedImage(null);
  };

  // Add official quest to roster (called by Admin in Admin Console)
  const handleAddNewOfficialQuest = (newQuest: Quest) => {
    setAdminOfficialQuests((prev) => [newQuest, ...prev]);
  };

  const handleClearJournal = () => {
    if (window.confirm('Clear all entries in your Explorer Field Journal?')) {
      setJournalEntries([]);
      setCompletedQuestsMap({});
      localStorage.removeItem(`nature_go_journal_${activeUserId}`);
      localStorage.removeItem(`nature_go_completed_quests_${activeUserId}`);
    }
  };

  // RENDER DEDICATED ADMIN UI (Completely separate from Explorer UI)
  if (appMode === 'admin') {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black w-full overflow-x-hidden">
        {/* Dedicated Admin Portal Header */}
        <header className="border-b border-neutral-800 bg-neutral-950/95 backdrop-blur-md sticky top-0 z-40 w-full">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shrink-0">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="text-sm sm:text-lg font-bold tracking-tight text-white truncate">
                    Admin Console
                  </h1>
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded-full shrink-0">
                    ADMIN
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-neutral-400 hidden sm:block truncate">
                  Cloud Database, Explorer User Profiles & Official Quest Catalog
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <button
                onClick={() => setAppMode('explorer')}
                className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Switch to Explorer View</span>
                <span className="sm:hidden">Explorer</span>
              </button>

              <button
                onClick={async () => {
                  await logout();
                  setAppMode('explorer');
                }}
                className="p-1.5 sm:px-3 sm:py-2 bg-neutral-900 hover:bg-rose-950/60 hover:text-rose-400 text-neutral-300 rounded-xl text-xs font-semibold border border-neutral-800 transition cursor-pointer flex items-center gap-1.5"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dedicated Admin Portal Main Content */}
        <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 overflow-x-hidden">
          <AdminDashboard
            onBack={() => setAppMode('explorer')}
            onAddNewQuestToRoster={handleAddNewOfficialQuest}
          />
        </main>

        <footer className="border-t border-neutral-900 py-4 px-4 text-center text-xs text-neutral-500">
          Nature Go Administration Console · Isolated System Data & Security Controls
        </footer>
      </div>
    );
  }

  // RENDER DEDICATED USER EXPLORER UI (Clean, friendly, zero admin clutter)
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black w-full overflow-x-hidden">
      {/* Explorer Header */}
      <header className="border-b border-neutral-900 bg-neutral-950/90 backdrop-blur-md sticky top-0 z-40 w-full">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3.5 flex items-center justify-between gap-2">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shrink-0">
              <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white truncate">
                  Nature Go
                </h1>
                <span className="text-xs text-emerald-400 font-medium hidden md:inline">
                  · Outdoor Explorer
                </span>
              </div>
              <p className="text-xs text-neutral-400 hidden sm:block truncate">
                Explore outdoors, snap nature, and keep your daily streak!
              </p>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Audio Walk Launcher */}
            <button
              onClick={() => setIsScreenFreeMode(true)}
              className="p-2 sm:px-3.5 sm:py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 sm:gap-2 transition cursor-pointer"
              title="Walk with audio clues in your pocket"
            >
              <Headphones className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Audio Walk</span>
            </button>

            {/* If user is an Admin, give quick clean switch to Admin Console */}
            {isAdmin && (
              <button
                onClick={() => setAppMode('admin')}
                className="p-2 sm:px-3 sm:py-2 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                title="Switch to Admin Management Console"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}

            {/* Profile or Login Button */}
            {userProfile ? (
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="p-1.5 sm:px-3 sm:py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 sm:gap-2 transition cursor-pointer max-w-[160px] sm:max-w-none"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-[11px] shrink-0">
                  {userProfile.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden sm:block min-w-0">
                  <span className="text-white block font-bold leading-tight truncate max-w-[110px]">
                    {userProfile.displayName}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="text-amber-400 font-bold flex items-center gap-0.5">
                      <Flame className="w-2.5 h-2.5" />
                      {userProfile.streakDays || 0}d streak
                    </span>
                    <span className="text-neutral-500">·</span>
                    <span className="text-emerald-400 font-medium">
                      {userProfile.totalQuestsCompleted || journalEntries.length} found
                    </span>
                  </div>
                </div>
              </button>
            ) : (
              <button
                onClick={() => { setAuthModalTab('user'); setIsAuthModalOpen(true); }}
                className="px-3 sm:px-3.5 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In</span>
              </button>
            )}
          </div>
        </div>

        {/* User Navigation Tabs (Responsive & Touch-Friendly) */}
        <div className="max-w-6xl mx-auto px-2 sm:px-4 flex gap-1 sm:gap-2 border-t border-neutral-900/80 pt-0.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('camera')}
            className={`py-2 sm:py-2.5 px-3 sm:px-4 text-xs font-bold transition border-b-2 flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 ${
              activeTab === 'camera'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Camera</span>
          </button>
          <button
            onClick={() => setActiveTab('quests')}
            className={`py-2 sm:py-2.5 px-3 sm:px-4 text-xs font-bold transition border-b-2 flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 ${
              activeTab === 'quests'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Quests</span>
          </button>
          <button
            onClick={() => setActiveTab('journal')}
            className={`py-2 sm:py-2.5 px-3 sm:px-4 text-xs font-bold transition border-b-2 flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 ${
              activeTab === 'journal'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Journal ({journalEntries.length})</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-6 space-y-4 sm:space-y-5 overflow-x-hidden">
        {/* Quick 3-Step Guide for New Users */}
        {showHowItWorks && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 sm:p-4 relative transition">
            <button
              onClick={() => setShowHowItWorks(false)}
              className="absolute top-3 right-3 p-1 text-neutral-400 hover:text-white rounded-lg transition cursor-pointer"
              title="Close guide"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-2.5 pr-6">
              <span className="text-xs font-bold text-emerald-400">
                How It Works:
              </span>
              <span className="text-xs text-neutral-400 hidden sm:inline">
                Find real nature outside in 3 easy steps
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              <div className="flex items-center gap-2.5 bg-neutral-950/60 p-2.5 rounded-xl border border-neutral-800/60">
                <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Pick a Quest</h4>
                  <p className="text-[11px] text-neutral-400">Choose a leaf, flower, or sky item to find.</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-neutral-950/60 p-2.5 rounded-xl border border-neutral-800/60">
                <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Snap a Photo</h4>
                  <p className="text-[11px] text-neutral-400">Take a picture outside in real daylight.</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-neutral-950/60 p-2.5 rounded-xl border border-neutral-800/60">
                <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Save & Streak</h4>
                  <p className="text-[11px] text-neutral-400">Save finds and grow your daily streak!</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Current Quest Bar (Camera view) with Completion Status */}
        {activeTab === 'camera' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
            <div className="flex items-start sm:items-center gap-3 min-w-0 w-full flex-1">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-950 border border-emerald-800/80 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <Compass className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs flex-wrap">
                  <span className="text-neutral-400">Quest:</span>
                  <span className="text-emerald-400 font-bold truncate">{currentQuest.title}</span>
                  {isCurrentCompleted && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1 shrink-0">
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                      <span>Completed ({currentCompletionCount}x){isCurrentRepeat ? ' · Repeat Run' : ''}</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-300 line-clamp-1 mt-0.5">
                  {currentQuest.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-neutral-800/60">
              <button
                onClick={() => setActiveTab('quests')}
                className="flex-1 sm:flex-none px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold transition cursor-pointer text-center"
              >
                Change Quest
              </button>
              <button
                onClick={() => setIsScreenFreeMode(true)}
                className="flex-1 sm:flex-none px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>Audio Walk</span>
              </button>
            </div>
          </div>
        )}

        {/* Error notification */}
        {errorMessage && (
          <div className="p-4 bg-amber-950/60 border border-amber-800/80 text-amber-200 rounded-2xl text-xs flex items-center justify-between">
            <p className="font-medium">⚠️ {errorMessage}</p>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-amber-400 hover:text-white ml-2 text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab 1: Expedition Camera */}
        {activeTab === 'camera' && (
          <div className="space-y-6">
            {lastVerificationResult && lastCapturedImage ? (
              <VerificationCard
                questTarget={currentQuest.target}
                result={lastVerificationResult}
                capturedImageUrl={lastCapturedImage}
                onSaveToJournal={handleSaveToJournal}
                onRetake={() => {
                  setLastVerificationResult(null);
                  setLastCapturedImage(null);
                }}
                isSaved={isCurrentSaved}
                autoPlayAudio={true}
                isRepeatRun={isCurrentRepeat || isCurrentCompleted}
                repeatCount={currentCompletionCount}
                onNextQuest={() => setActiveTab('quests')}
              />
            ) : (
              <CameraViewfinder
                questTarget={currentQuest.target}
                questTitle={currentQuest.title}
                onImageCaptured={handleVerifyImage}
                isAnalyzing={isAnalyzing}
                isQuestCompleted={isCurrentCompleted}
                completionCount={currentCompletionCount}
              />
            )}
          </div>
        )}

        {/* Tab 2: Quests Catalog */}
        {activeTab === 'quests' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white">Nature Quests</h3>
              <p className="text-xs text-neutral-400">
                Pick an item to find outside, or create your own quest! Completed quests ask permission before repeating.
              </p>
            </div>

            <QuestSelector
              quests={allQuests}
              currentQuest={currentQuest}
              onSelectQuest={(q, isRepeat) => {
                setCurrentQuest(q);
                setIsCurrentRepeat(Boolean(isRepeat));
                setActiveTab('camera');
                setLastVerificationResult(null);
                setLastCapturedImage(null);
              }}
              onAddCustomQuest={handleAddCustomQuest}
              journalEntries={journalEntries}
              completedQuestsMap={completedQuestsMap}
            />
          </div>
        )}

        {/* Tab 3: Field Journal & Badges */}
        {activeTab === 'journal' && (
          <FieldJournal
            entries={journalEntries}
            badges={badges}
            onClearJournal={handleClearJournal}
            onSelectEntry={(entry) => {
              setCurrentQuest(
                allQuests.find((q) => q.target === entry.questTarget) || {
                  id: 'entry-quest',
                  target: entry.questTarget,
                  category: 'custom',
                  title: entry.questTitle,
                  description: 'Logged discovery from journal',
                  iconName: 'Compass',
                  difficulty: 'easy',
                  hints: [],
                }
              );
              setLastCapturedImage(entry.photoDataUrl);
              setLastVerificationResult(entry.verification);
              setIsCurrentSaved(true);
              setIsCurrentRepeat(true);
              setActiveTab('camera');
            }}
          />
        )}
      </main>

      {/* Screen-Free Mode Overlay */}
      {isScreenFreeMode && (
        <ScreenFreeMode
          quest={currentQuest}
          onExit={() => setIsScreenFreeMode(false)}
          onTriggerCapture={() => {
            if (lastCapturedImage) {
              handleVerifyImage(lastCapturedImage, 'image/jpeg');
            } else {
              setIsScreenFreeMode(false);
              setActiveTab('camera');
            }
          }}
          lastResult={lastVerificationResult}
          isAnalyzing={isAnalyzing}
        />
      )}

      {/* User Login & Admin Login Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab={authModalTab}
        onSuccess={(role) => {
          if (role === 'admin') {
            setAppMode('admin');
          } else {
            setAppMode('explorer');
          }
        }}
      />

      {/* User Profile & Progress Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onOpenAdminDashboard={() => setAppMode('admin')}
        journalEntries={journalEntries}
      />

      {/* Footer */}
      <footer className="border-t border-neutral-900 py-4 px-6 text-center text-xs text-neutral-500">
        Nature Go · Powered by Firebase & Google AI Studio · Screen-Free Outdoor Exploration
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NatureGoContent />
    </AuthProvider>
  );
}
