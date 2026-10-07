import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Smartphone,
  EyeOff,
  Sparkles,
  Camera,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Headphones,
} from 'lucide-react';
import { Quest, VisionVerificationResult } from '../types/nature';
import { narrateText, stopNarration, playShutterSound } from '../utils/audio';

interface ScreenFreeModeProps {
  quest: Quest;
  onExit: () => void;
  onTriggerCapture: () => void;
  lastResult: VisionVerificationResult | null;
  isAnalyzing: boolean;
}

export const ScreenFreeMode: React.FC<ScreenFreeModeProps> = ({
  quest,
  onExit,
  onTriggerCapture,
  lastResult,
  isAnalyzing,
}) => {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [audioMuted, setAudioMuted] = useState<boolean>(false);

  // Announce the quest vocally when entering Screen-Free Mode
  useEffect(() => {
    let cancelFn: (() => void) | undefined;

    if (!audioMuted) {
      const introText = `Nature Go screen-free mode active. Your quest is to find ${quest.target}. Keep your eyes on the outdoor trees, soil, and sky. When you locate your target, tap anywhere on this screen to capture.`;
      narrateText(
        introText,
        () => setIsSpeaking(true),
        () => setIsSpeaking(false),
        () => setIsSpeaking(false)
      ).then((cancel) => {
        cancelFn = cancel;
      });
    }

    return () => {
      cancelFn?.();
      stopNarration();
    };
  }, [quest, audioMuted]);

  // Read verification results aloud automatically
  useEffect(() => {
    if (!lastResult || audioMuted) return;

    let textToSpeak = '';
    if (lastResult.is_valid) {
      textToSpeak = `Outdoor discovery verified! ${lastResult.nature_fact}`;
    } else {
      textToSpeak = `Authenticity warning: ${lastResult.rejection_reason || 'Target not found'}. Make sure you are physically outdoors and not photographing a screen or indoor plant.`;
    }

    narrateText(
      textToSpeak,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      () => setIsSpeaking(false)
    );
  }, [lastResult, audioMuted]);

  const handleScreenTap = () => {
    if (isAnalyzing) return;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
    playShutterSound();
    onTriggerCapture();
  };

  const handleRepeatInstructions = () => {
    const text = `Current quest target: ${quest.target}. ${quest.hints[0] || 'Look closely in nature.'} Tap the screen when ready to photograph.`;
    narrateText(
      text,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      () => setIsSpeaking(false)
    );
  };

  return (
    <div
      onClick={handleScreenTap}
      className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between p-6 select-none cursor-pointer"
    >
      {/* Top Controls Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex items-center justify-between"
      >
        <button
          onClick={onExit}
          className="flex items-center gap-2 px-3 py-2 bg-neutral-900/90 hover:bg-neutral-800 rounded-xl text-neutral-300 text-xs font-semibold border border-neutral-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Pocket Mode</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAudioMuted(!audioMuted)}
            className="p-2.5 bg-neutral-900/90 hover:bg-neutral-800 rounded-xl text-neutral-300 border border-neutral-800"
            title={audioMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {audioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Center Tactical Screen-Free Experience */}
      <div className="flex flex-col items-center justify-center text-center my-auto px-4">
        <div className="relative mb-6">
          <div className="w-32 h-32 rounded-full border-4 border-emerald-500/30 flex items-center justify-center bg-emerald-950/20">
            <Camera className="w-12 h-12 text-emerald-400" />
          </div>
          {isSpeaking && (
            <div className="absolute -inset-3 rounded-full border-2 border-emerald-400/50 animate-ping pointer-events-none" />
          )}
        </div>

        <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-3">
          <Headphones className="w-4 h-4" />
          <span>Pocket Audio Walk Active</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
          Quest: {quest.target}
        </h2>
        <p className="text-sm text-neutral-400 max-w-md mb-6 leading-relaxed">
          Put your device in your pocket or hold by your side. Listen to the natural world. Tap anywhere on the screen to capture when you spot it!
        </p>

        {/* Status display if analyzing or recently evaluated */}
        {isAnalyzing ? (
          <div className="p-4 rounded-2xl bg-neutral-900 border border-emerald-500/50 text-emerald-300 text-sm font-semibold flex items-center gap-2 animate-pulse">
            <Sparkles className="w-4 h-4" />
            <span>Vision Intelligence checking photo...</span>
          </div>
        ) : lastResult ? (
          <div
            className={`p-4 rounded-2xl border text-sm max-w-md ${
              lastResult.is_valid
                ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200'
                : 'bg-rose-950/80 border-rose-600 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1">
              {lastResult.is_valid ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Verified Discovery!</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Outdoor Verification Rejected</span>
                </>
              )}
            </div>
            <p className="text-xs leading-relaxed opacity-90">
              {lastResult.is_valid
                ? lastResult.nature_fact
                : lastResult.rejection_reason}
            </p>
          </div>
        ) : null}
      </div>

      {/* Bottom Large Tap Indicator */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col items-center gap-3 text-center"
      >
        <button
          onClick={handleRepeatInstructions}
          className="text-xs text-emerald-400/90 hover:text-emerald-300 underline underline-offset-4 flex items-center gap-1.5"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Repeat Audio Directions</span>
        </button>

        <p className="text-[11px] text-neutral-500">
          [Tap anywhere on this screen to snap photo]
        </p>
      </div>
    </div>
  );
};
