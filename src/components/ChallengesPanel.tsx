import React, { useState } from 'react';
import {
  Trophy,
  Award,
  Zap,
  CheckCircle2,
  Compass,
  ArrowRight,
  Flame,
  Sparkles,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { Challenge, Quest, JournalEntry } from '../types/nature';
import { INITIAL_CHALLENGES } from '../data/challenges';
import { playQuestAcceptSound } from '../utils/audio';

interface ChallengesPanelProps {
  journalEntries: JournalEntry[];
  quests: Quest[];
  onSelectQuestForChallenge: (quest: Quest) => void;
}

export const ChallengesPanel: React.FC<ChallengesPanelProps> = ({
  journalEntries,
  quests,
  onSelectQuestForChallenge,
}) => {
  const [filter, setFilter] = useState<'all' | 'daily' | 'biome' | 'mastery' | 'special'>('all');

  const todayStr = new Date().toISOString().slice(0, 10);

  // Compute live challenge progress based on verified journal entries
  const evaluatedChallenges = INITIAL_CHALLENGES.map((challenge) => {
    let count = 0;

    if (challenge.id === 'challenge-forest-canopy') {
      count = journalEntries.filter((e) =>
        ['leaf', 'bark', 'pinecone', 'acorn', 'fern', 'needle', 'mushroom'].some((k) =>
          e.questTarget.toLowerCase().includes(k)
        )
      ).length;
    } else if (challenge.id === 'challenge-water-sky') {
      count = journalEntries.filter((e) =>
        ['water', 'sky', 'cloud', 'pebble', 'stone', 'horizon'].some((k) =>
          e.questTarget.toLowerCase().includes(k)
        )
      ).length;
    } else if (challenge.id === 'challenge-micro-wonders') {
      count = journalEntries.filter((e) =>
        ['moss', 'dew', 'web', 'snail', 'spider'].some((k) =>
          e.questTarget.toLowerCase().includes(k)
        )
      ).length;
    } else if (challenge.id === 'challenge-meadow-pollinators') {
      count = journalEntries.filter((e) =>
        ['flower', 'dandelion', 'grass', 'soil', 'feather', 'bee', 'pollinator'].some((k) =>
          e.questTarget.toLowerCase().includes(k)
        )
      ).length;
    } else if (challenge.id === 'challenge-zero-spoof') {
      count = journalEntries.filter((e) => e.verification.confidence_score >= 0.9).length;
    } else if (challenge.id === 'challenge-forager-secret') {
      count = journalEntries.filter((e) =>
        ['mushroom', 'fungus', 'acorn'].some((k) => e.questTarget.toLowerCase().includes(k))
      ).length;
    } else if (challenge.id === 'challenge-daily-double') {
      count = journalEntries.filter((e) => {
        const entryDate = new Date(e.timestamp).toISOString().slice(0, 10);
        return entryDate === todayStr;
      }).length;
    } else if (challenge.id === 'challenge-grand-slam') {
      const hasForest = journalEntries.some((e) =>
        ['leaf', 'bark', 'pinecone', 'acorn', 'fern', 'mushroom'].some((k) =>
          e.questTarget.toLowerCase().includes(k)
        )
      );
      const hasWaterSky = journalEntries.some((e) =>
        ['water', 'sky', 'cloud', 'pebble', 'horizon'].some((k) =>
          e.questTarget.toLowerCase().includes(k)
        )
      );
      const hasMeadow = journalEntries.some((e) =>
        ['flower', 'grass', 'soil', 'feather', 'pollinator'].some((k) =>
          e.questTarget.toLowerCase().includes(k)
        )
      );
      const hasMicro = journalEntries.some((e) =>
        ['moss', 'dew', 'web', 'snail'].some((k) => e.questTarget.toLowerCase().includes(k))
      );
      count = [hasForest, hasWaterSky, hasMeadow, hasMicro].filter(Boolean).length;
    }

    const currentCount = Math.min(count, challenge.targetCount);
    const completed = currentCount >= challenge.targetCount;

    return {
      ...challenge,
      currentCount,
      completed,
    };
  });

  const filteredChallenges = evaluatedChallenges.filter((c) => {
    if (filter === 'all') return true;
    return c.category === filter;
  });

  const completedCount = evaluatedChallenges.filter((c) => c.completed).length;

  const handleStartChallenge = (challenge: Challenge) => {
    playQuestAcceptSound();
    if (challenge.associatedQuestTarget) {
      const matchingQuest = quests.find((q) =>
        q.target.toLowerCase().includes(challenge.associatedQuestTarget!.toLowerCase())
      );
      if (matchingQuest) {
        onSelectQuestForChallenge(matchingQuest);
        return;
      }
    }
    // Default fallback to first quest
    if (quests.length > 0) {
      onSelectQuestForChallenge(quests[0]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Challenges Overview Banner */}
      <div className="bg-gradient-to-r from-emerald-950/70 via-neutral-900 to-teal-950/70 border border-emerald-800/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">
                Nature Challenges
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-800/80 px-2 py-0.5 rounded-full">
                {completedCount} of {evaluatedChallenges.length} Done
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Complete fun challenge goals to earn badges and XP!
            </p>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full sm:w-44 bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 shrink-0">
          <div className="flex items-center justify-between text-[11px] mb-1 font-semibold">
            <span className="text-neutral-400">Progress</span>
            <span className="text-emerald-400">
              {Math.round((completedCount / evaluatedChallenges.length) * 100)}%
            </span>
          </div>
          <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
              style={{
                width: `${(completedCount / evaluatedChallenges.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-neutral-900 rounded-xl border border-neutral-800 text-xs font-medium">
        {[
          { id: 'all', label: `All (${evaluatedChallenges.length})` },
          { id: 'biome', label: 'Nature Sets' },
          { id: 'daily', label: 'Daily' },
          { id: 'mastery', label: 'Mastery' },
          { id: 'special', label: 'Special' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              filter === tab.id
                ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Challenges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredChallenges.map((challenge) => {
          const progressPercent = Math.round(
            (challenge.currentCount / challenge.targetCount) * 100
          );

          return (
            <div
              key={challenge.id}
              className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
                challenge.completed
                  ? 'bg-gradient-to-br from-emerald-950/40 via-neutral-900 to-neutral-950 border-emerald-700/60 shadow-md'
                  : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-2 bg-neutral-950 rounded-xl border border-neutral-800">
                      {challenge.icon}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">
                          {challenge.title}
                        </h4>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            challenge.difficulty === 'easy'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                              : challenge.difficulty === 'medium'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
                              : 'bg-purple-950 text-purple-300 border border-purple-800/80'
                          }`}
                        >
                          {challenge.difficulty}
                        </span>
                      </div>
                      <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
                        <Sparkles className="w-3 h-3" />
                        Reward: {challenge.badgeReward} (+{challenge.xpReward} XP)
                      </span>
                    </div>
                  </div>

                  {challenge.completed ? (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/90 border border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Completed
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-neutral-400 shrink-0">
                      {challenge.currentCount} / {challenge.targetCount}
                    </span>
                  )}
                </div>

                <p className="text-xs text-neutral-400 leading-relaxed mb-3">
                  {challenge.description}
                </p>
              </div>

              {/* Progress Bar & Action */}
              <div className="space-y-2.5 pt-2 border-t border-neutral-800/60">
                <div className="w-full h-1.5 bg-neutral-950 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      challenge.completed
                        ? 'bg-emerald-400'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-neutral-500">
                    {challenge.completed
                      ? 'Milestone claimed in journal'
                      : `${challenge.targetCount - challenge.currentCount} more to unlock`}
                  </span>

                  {!challenge.completed && (
                    <button
                      onClick={() => handleStartChallenge(challenge)}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-emerald-600 text-neutral-200 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <span>Take Quest</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
