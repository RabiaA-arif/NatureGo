import React from 'react';
import {
  CheckCircle,
  RotateCcw,
  Compass,
  X,
  Sparkles,
  Leaf,
  ArrowRight,
} from 'lucide-react';
import { Quest, CompletedQuestRecord } from '../types/nature';

interface RepeatQuestModalProps {
  isOpen: boolean;
  quest: Quest | null;
  completionRecord?: CompletedQuestRecord | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const RepeatQuestModal: React.FC<RepeatQuestModalProps> = ({
  isOpen,
  quest,
  completionRecord,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen || !quest) return null;

  const timesCompleted = completionRecord?.count || 1;
  const lastTimeStr = completionRecord?.lastCompletedAt
    ? new Date(completionRecord.lastCompletedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl sm:rounded-3xl w-full max-w-md max-h-[94vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-3.5 sm:p-5 pb-2.5 sm:pb-3 flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-950 border border-emerald-800/80 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">Quest Completed</h3>
              <p className="text-[11px] sm:text-xs text-neutral-400 truncate">Confirmation to repeat</p>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="p-1.5 sm:p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quest Info Card */}
        <div className="p-3.5 sm:p-5 space-y-3 sm:space-y-4">
          <div className="p-3 sm:p-3.5 bg-neutral-950 rounded-2xl border border-neutral-800 flex items-start gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-900/40 border border-emerald-700/60 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <Leaf className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <h4 className="text-sm font-bold text-white truncate">{quest.title}</h4>
                <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 shrink-0">
                  ✓ Done {timesCompleted} {timesCompleted === 1 ? 'time' : 'times'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{quest.description}</p>
              {lastTimeStr && (
                <p className="text-[10px] sm:text-[11px] text-neutral-500 mt-1">
                  Last verified: {lastTimeStr}
                </p>
              )}
            </div>
          </div>

          <div className="p-3 bg-neutral-950/70 border border-neutral-800/80 rounded-xl text-xs text-neutral-300 leading-relaxed">
            <p className="font-semibold text-white mb-1">
              Do you want to complete this quest a second time?
            </p>
            <p className="text-neutral-400 text-[11px]">
              You can repeat any completed quest to find another specimen, test a new angle, or practice outdoor observation. Your previous completion is safely recorded in your journal!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold transition cursor-pointer text-center"
            >
              Choose Another Quest
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Yes, Repeat Quest</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
