import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Upload, Sparkles, Eye, Compass, ArrowRight } from 'lucide-react';
import { TEST_SCENARIOS, TestScenario } from '../utils/sampleImages';
import { playShutterSound } from '../utils/audio';

interface CameraViewfinderProps {
  questTarget: string;
  questTitle: string;
  onImageCaptured: (dataUrl: string, mimeType: string, scenarioId?: string) => void;
  isAnalyzing: boolean;
}

export const CameraViewfinder: React.FC<CameraViewfinderProps> = ({
  questTarget,
  questTitle,
  onImageCaptured,
  isAnalyzing,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function initCamera() {
      try {
        setCameraError(null);
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }

        const newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (!active) {
          newStream.getTracks().forEach((track) => track.stop());
          return;
        }

        setStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          videoRef.current.play().catch(() => {});
        }
        setCameraActive(true);
      } catch (err: unknown) {
        setCameraError(
          'Camera access not active. You can snap using the Upload button or test 1-click demos below!'
        );
        setCameraActive(false);
      }
    }

    initCamera();

    return () => {
      active = false;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    playShutterSound();

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      onImageCaptured(dataUrl, 'image/jpeg');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    playShutterSound();
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onImageCaptured(dataUrl, file.type || 'image/jpeg');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleTestScenario = (scenario: TestScenario) => {
    playShutterSound();
    const dataUrl = scenario.generateDataUrl();
    onImageCaptured(dataUrl, 'image/jpeg', scenario.id);
  };

  return (
    <div className="space-y-4">
      {/* Viewfinder Frame */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-neutral-900 rounded-2xl overflow-hidden shadow-xl border border-neutral-800">
        <canvas ref={canvasRef} className="hidden" />

        {cameraActive ? (
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-neutral-900 to-neutral-950">
            <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 flex items-center justify-center mb-3">
              <Camera className="w-7 h-7" />
            </div>
            <h3 className="text-white font-bold text-base mb-1">
              Ready to Explore Nature?
            </h3>
            <p className="text-neutral-400 text-xs max-w-sm mb-4 leading-relaxed">
              Snap a photo of <span className="text-emerald-300 font-semibold">{questTarget}</span> outdoors, upload a picture, or try an instant 1-click demo below.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-md"
              >
                <Upload className="w-4 h-4" />
                Upload Outdoor Photo
              </button>
            </div>
          </div>
        )}

        {/* Viewfinder Overlay */}
        <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <div className="bg-neutral-950/80 backdrop-blur px-3 py-1.5 rounded-lg border border-neutral-800 text-xs font-medium text-neutral-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Target:</span>
              <span className="font-bold text-white capitalize">{questTarget}</span>
            </div>

            <div className="bg-neutral-950/80 backdrop-blur px-2.5 py-1.5 rounded-lg border border-neutral-800 text-[11px] text-emerald-300 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>Outdoor Anti-Spoof Active</span>
            </div>
          </div>

          {/* Center Targeting Box */}
          <div className="relative self-center w-52 h-52 sm:w-64 sm:h-64 rounded-2xl border-2 border-dashed border-emerald-400/50 flex flex-col items-center justify-center">
            {/* Corner Markers */}
            <div className="absolute -top-1.5 -left-1.5 w-5 h-5 border-t-3 border-l-3 border-emerald-400 rounded-tl" />
            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 border-t-3 border-r-3 border-emerald-400 rounded-tr" />
            <div className="absolute -bottom-1.5 -left-1.5 w-5 h-5 border-b-3 border-l-3 border-emerald-400 rounded-bl" />
            <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 border-b-3 border-r-3 border-emerald-400 rounded-br" />

            {isAnalyzing && (
              <div className="absolute inset-x-0 h-1 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-[bounce_1.5s_infinite]" />
            )}

            <div className="text-center px-4">
              <p className="text-xs font-bold text-white drop-shadow">
                Aim at real {questTarget}
              </p>
              <p className="text-[11px] text-neutral-300/90 drop-shadow mt-0.5">
                Physical outdoor object in natural daylight
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex items-center justify-between text-[11px] text-neutral-300">
            <span className="bg-neutral-950/80 px-2.5 py-1 rounded-md backdrop-blur border border-neutral-800">
              Quest: {questTitle}
            </span>
            <span className="bg-neutral-950/80 px-2.5 py-1 rounded-md backdrop-blur border border-neutral-800 text-emerald-300">
              No screens or plastic
            </span>
          </div>
        </div>

        {/* Loading Overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
            <div className="w-14 h-14 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin mb-3" />
            <h4 className="text-white font-bold text-base mb-1">
              Analyzing Outdoor Discovery...
            </h4>
            <p className="text-neutral-400 text-xs max-w-xs leading-relaxed">
              Verifying real outdoor nature, checking sunlight & soil, and running anti-spoof checks.
            </p>
          </div>
        )}
      </div>

      {/* Main Action Bar */}
      <div className="flex items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 p-3 rounded-2xl">
        <button
          onClick={handleFlipCamera}
          disabled={!cameraActive || isAnalyzing}
          title="Flip camera"
          className="p-3 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-neutral-200 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">Flip</span>
        </button>

        {/* Primary Big Shutter Button */}
        <button
          onClick={capturePhoto}
          disabled={!cameraActive || isAnalyzing}
          className="flex-1 max-w-sm py-3.5 px-6 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition cursor-pointer active:scale-98"
        >
          <Camera className="w-4 h-4" />
          <span>Snap Photo to Verify</span>
        </button>

        {/* Upload Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isAnalyzing}
          title="Upload outdoor photo"
          className="p-3 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-neutral-200 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Upload Photo</span>
        </button>
      </div>

      {/* 1-Click Interactive Demos (Friendly for new users) */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Try a 1-Click Demo</span>
              <span className="text-[11px] text-emerald-400 font-normal">
                (Instant sample, no camera needed)
              </span>
            </h4>
            <p className="text-xs text-neutral-400 mt-0.5">
              Click any sample below to see how our Vision Intelligence evaluates real nature vs. spoofs:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {TEST_SCENARIOS.map((scenario) => {
            const isValid = scenario.expectedResult === 'valid';
            return (
              <button
                key={scenario.id}
                onClick={() => handleTestScenario(scenario)}
                disabled={isAnalyzing}
                className="group text-left p-3 rounded-xl border border-neutral-800 hover:border-emerald-600/60 bg-neutral-950/80 hover:bg-neutral-950 transition flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span
                      className={`font-semibold ${
                        isValid ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {isValid ? '✓ Authentic Nature' : '✗ Spoof Test'}
                    </span>
                    <span className="text-neutral-500 capitalize">
                      {scenario.assignedTarget}
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                    {scenario.name}
                  </h5>
                  <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                    {scenario.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-neutral-900 flex items-center justify-between text-[11px] text-emerald-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                  <span>Test this sample</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
