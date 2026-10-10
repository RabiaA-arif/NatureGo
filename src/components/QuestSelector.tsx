import React, { useState } from 'react';
import {
  Compass,
  Leaf,
  TreePine,
  Trees,
  Droplets,
  CloudSun,
  Plus,
  Check,
  CheckCircle2,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { Quest, JournalEntry, CompletedQuestRecord } from '../types/nature';
import { ChallengesPanel } from './ChallengesPanel';
import { RepeatQuestModal } from './RepeatQuestModal';
import { playQuestAcceptSound } from '../utils/audio';

interface QuestSelectorProps {
  quests: Quest[];
  currentQuest: Quest;
  onSelectQuest: (quest: Quest, isRepeat?: boolean) => void;
  onAddCustomQuest: (target: string, title: string) => void;
  journalEntries?: JournalEntry[];
  completedQuestsMap?: Record<string, CompletedQuestRecord>;
}

export const QuestSelector: React.FC<QuestSelectorProps> = ({
  quests,
  currentQuest,
  onSelectQuest,
  onAddCustomQuest,
  journalEntries = [],
  completedQuestsMap = {},
}) => {
  const [viewMode, setViewMode] = useState<'quests' | 'challenges'>('quests');
  const [filter, setFilter] = useState<string>('all');
  const [isCreatingCustom, setIsCreatingCustom] = useState<boolean>(false);
  const [customTarget, setCustomTarget] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');

  // Repeat confirmation modal state
  const [repeatModalQuest, setRepeatModalQuest] = useState<Quest | null>(null);
  const [repeatModalRecord, setRepeatModalRecord] = useState<CompletedQuestRecord | null>(null);

  const getCompletionInfo = (quest: Quest): { isCompleted: boolean; count: number; record: CompletedQuestRecord | null } => {
    const record =
      completedQuestsMap[quest.id] ||
      completedQuestsMap[quest.target.toLowerCase().trim()] ||
      null;

    const journalCount = journalEntries.filter(
      (e) =>
        e.questTarget.toLowerCase().trim() === quest.target.toLowerCase().trim() ||
        e.questTitle.toLowerCase().trim() === quest.title.toLowerCase().trim()
    ).length;

    const count = Math.max(record?.count || 0, journalCount);
    return {
      isCompleted: count > 0,
      count,
      record: record || (count > 0 ? {
        questId: quest.id,
        questTarget: quest.target,
        count,
        firstCompletedAt: Date.now(),
        lastCompletedAt: Date.now(),
      } : null),
    };
  };

  const getQuestIcon = (iconName: string) => {
    switch (iconName) {
      case 'Leaf':
        return <Leaf className="w-5 h-5 text-emerald-400" />;
      case 'TreePine':
        return <TreePine className="w-5 h-5 text-amber-400" />;
      case 'Trees':
        return <Trees className="w-5 h-5 text-orange-400" />;
      case 'Droplets':
        return <Droplets className="w-5 h-5 text-sky-400" />;
      case 'CloudSun':
        return <CloudSun className="w-5 h-5 text-cyan-400" />;
      default:
        return <Compass className="w-5 h-5 text-emerald-400" />;
    }
  };

  const handleQuestCardClick = (q: Quest) => {
    const { isCompleted, count, record } = getCompletionInfo(q);

    if (isCompleted) {
      // Quest already completed: ask permission before starting a repeat run!
      setRepeatModalQuest(q);
      setRepeatModalRecord(record);
    } else {
      // First time completing: select immediately
      playQuestAcceptSound();
      onSelectQuest(q, false);
    }
  };

  const handleConfirmRepeat = () => {
    if (repeatModalQuest) {
      playQuestAcceptSound();
      onSelectQuest(repeatModalQuest, true);
      setRepeatModalQuest(null);
      setRepeatModalRecord(null);
    }
  };

  const handleCancelRepeat = () => {
    setRepeatModalQuest(null);
    setRepeatModalRecord(null);
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTarget.trim()) return;
    const title = customTitle.trim() || `Outdoor Quest: ${customTarget.trim()}`;
    onAddCustomQuest(customTarget.trim(), title);
    setCustomTarget('');
    setCustomTitle('');
    setIsCreatingCustom(false);
    playQuestAcceptSound();
  };

  const completedQuestsTotal = quests.filter((q) => getCompletionInfo(q).isCompleted).length;

  const filteredQuests = quests.filter((q) => {
    if (filter === 'all') return true;
    if (filter === 'completed') {
      return getCompletionInfo(q).isCompleted;
    }
    return q.category === filter;
  });

  return (
    <div className="space-y-3.5 sm:space-y-4 w-full">
      {/* Top View Mode Switcher: Quests vs Challenges */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-1 border-b border-neutral-900 w-full">
        <div className="flex p-1 bg-neutral-900 rounded-xl border border-neutral-800 text-xs font-bold w-full sm:w-auto">
          <button
            onClick={() => setViewMode('quests')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              viewMode === 'quests'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Quests ({quests.length})</span>
          </button>

          <button
            onClick={() => setViewMode('challenges')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              viewMode === 'challenges'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            <span>Challenges (8)</span>
          </button>
        </div>

        {viewMode === 'quests' && (
          <button
            onClick={() => setIsCreatingCustom(!isCreatingCustom)}
            className="w-full sm:w-auto px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-emerald-400 border border-neutral-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Custom Quest</span>
          </button>
        )}
      </div>

      {/* Challenges View */}
      {viewMode === 'challenges' ? (
        <ChallengesPanel
          journalEntries={journalEntries}
          quests={quests}
          onSelectQuestForChallenge={(q) => handleQuestCardClick(q)}
        />
      ) : (
        <>
          {/* Category Filter for Quests (Swipeable on mobile, no layout breakage) */}
          <div className="flex items-center gap-1.5 p-1 bg-neutral-900 rounded-xl border border-neutral-800 text-xs font-medium overflow-x-auto no-scrollbar w-full">
            {[
              { id: 'all', label: `All (${quests.length})` },
              { id: 'completed', label: `✓ Done (${completedQuestsTotal})` },
              { id: 'forest', label: '🌲 Woods' },
              { id: 'water_sky', label: '🌊 Water & Sky' },
              { id: 'meadow', label: '🌼 Meadow' },
              { id: 'micro_nature', label: '🔍 Tiny' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id)}
                className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer shrink-0 text-[11px] sm:text-xs ${
                  filter === cat.id
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Custom Quest Creator Form */}
          {isCreatingCustom && (
            <form
              onSubmit={handleCreateCustom}
              className="p-3.5 sm:p-4 bg-neutral-900 border border-emerald-900/60 rounded-2xl space-y-3 w-full"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Create a Custom Quest</span>
                </h4>
                <span className="text-xs text-neutral-400">
                  Type any natural outdoor item to find
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    What to find (Required)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. dandelion, acorn, bird feather, mossy stone"
                    value={customTarget}
                    onChange={(e) => setCustomTarget(e.target.value)}
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Quest Title (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acorn Hunt"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreatingCustom(false)}
                  className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer"
                >
                  Start This Quest
                </button>
              </div>
            </form>
          )}

          {/* Quest Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 w-full">
            {filteredQuests.map((quest) => {
              const isSelected = quest.id === currentQuest.id;
              const { isCompleted, count } = getCompletionInfo(quest);

              return (
                <button
                  key={quest.id}
                  onClick={() => handleQuestCardClick(quest)}
                  className={`text-left p-3 sm:p-3.5 rounded-2xl border transition relative flex flex-col justify-between group cursor-pointer w-full ${
                    isSelected
                      ? 'bg-neutral-900 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                      : isCompleted
                      ? 'bg-neutral-900/90 hover:bg-neutral-900 border-emerald-900/60 hover:border-emerald-700/80'
                      : 'bg-neutral-900/80 hover:bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5 gap-2">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center shrink-0">
                        {getQuestIcon(quest.iconName)}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {isCompleted && (
                          <span className="text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs shrink-0">
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Done {count > 1 ? `(${count}x)` : ''}</span>
                          </span>
                        )}

                        {isSelected ? (
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full shrink-0">
                            Active
                          </span>
                        ) : (
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                              quest.difficulty === 'easy'
                                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900'
                                : quest.difficulty === 'medium'
                                ? 'bg-amber-950/60 text-amber-300 border border-amber-900'
                                : 'bg-purple-950/60 text-purple-300 border border-purple-900'
                            }`}
                          >
                            {quest.difficulty}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mb-1">
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                        {quest.title}
                      </h4>
                    </div>
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      {quest.description}
                    </p>
                  </div>

                  {quest.hints && quest.hints.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-neutral-800/80 text-[11px] text-neutral-400 line-clamp-1">
                      💡 {quest.hints[0]}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Repeat Completed Quest Confirmation Permission Modal */}
      <RepeatQuestModal
        isOpen={Boolean(repeatModalQuest)}
        quest={repeatModalQuest}
        completionRecord={repeatModalRecord}
        onConfirm={handleConfirmRepeat}
        onCancel={handleCancelRepeat}
      />
    </div>
  );
};
