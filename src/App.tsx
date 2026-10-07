import React, { useState, useEffect } from 'react';
import {
  Compass,
  Camera,
  BookOpen,
  Headphones,
  Award,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  X,
  HelpCircle,
  Eye,
  CheckCircle,
} from 'lucide-react';
import { INITIAL_QUESTS } from './data/quests';
import { Quest, VisionVerificationResult, JournalEntry, Badge } from './types/nature';
import { CameraViewfinder } from './components/CameraViewfinder';
import { VerificationCard } from './components/VerificationCard';
import { QuestSelector } from './components/QuestSelector';
import { FieldJournal } from './components/FieldJournal';
import { ScreenFreeMode } from './components/ScreenFreeMode';
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

export default function App() {
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [currentQuest, setCurrentQuest] = useState<Quest>(INITIAL_QUESTS[0]);
  const [activeTab, setActiveTab] = useState<'camera' | 'quests' | 'journal'>('camera');
  const [isScreenFreeMode, setIsScreenFreeMode] = useState<boolean>(false);
  const [showHowItWorks, setShowHowItWorks] = useState<boolean>(true);

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

  useEffect(() => {
    try {
      localStorage.setItem('nature_go_journal', JSON.stringify(journalEntries));
    } catch (e) {
      console.warn('Failed to save journal to localStorage:', e);
    }
  }, [journalEntries]);

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

  const handleSaveToJournal = () => {
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
                Explore real nature screen-free with audio guidance
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsScreenFreeMode(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm"
              title="Put phone in pocket and explore with voice directions"
            >
              <Headphones className="w-4 h-4" />
              <span>Pocket Audio Walk</span>
            </button>

            <button
              onClick={() => setActiveTab('journal')}
              className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Journal</span>
              <span className="text-emerald-400 font-bold ml-0.5">
                ({journalEntries.length})
              </span>
            </button>
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
            <span>My Field Journal & Badges</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Friendly "How Nature Go Works" Guide for New Explorers */}
        {showHowItWorks && (
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
                Simple 3-step guide for new explorers
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
                    Search for leaves, tree bark, pinecones, water, or open sky in your yard, park, or forest.
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
                    Capture real live nature. Our AI checks for genuine outdoor sunlight and rejects screens or fake plastic.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-emerald-400 shrink-0 font-bold text-xs">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5">
                    Listen to Ranger Audio
                  </h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Hear fascinating facts spoken aloud so you can enjoy nature screen-free, and collect badges in your journal!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Quest Bar (Always visible in camera view) */}
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

        {/* Error message */}
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

            {/* Clear Customer-Friendly Anti-Spoof Rules */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  How Nature Go Verifies Your Outdoor Discoveries
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-neutral-400">
                <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                  <span className="text-white font-bold block mb-1">
                    ✓ Matches Target
                  </span>
                  <p className="leading-relaxed">
                    Checks that your photo clearly features the quest target (like "{currentQuest.target}").
                  </p>
                </div>

                <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                  <span className="text-white font-bold block mb-1">
                    ✓ Real Outdoor Object
                  </span>
                  <p className="leading-relaxed">
                    Rejects photos taken of computer screens, iPad wallpapers, fake plastic plants, and indoor houseplants.
                  </p>
                </div>

                <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                  <span className="text-white font-bold block mb-1">
                    ✓ Natural Daylight & Context
                  </span>
                  <p className="leading-relaxed">
                    Verifies natural outdoor sunlight, real soil, open sky, and genuine outdoor vegetation.
                  </p>
                </div>
              </div>
            </div>
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

      {/* Footer */}
      <footer className="border-t border-neutral-900 py-4 px-6 text-center text-xs text-neutral-500">
        Nature Go · Screen-Free Outdoor Exploration &bull; Verified Authentic Nature
      </footer>
    </div>
  );
}
