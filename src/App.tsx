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
  Sliders,
  CheckCircle,
  Flame,
} from 'lucide-react';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db, auth } from './firebase/config';
import { INITIAL_QUESTS } from './data/quests';
import { Quest, VisionVerificationResult, JournalEntry, Badge } from './types/nature';
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
    name: 'First Sprout',
    description: 'Verify your first genuine outdoor discovery in the wild.',
    icon: '🌱',
    unlocked: false,
    targetCount: 1,
    currentCount: 0,
  },
  {
    id: 'woodland_scout',
    name: 'Woodland Scout',
    description: 'Discover 3 different forest treasures (leaves, bark, pinecones).',
    icon: '🌲',
    unlocked: false,
    targetCount: 3,
    currentCount: 0,
  },
  {
    id: 'elemental_seeker',
    name: 'Sky & Stream Seeker',
    description: 'Capture authentic outdoor water or open atmospheric skies.',
    icon: '🌊',
    unlocked: false,
    targetCount: 2,
    currentCount: 0,
  },
  {
    id: 'anti_spoof_master',
    name: 'Wilderness Pure',
    description: 'Pass 3 consecutive anti-spoof checks with >85% confidence score.',
    icon: '🛡️',
    unlocked: false,
    targetCount: 3,
    currentCount: 0,
  },
  {
    id: 'master_naturalist',
    name: 'Master Naturalist',
    description: 'Record 5 or more verified natural species in your Field Journal.',
    icon: '🧭',
    unlocked: false,
    targetCount: 5,
    currentCount: 0,
  },
];

