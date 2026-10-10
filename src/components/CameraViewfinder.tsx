import React, { useRef, useState, useEffect } from 'react';
import {
  Camera,
  RefreshCw,
  Upload,
  Eye,
  ArrowRight,
  X,
  Compass,
  AlertCircle,
  Play,
  Square,
  ShieldCheck,
} from 'lucide-react';
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
  const [isRequestingPermission, setIsRequestingPermission] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Stop camera tracks cleanly
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setIsRequestingPermission(false);
    setCameraError(null);
  };

  // Start camera ONLY upon explicit user action
  const startCamera = async () => {
    setIsRequestingPermission(true);
    setCameraError(null);

    try {
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

      setStream(newStream);
      setCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error && err.name === 'NotAllowedError'
          ? 'Camera permission was not granted. Please allow camera access in your browser or upload a photo instead.'
          : 'Unable to access camera hardware. You can upload a photo or use the 1-click test samples below.';
      setCameraError(errorMsg);
      setCameraActive(false);
    } finally {
      setIsRequestingPermission(false);
    }
  };

  // Switch facing mode if camera is active
  const handleFlipCamera = async () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);

    if (cameraActive) {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: nextMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        setStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        console.warn('Failed to switch camera orientation:', err);
      }
    }
  };

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

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
          <>
            {/* Live Video Stream */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover"
            />

            {/* Viewfinder Overlay with Close Button */}
            <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
              {/* Top Bar with Visible Close Button */}
              <div className="flex items-center justify-between">
                <div className="bg-neutral-950/80 backdrop-blur px-3 py-1.5 rounded-lg border border-neutral-800 text-xs font-medium text-neutral-200 flex items-center gap-2 pointer-events-auto">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Target:</span>
                  <span className="font-bold text-white capitalize">{questTarget}</span>
                </div>

                <div className="flex items-center gap-2 pointer-events-auto">
                  <div className="bg-neutral-950/80 backdrop-blur px-2.5 py-1.5 rounded-lg border border-neutral-800 text-[11px] text-emerald-300 hidden sm:flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Real Nature Check</span>
                  </div>

                  {/* Top-Right Close Button to turn off camera */}
                  <button
                    onClick={stopCamera}
                    className="p-2 bg-neutral-950/90 hover:bg-neutral-800 border border-neutral-700/80 text-neutral-200 hover:text-white rounded-xl transition flex items-center gap-1 text-xs font-bold cursor-pointer shadow-lg"
                    title="Close camera"
                  >
                    <X className="w-4 h-4 text-rose-400" />
                    <span className="hidden sm:inline">Close Camera</span>
                  </button>
                </div>
              </div>

              {/* Center Targeting Reticle */}
              <div className="relative self-center w-52 h-52 sm:w-64 sm:h-64 rounded-2xl border-2 border-dashed border-emerald-400/50 flex flex-col items-center justify-center">
                <div className="absolute -top-1.5 -left-1.5 w-5 h-5 border-t-3 border-l-3 border-emerald-400 rounded-tl" />
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 border-t-3 border-r-3 border-emerald-400 rounded-tr" />
                <div className="absolute -bottom-1.5 -left-1.5 w-5 h-5 border-b-3 border-l-3 border-emerald-400 rounded-bl" />
                <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 border-b-3 border-r-3 border-emerald-400 rounded-br" />

                {isAnalyzing && (
                  <div className="absolute inset-x-0 h-1 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-[bounce_1.5s_infinite]" />
                )}

                <div className="text-center px-4">
                  <p className="text-xs font-bold text-white drop-shadow">
                    Aim at {questTarget}
                  </p>
                  <p className="text-[11px] text-neutral-300/90 drop-shadow mt-0.5">
                    Keep photo clear in natural light
                  </p>
                </div>
              </div>

              {/* Bottom Info Bar */}
              <div className="flex items-center justify-between text-[11px] text-neutral-300 pointer-events-auto">
                <span className="bg-neutral-950/80 px-2.5 py-1 rounded-md backdrop-blur border border-neutral-800 font-medium">
                  {questTitle}
                </span>

                <button
                  onClick={stopCamera}
                  className="sm:hidden bg-neutral-950/90 border border-neutral-800 text-rose-300 px-2.5 py-1 rounded-md flex items-center gap-1 font-semibold"
                >
                  <Square className="w-3 h-3 text-rose-400" />
                  <span>Stop</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          /* User-Friendly Quest Briefing (Standby Mode) */
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-950">
            <div className="w-14 h-14 rounded-2xl bg-emerald-950/90 border border-emerald-700/60 text-emerald-400 flex items-center justify-center mb-3 shadow-lg">
              <Camera className="w-7 h-7" />
            </div>

            <h3 className="text-white font-bold text-lg sm:text-xl mb-1 max-w-md">
              Find <span className="text-emerald-400 capitalize">{questTarget}</span> outside
            </h3>

            <p className="text-neutral-400 text-xs max-w-sm mb-4 leading-relaxed">
              Spot it in nature, then tap below to take a photo or upload one.
            </p>

            {/* Camera Permission / Error Alert if any */}
            {cameraError && (
              <div className="mb-4 max-w-md p-3 bg-rose-950/60 border border-rose-800/80 text-rose-300 rounded-xl text-xs flex items-start gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <p className="leading-relaxed">{cameraError}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={startCamera}
                disabled={isRequestingPermission}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition shadow-lg shadow-emerald-950 cursor-pointer active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{isRequestingPermission ? 'Opening...' : 'Start Camera'}</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl font-semibold text-sm flex items-center gap-2 transition cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Photo</span>
              </button>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
            <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin mb-3" />
            <h4 className="text-white font-bold text-base mb-1">
              Checking your photo...
            </h4>
            <p className="text-neutral-400 text-xs max-w-xs">
              Looking for outdoor nature and daylight
            </p>
          </div>
        )}
      </div>

      {/* Main Action Bar */}
      <div className="flex items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 p-2.5 sm:p-3 rounded-2xl">
        {/* Flip or Status */}
        {cameraActive ? (
          <button
            onClick={handleFlipCamera}
            disabled={isAnalyzing}
            title="Flip camera"
            className="p-3 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-neutral-200 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Flip</span>
          </button>
        ) : (
          <button
            onClick={startCamera}
            disabled={isRequestingPermission}
            className="p-3 bg-neutral-800 hover:bg-neutral-700 text-emerald-400 rounded-xl transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">Camera</span>
          </button>
        )}

        {/* Primary Shutter or Start Button */}
        {cameraActive ? (
          <button
            onClick={capturePhoto}
            disabled={isAnalyzing}
            className="flex-1 max-w-sm py-3.5 px-6 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition cursor-pointer active:scale-98"
          >
            <Camera className="w-4 h-4" />
            <span>Take Photo</span>
          </button>
        ) : (
          <button
            onClick={startCamera}
            disabled={isRequestingPermission}
            className="flex-1 max-w-sm py-3 px-6 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 text-white rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition cursor-pointer active:scale-98"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Start Camera</span>
          </button>
        )}

        {/* Exit Camera or Upload Photo */}
        {cameraActive ? (
          <button
            onClick={stopCamera}
            title="Close camera"
            className="p-3 bg-neutral-800 hover:bg-rose-950/60 hover:text-rose-300 text-neutral-200 rounded-xl transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <X className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">Close</span>
          </button>
        ) : (
          <>
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
              title="Upload photo"
              className="p-3 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-neutral-200 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </button>
          </>
        )}
      </div>

      {/* Demo Samples */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Try a Demo Photo</span>
              <span className="text-[11px] text-neutral-400 font-normal">
                (Instant test, no camera needed)
              </span>
            </h4>
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
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span
                      className={`font-bold ${
                        isValid ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {isValid ? '✓ Real Nature' : '✕ Fake / Screen'}
                    </span>
                    <span className="text-neutral-500 capitalize text-[10px]">
                      {scenario.assignedTarget}
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                    {scenario.name}
                  </h5>
                  <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                    {scenario.description}
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-neutral-900 flex items-center justify-between text-[11px] text-emerald-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                  <span>Test photo</span>
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
