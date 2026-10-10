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
  Sparkles,
  Trophy,
} from 'lucide-react';
import { Quest, JournalEntry } from '../types/nature';
import { ChallengesPanel } from './ChallengesPanel';
import { playQuestAcceptSound } from '../utils/audio';

interface QuestSelectorProps {
  quests: Quest[];
  currentQuest: Quest;
  onSelectQuest: (quest: Quest) => void;
  onAddCustomQuest: (target: string, title: string) => void;
  journalEntries?: JournalEntry[];
}

export const QuestSelector: React.FC<QuestSelectorProps> = ({
  quests,
  currentQuest,
  onSelectQuest,
  onAddCustomQuest,
  journalEntries = [],
}) => {
  const [viewMode, setViewMode] = useState<'quests' | 'challenges'>('quests');
  const [filter, setFilter] = useState<string>('all');
  const [isCreatingCustom, setIsCreatingCustom] = useState<boolean>(false);
  const [customTarget, setCustomTarget] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');

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

  const handleSelect = (q: Quest) => {
    playQuestAcceptSound();
    onSelectQuest(q);
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

  const filteredQuests = quests.filter((q) => {
    if (filter === 'all') return true;
    return q.category === filter;
  });

  return (
    <div className="space-y-4">
      {/* Top View Mode Switcher: Quests vs Challenges */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-neutral-900">
        <div className="flex p-1 bg-neutral-900 rounded-xl border border-neutral-800 text-xs font-bold">
          <button
            onClick={() => setViewMode('quests')}
            className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
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
            className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
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
            className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-emerald-400 border border-neutral-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
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
          onSelectQuestForChallenge={handleSelect}
        />
      ) : (
        <>
          {/* Category Filter for Quests */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-neutral-900 rounded-xl border border-neutral-800 text-xs font-medium">
            {[
              { id: 'all', label: `All (${quests.length})` },
              { id: 'forest', label: '🌲 Trees & Woods' },
              { id: 'water_sky', label: '🌊 Water & Sky' },
              { id: 'meadow', label: '🌼 Flowers & Meadow' },
              { id: 'micro_nature', label: '🔍 Tiny Finds' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id)}
                className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
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
              className="p-4 bg-neutral-900 border border-emerald-900/60 rounded-2xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Create a Custom Quest</span>
                </h4>
                <span className="text-xs text-neutral-400">
                  Type any natural outdoor item to find
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {filteredQuests.map((quest) => {
              const isSelected = quest.id === currentQuest.id;
              return (
                <button
                  key={quest.id}
                  onClick={() => handleSelect(quest)}
                  className={`text-left p-3.5 rounded-2xl border transition relative flex flex-col justify-between group cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-900 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                      : 'bg-neutral-900/80 hover:bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="w-9 h-9 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center">
                        {getQuestIcon(quest.iconName)}
                      </div>
                      {isSelected ? (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                          <Check className="w-3.5 h-3.5" />
                          Selected
                        </span>
                      ) : (
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
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

                    <h4 className="text-sm font-bold text-white mb-1 group-hover:text-emerald-300 transition-colors">
                      {quest.title}
                    </h4>
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
    </div>
  );
};
