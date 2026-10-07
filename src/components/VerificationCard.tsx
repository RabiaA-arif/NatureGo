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
}

export const VerificationCard: React.FC<VerificationCardProps> = ({
  questTarget,
  result,
  capturedImageUrl,
  onSaveToJournal,
  onRetake,
  isSaved,
  autoPlayAudio = true,
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
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl transition">
      {/* Status Header */}
      <div
        className={`p-4 sm:p-5 flex items-center justify-between border-b ${
          result.is_valid
            ? 'bg-emerald-950/40 border-emerald-900/60'
            : 'bg-amber-950/30 border-amber-900/40'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center ${
              result.is_valid
                ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700/60'
                : 'bg-amber-900/40 text-amber-400 border border-amber-700/50'
            }`}
          >
            {result.is_valid ? (
              <ShieldCheck className="w-6 h-6" />
            ) : (
              <ShieldAlert className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`font-bold ${
                  result.is_valid ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {result.is_valid ? 'Verified Outdoor Discovery' : 'Outdoor Check Not Met'}
              </span>
              <span className="text-neutral-500">·</span>
              <span className="text-neutral-400">Confidence {confidencePercent}%</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
              {result.is_valid
                ? `You found a real ${result.detected_target}!`
                : result.rejection_reason || 'Target Missing'}
            </h3>
          </div>
        </div>

        <button
          onClick={onRetake}
          className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition"
          title="Try another photo"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Photo View */}
        <div className="md:col-span-5 flex flex-col gap-3">
          <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-neutral-950 border border-neutral-800">
            <img
              src={capturedImageUrl}
              alt="Nature capture"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 right-2 bg-neutral-950/80 backdrop-blur px-2.5 py-1.5 rounded-lg text-xs text-neutral-300 flex items-center justify-between border border-neutral-800">
              <span className="truncate">Target: {questTarget}</span>
              <span className="text-emerald-400 font-medium truncate ml-1">
                Detected: {result.detected_target}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Evaluation & Ranger Narration */}
        <div className="md:col-span-7 flex flex-col justify-between gap-4">
          <div className="space-y-4">
            {/* 3 Clear Verification Criteria Checks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {/* Check 1 */}
              <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-800">
                <span className="text-neutral-400 block text-[11px] mb-1">
                  1. Target Match
                </span>
                <div className="flex items-center gap-1.5 font-bold">
                  {result.is_valid ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-white">Target Found</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-amber-400" />
                      <span className="text-neutral-300">Mismatch</span>
                    </>
                  )}
                </div>
              </div>

              {/* Check 2 */}
              <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-800">
                <span className="text-neutral-400 block text-[11px] mb-1">
                  2. Physical Authenticity
                </span>
                <div className="flex items-center gap-1.5 font-bold">
                  {result.is_valid ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-white">Real Live Nature</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-amber-400" />
                      <span className="text-neutral-300 truncate">
                        {result.rejection_reason?.includes('Screen')
                          ? 'Screen Spoof'
                          : result.rejection_reason?.includes('Indoor')
                          ? 'Indoor Plant'
                          : 'Not Real Nature'}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Check 3 */}
              <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-800">
                <span className="text-neutral-400 block text-[11px] mb-1">
                  3. Outdoor Context
                </span>
                <div className="flex items-center gap-1.5 font-bold">
                  {result.is_valid ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-white">Outdoor Daylight</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-amber-400" />
                      <span className="text-neutral-300">Indoor Light</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Ranger Voice Narration Box */}
            <div className="bg-gradient-to-br from-emerald-950/30 to-neutral-950 p-4 rounded-xl border border-emerald-900/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <Sparkles className="w-4 h-4" />
                  <span>Ranger Field Fact</span>
                </div>

                <button
                  onClick={toggleAudio}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                    isPlayingAudio
                      ? 'bg-emerald-500 text-neutral-950 shadow'
                      : 'bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-800/80'
                  }`}
                >
                  {isPlayingAudio ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>Stop Voice</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Listen to Ranger</span>
                    </>
                  )}
                </button>
              </div>

              {isPlayingAudio && (
                <div className="flex items-center gap-1 h-3 mb-2">
                  <span className="w-1 bg-emerald-400 h-full rounded-full animate-[pulse_0.4s_infinite]" />
                  <span className="w-1 bg-emerald-300 h-2/3 rounded-full animate-[pulse_0.6s_infinite]" />
                  <span className="w-1 bg-emerald-400 h-full rounded-full animate-[pulse_0.5s_infinite]" />
                  <span className="w-1 bg-emerald-200 h-1/2 rounded-full animate-[pulse_0.3s_infinite]" />
                  <span className="w-1 bg-emerald-400 h-4/5 rounded-full animate-[pulse_0.7s_infinite]" />
                </div>
              )}

              <p className="text-sm text-neutral-200 leading-relaxed italic">
                "{result.nature_fact}"
              </p>
            </div>

            {/* Helpful advice if rejected */}
            {!result.is_valid && (
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/40 text-xs text-amber-200">
                <p className="font-bold mb-1">Friendly Explorer Tip:</p>
                <p className="text-amber-300/90 leading-relaxed">
                  {result.rejection_reason === 'null' || !result.rejection_reason
                    ? 'Step physically outdoors into the sunlight to find the real nature object!'
                    : result.rejection_reason}
                </p>
                <p className="text-neutral-400 mt-1.5 text-[11px]">
                  Nature Go is designed to get us outdoors—it automatically filters out computer screens, living room potted plants, and plastic toys.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {result.is_valid && (
              <button
                onClick={onSaveToJournal}
                disabled={isSaved}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
              >
                <BookOpen className="w-4 h-4" />
                <span>{isSaved ? 'Saved in Field Journal ✓' : 'Save to My Journal'}</span>
              </button>
            )}

            <button
              onClick={onRetake}
              className="py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Explore Another</span>
            </button>

            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="p-3 text-neutral-400 hover:text-neutral-200 bg-neutral-950 hover:bg-neutral-800 rounded-xl transition border border-neutral-800 text-xs flex items-center gap-1.5"
              title="Inspect raw JSON"
            >
              <Code className="w-4 h-4" />
              <span className="hidden sm:inline">JSON Data</span>
            </button>
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