function NatureGoContent() {
  const { userProfile, isAdmin, recordQuestCompletion } = useAuth();

  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [currentQuest, setCurrentQuest] = useState<Quest>(INITIAL_QUESTS[0]);
  const [activeTab, setActiveTab] = useState<'camera' | 'quests' | 'journal' | 'admin'>('camera');
  const [isScreenFreeMode, setIsScreenFreeMode] = useState<boolean>(false);
  const [showHowItWorks, setShowHowItWorks] = useState<boolean>(true);

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'user' | 'admin'>('user');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Vision verification state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [lastCapturedImage, setLastCapturedImage] = useState<string | null>(null);
  const [lastVerificationResult, setLastVerificationResult] = useState<VisionVerificationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Journal and Badges state
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem('nature_go_journal');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [badges, setBadges] = useState<Badge[]>(() => {
    try {
      const saved = localStorage.getItem('nature_go_badges');
      return saved ? JSON.parse(saved) : INITIAL_BADGES;
    } catch {
      return INITIAL_BADGES;
    }
  });

  const [isCurrentSaved, setIsCurrentSaved] = useState<boolean>(false);

  // Sync user discoveries from Firestore database when user signs in with Google
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
          // Merge cloud discoveries with local
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

  // Persist journal to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nature_go_journal', JSON.stringify(journalEntries));
    } catch (e) {
      console.warn('Failed to save journal to localStorage:', e);
    }
  }, [journalEntries]);

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
      localStorage.setItem('nature_go_badges', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save badges to localStorage:', e);
    }
  }, [journalEntries]);

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

  // Save verified task to Journal and Database
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

    setQuests((prev) => [newQuest, ...prev]);
    setCurrentQuest(newQuest);
    setActiveTab('camera');
    setLastVerificationResult(null);
  };

  const handleClearJournal = () => {
    if (window.confirm('Clear all entries in your Explorer Field Journal?')) {
      setJournalEntries([]);
      localStorage.removeItem('nature_go_journal');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Header */}
      <header className="border-b border-neutral-900 bg-neutral-950/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-3.5 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">
                  Nature Go
                </h1>
                <span className="text-xs text-emerald-400 font-medium hidden sm:inline">
                  · Outdoor Vision Intelligence
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Screen-free outdoor exploration & authentic nature quests
              </p>
            </div>
          </div>

          {/* User Profile / Admin / Login Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Screen-Free Mode Launcher */}
            <button
              onClick={() => setIsScreenFreeMode(true)}
              className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
              title="Put phone in pocket and explore with voice directions"
            >
              <Headphones className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Pocket Walk</span>
            </button>

            {/* Admin Dashboard shortcut if admin */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab(activeTab === 'admin' ? 'camera' : 'admin')}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                  activeTab === 'admin'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                    : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border-emerald-800/80'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Admin Dashboard</span>
              </button>
            )}

            {/* Profile or Login Button */}
            {userProfile ? (
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-[11px]">
                  {userProfile.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden sm:block">
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
                      {userProfile.totalQuestsCompleted || journalEntries.length} done
                    </span>
                  </div>
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => { setAuthModalTab('user'); setIsAuthModalOpen(true); }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Explorer Login</span>
                </button>
                <button
                  onClick={() => { setAuthModalTab('admin'); setIsAuthModalOpen(true); }}
                  className="p-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-emerald-400 rounded-xl border border-neutral-800 transition"
                  title="Admin Sign In"
                >
                  <ShieldCheck className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-6xl mx-auto px-4 flex gap-2 border-t border-neutral-900/80 pt-1">
          <button
            onClick={() => setActiveTab('camera')}
            className={`py-2.5 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'camera'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Expedition Camera</span>
          </button>
          <button
            onClick={() => setActiveTab('quests')}
            className={`py-2.5 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'quests'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Choose Quest ({quests.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('journal')}
            className={`py-2.5 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'journal'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Field Journal & Badges ({journalEntries.length})</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`py-2.5 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === 'admin'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Admin Management</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Onboarding Guide */}
        {showHowItWorks && activeTab !== 'admin' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 relative transition">
            <button
              onClick={() => setShowHowItWorks(false)}
              className="absolute top-3.5 right-3.5 p-1 text-neutral-400 hover:text-white rounded-lg transition"
              title="Close guide"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Welcome to Nature Go
              </span>
              <span className="text-neutral-500">·</span>
              <span className="text-xs text-neutral-400">
                Log in to sync discoveries to the database, or explore immediately
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-emerald-400 shrink-0 font-bold text-xs">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5">
                    Pick a Nature Quest
                  </h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Search for leaves, tree bark, pinecones, water, or open sky in outdoor nature.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-emerald-400 shrink-0 font-bold text-xs">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5">
                    Snap or Upload a Photo
                  </h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Capture real live nature. Our Vision AI verifies natural sunlight and rejects screens or fake plastic.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-emerald-400 shrink-0 font-bold text-xs">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5">
                    Save to Database Profile
                  </h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Progress, streaks, and verified finds are saved to your profile in Firestore so they are ready next time!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Quest Bar (Camera view) */}
        {activeTab === 'camera' && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-800/80 text-emerald-400 flex items-center justify-center shrink-0">
                <Compass className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-emerald-400">Current Assignment:</span>
                  <span className="text-white font-bold capitalize">{currentQuest.target}</span>
                </div>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {currentQuest.title}
                </h3>
                <p className="text-xs text-neutral-400 line-clamp-1">
                  {currentQuest.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setActiveTab('quests')}
                className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold transition"
              >
                Change Target
              </button>
              <button
                onClick={() => setIsScreenFreeMode(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>Pocket Audio Walk</span>
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
              />
            ) : (
              <CameraViewfinder
                questTarget={currentQuest.target}
                questTitle={currentQuest.title}
                onImageCaptured={handleVerifyImage}
                isAnalyzing={isAnalyzing}
              />
            )}
          </div>
        )}

        {/* Tab 2: Quests Catalog */}
        {activeTab === 'quests' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Outdoor Quests Catalog</h3>
                <p className="text-xs text-neutral-400">
                  Choose a quest to look for outside, or create your own custom challenge
                </p>
              </div>
            </div>

            <QuestSelector
              quests={quests}
              currentQuest={currentQuest}
              onSelectQuest={(q) => {
                setCurrentQuest(q);
                setActiveTab('camera');
                setLastVerificationResult(null);
                setLastCapturedImage(null);
              }}
              onAddCustomQuest={handleAddCustomQuest}
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
                quests.find((q) => q.target === entry.questTarget) || {
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
              setActiveTab('camera');
            }}
          />
        )}

        {/* Tab 4: Admin Dashboard */}
        {activeTab === 'admin' && (
          <AdminDashboard
            onBack={() => setActiveTab('camera')}
            onAddNewQuestToRoster={(newQ) => setQuests((prev) => [newQ, ...prev])}
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
      />

      {/* User Profile & Progress Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onOpenAdminDashboard={() => setActiveTab('admin')}
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
