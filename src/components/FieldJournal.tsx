import React, { useState } from 'react';
import {
  BookOpen,
  Award,
  Calendar,
  Volume2,
  Trash2,
  ShieldCheck,
  CheckCircle,
  ExternalLink,
  Flame,
} from 'lucide-react';
import { JournalEntry, Badge } from '../types/nature';
import { narrateText } from '../utils/audio';

interface FieldJournalProps {
  entries: JournalEntry[];
  badges: Badge[];
  onClearJournal: () => void;
  onSelectEntry: (entry: JournalEntry) => void;
}

export const FieldJournal: React.FC<FieldJournalProps> = ({
  entries,
  badges,
  onClearJournal,
  onSelectEntry,
}) => {
  const [activeTab, setActiveTab] = useState<'entries' | 'badges'>('entries');
  const [playingId, setPlayingId] = useState<string | null>(null);

  const handlePlayFact = async (entry: JournalEntry) => {
    if (playingId === entry.id) {
      setPlayingId(null);
      return;
    }
    setPlayingId(entry.id);
    await narrateText(
      entry.verification.nature_fact,
      () => setPlayingId(entry.id),
      () => setPlayingId(null),
      () => setPlayingId(null)
    );
  };

  const unlockedBadgesCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-6 space-y-6">
      {/* Journal Header with Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800 w-full">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base sm:text-lg font-bold text-white">My Nature Log</h3>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Your saved nature discoveries and badges
          </p>
        </div>

        {/* Top Badges / Tab Switch */}
        <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
          <div className="flex flex-1 sm:flex-none p-1 bg-neutral-950 rounded-xl border border-neutral-800 text-xs">
            <button
              onClick={() => setActiveTab('entries')}
              className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-lg font-semibold transition text-center ${
                activeTab === 'entries'
                  ? 'bg-emerald-600 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Saved ({entries.length})
            </button>
            <button
              onClick={() => setActiveTab('badges')}
              className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-lg font-semibold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'badges'
                  ? 'bg-emerald-600 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>
                Badges ({unlockedBadgesCount}/{badges.length})
              </span>
            </button>
          </div>

          {entries.length > 0 && activeTab === 'entries' && (
            <button
              onClick={onClearJournal}
              title="Clear journal entries"
              className="p-2 text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 rounded-lg transition cursor-pointer shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tab: Discoveries List */}
      {activeTab === 'entries' && (
        <>
          {entries.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-neutral-500 mb-2.5">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">
                No Saved Finds Yet
              </h4>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                Go outside, pick a quest, snap a photo, and save it to your log!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {entries.map((entry) => {
                const dateStr = new Date(entry.timestamp).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const isPlaying = playingId === entry.id;

                return (
                  <div
                    key={entry.id}
                    className="bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-xl overflow-hidden flex flex-col justify-between group transition"
                  >
                    <div>
                      {/* Image header */}
                      <div className="relative aspect-[16/10] bg-neutral-900 overflow-hidden">
                        <img
                          src={entry.photoDataUrl}
                          alt={entry.questTarget}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                        <div className="absolute top-2 left-2 flex items-center gap-1 bg-neutral-950/80 backdrop-blur text-emerald-300 px-2 py-1 rounded-md text-[11px] font-bold border border-neutral-800">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Verified Outdoor</span>
                        </div>

                        <div className="absolute bottom-2 right-2 bg-neutral-950/80 text-[11px] text-neutral-300 px-2 py-0.5 rounded backdrop-blur border border-neutral-800">
                          {Math.round(entry.verification.confidence_score * 100)}% match
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-3.5 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                              {entry.questTitle}
                            </span>
                            <h4 className="text-sm font-bold text-white capitalize">
                              {entry.verification.detected_target}
                            </h4>
                          </div>
                          <span className="text-[10px] text-neutral-500 whitespace-nowrap">
                            {dateStr}
                          </span>
                        </div>

                        <p className="text-xs text-neutral-300 italic line-clamp-3 bg-neutral-900/60 p-2 rounded-lg border border-neutral-800/60">
                          "{entry.verification.nature_fact}"
                        </p>
                      </div>
                    </div>

                    {/* Footer Audio / Details */}
                    <div className="p-3 pt-0 flex items-center justify-between border-t border-neutral-900">
                      <button
                        onClick={() => handlePlayFact(entry)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 transition ${
                          isPlaying
                            ? 'bg-emerald-500 text-neutral-950'
                            : 'bg-neutral-900 hover:bg-neutral-800 text-emerald-300'
                        }`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{isPlaying ? 'Playing...' : 'Ranger Audio'}</span>
                      </button>

                      <button
                        onClick={() => onSelectEntry(entry)}
                        className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1"
                      >
                        <span>Inspect</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Tab: Badges */}
      {activeTab === 'badges' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-4 rounded-xl border flex items-start gap-3.5 transition ${
                badge.unlocked
                  ? 'bg-gradient-to-br from-emerald-950/50 to-neutral-950 border-emerald-700/60 shadow-md'
                  : 'bg-neutral-950/60 border-neutral-800/80 opacity-60'
              }`}
            >
              <div
                className={`p-3 rounded-xl text-xl ${
                  badge.unlocked
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-neutral-900 text-neutral-500 border border-neutral-800'
                }`}
              >
                {badge.icon}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4
                    className={`text-sm font-bold ${
                      badge.unlocked ? 'text-white' : 'text-neutral-400'
                    }`}
                  >
                    {badge.name}
                  </h4>
                  {badge.unlocked && (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                  {badge.description}
                </p>

                {/* Progress bar */}
                <div className="mt-2.5 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500"
                      style={{
                        width: `${Math.min(
                          100,
                          (badge.currentCount / badge.targetCount) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400">
                    {badge.currentCount}/{badge.targetCount}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
