import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Volume2,
  VolumeX,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  BookOpen,
  RotateCcw,
  Code,
  ArrowRight,
} from 'lucide-react';
import { VisionVerificationResult } from '../types/nature';
import { narrateText, stopNarration } from '../utils/audio';

interface VerificationCardProps {
  questTarget: string;
  result: VisionVerificationResult;
  capturedImageUrl: string;
  onSaveToJournal: () => void;
  onRetake: () => void;
  isSaved: boolean;
  autoPlayAudio?: boolean;
  isRepeatRun?: boolean;
  repeatCount?: number;
  onNextQuest?: () => void;
}

export const VerificationCard: React.FC<VerificationCardProps> = ({
  questTarget,
  result,
  capturedImageUrl,
  onSaveToJournal,
  onRetake,
  isSaved,
  autoPlayAudio = true,
  isRepeatRun = false,
  repeatCount = 0,
  onNextQuest,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [showRawJson, setShowRawJson] = useState<boolean>(false);

  useEffect(() => {
    let cancelFn: (() => void) | undefined;

    if (autoPlayAudio && result.nature_fact) {
      narrateText(
        result.nature_fact,
        () => setIsPlayingAudio(true),
        () => setIsPlayingAudio(false),
        () => setIsPlayingAudio(false)
      ).then((cancel) => {
        cancelFn = cancel;
      });
    }

    return () => {
      cancelFn?.();
      stopNarration();
    };
  }, [result, autoPlayAudio]);

  const toggleAudio = async () => {
    if (isPlayingAudio) {
      stopNarration();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      await narrateText(
        result.nature_fact,
        () => setIsPlayingAudio(true),
        () => setIsPlayingAudio(false),
        () => setIsPlayingAudio(false)
      );
    }
  };

  const confidencePercent = Math.round((result.confidence_score || 0) * 100);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl transition w-full">
      {/* Status Header */}
      <div
        className={`p-3.5 sm:p-5 flex items-center justify-between border-b gap-2 ${
          result.is_valid
            ? 'bg-emerald-950/40 border-emerald-900/60'
            : 'bg-amber-950/30 border-amber-900/40'
        }`}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
              result.is_valid
                ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700/60'
                : 'bg-amber-900/40 text-amber-400 border border-amber-700/50'
            }`}
          >
            {result.is_valid ? (
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
              <span
                className={`font-bold ${
                  result.is_valid ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {result.is_valid ? '✓ Verified Nature Find' : 'Check Needed'}
              </span>
              <span className="text-neutral-500">·</span>
              <span className="text-neutral-400">{confidencePercent}% Match</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white mt-0.5 truncate">
              {result.is_valid
                ? `You found a real ${result.detected_target}!`
                : result.rejection_reason || 'Could not verify target'}
            </h3>
          </div>
        </div>

        <button
          onClick={onRetake}
          className="p-1.5 sm:p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition cursor-pointer shrink-0"
          title="Try another photo"
        >
          <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Photo View */}
        <div className="md:col-span-5 flex flex-col gap-2">
          <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-neutral-950 border border-neutral-800">
            <img
              src={capturedImageUrl}
              alt="Nature capture"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 right-2 bg-neutral-950/80 backdrop-blur px-2.5 py-1.5 rounded-lg text-xs text-neutral-300 flex items-center justify-between border border-neutral-800">
              <span className="truncate">Quest: {questTarget}</span>
              <span className="text-emerald-400 font-semibold truncate ml-1">
                Found: {result.detected_target}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Evaluation & Ranger Narration */}
        <div className="md:col-span-7 flex flex-col justify-between gap-3">
          <div className="space-y-3">
            {/* 3 Quick Checks */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-neutral-950/80 p-2.5 rounded-xl border border-neutral-800">
                <span className="text-neutral-400 block text-[10px] mb-0.5">
                  Target
                </span>
                <div className="flex items-center gap-1 font-bold">
                  {result.is_valid ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-white text-xs">Found</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-neutral-300 text-xs">Mismatch</span>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-neutral-950/80 p-2.5 rounded-xl border border-neutral-800">
                <span className="text-neutral-400 block text-[10px] mb-0.5">
                  Real Nature
                </span>
                <div className="flex items-center gap-1 font-bold">
                  {result.is_valid ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-white text-xs">Real</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-neutral-300 text-xs truncate">
                        {result.rejection_reason?.includes('Screen')
                          ? 'Screen'
                          : result.rejection_reason?.includes('Indoor')
                          ? 'Indoor'
                          : 'Not Real'}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-neutral-950/80 p-2.5 rounded-xl border border-neutral-800">
                <span className="text-neutral-400 block text-[10px] mb-0.5">
                  Lighting
                </span>
                <div className="flex items-center gap-1 font-bold">
                  {result.is_valid ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-white text-xs">Daylight</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-neutral-300 text-xs">Needs Sun</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Nature Fun Fact */}
            <div className="bg-gradient-to-br from-emerald-950/30 to-neutral-950 p-3.5 rounded-xl border border-emerald-900/50">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Nature Fun Fact</span>
                </div>

                <button
                  onClick={toggleAudio}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    isPlayingAudio
                      ? 'bg-emerald-500 text-neutral-950 shadow'
                      : 'bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-800/80'
                  }`}
                >
                  {isPlayingAudio ? (
                    <>
                      <VolumeX className="w-3 h-3" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3 h-3" />
                      <span>Listen</span>
                    </>
                  )}
                </button>
              </div>

              {isPlayingAudio && (
                <div className="flex items-center gap-1 h-2.5 mb-1.5">
                  <span className="w-1 bg-emerald-400 h-full rounded-full animate-[pulse_0.4s_infinite]" />
                  <span className="w-1 bg-emerald-300 h-2/3 rounded-full animate-[pulse_0.6s_infinite]" />
                  <span className="w-1 bg-emerald-400 h-full rounded-full animate-[pulse_0.5s_infinite]" />
                  <span className="w-1 bg-emerald-200 h-1/2 rounded-full animate-[pulse_0.3s_infinite]" />
                  <span className="w-1 bg-emerald-400 h-4/5 rounded-full animate-[pulse_0.7s_infinite]" />
                </div>
              )}

              <p className="text-xs text-neutral-200 leading-relaxed italic">
                "{result.nature_fact}"
              </p>
            </div>

            {/* Helpful advice if rejected */}
            {!result.is_valid && (
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-900/40 text-xs text-amber-200">
                <p className="font-semibold mb-0.5">Quick Tip:</p>
                <p className="text-amber-300/90 leading-relaxed text-[11px]">
                  {result.rejection_reason === 'null' || !result.rejection_reason
                    ? 'Take your photo outside in natural daylight facing real plants, soil, or sky.'
                    : result.rejection_reason}
                </p>
              </div>
            )}

            {/* Saved Confirmation Banner */}
            {isSaved && (
              <div className="p-2.5 sm:p-3 bg-emerald-950/70 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    {isRepeatRun
                      ? `✓ Completed again (Run #${repeatCount + 1})! Saved to Nature Log.`
                      : '✓ Quest Completed! Recorded in your Nature Log.'}
                  </span>
                </div>
                {onNextQuest && (
                  <button
                    onClick={onNextQuest}
                    className="w-full sm:w-auto px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition cursor-pointer text-center shadow-xs"
                  >
                    Next Quest →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 pt-1 w-full">
            {result.is_valid && (
              <button
                onClick={onSaveToJournal}
                disabled={isSaved}
                className="w-full sm:flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
              >
                <BookOpen className="w-4 h-4" />
                <span>{isSaved ? 'Saved to Journal ✓' : 'Save to My Journal'}</span>
              </button>
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={onRetake}
                className="flex-1 sm:flex-none py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Try Another</span>
              </button>

              <button
                onClick={() => setShowRawJson(!showRawJson)}
                className="p-2.5 text-neutral-400 hover:text-neutral-200 bg-neutral-950 hover:bg-neutral-800 rounded-xl transition border border-neutral-800 text-xs flex items-center justify-center gap-1 cursor-pointer"
                title="View JSON Details"
              >
                <Code className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showRawJson && (
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 text-xs font-mono">
          <p className="text-neutral-400 mb-2">Strict JSON Output Schema:</p>
          <pre className="bg-neutral-900 p-3 rounded-lg overflow-x-auto text-emerald-300 text-[11px] leading-relaxed">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
