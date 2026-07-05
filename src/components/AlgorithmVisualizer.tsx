import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, SkipForward, SkipBack, RotateCcw, Sliders, Info, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AnimationData, AnimationStep } from "../types";

interface AlgorithmVisualizerProps {
  animationType: string;
  animationData: AnimationData;
}

export default function AlgorithmVisualizer({ animationType, animationData }: AlgorithmVisualizerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1500); // ms per step
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { title, elements, steps } = animationData;
  const totalSteps = steps.length;
  const step: AnimationStep = steps[currentStep] || steps[0];

  useEffect(() => {
    // Reset when problem changes
    setCurrentStep(0);
    setIsPlaying(false);
  }, [animationData]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playSpeed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playSpeed, totalSteps]);

  const handlePlayPause = () => {
    if (currentStep >= totalSteps - 1) {
      setCurrentStep(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    setIsPlaying(false);
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    setIsPlaying(false);
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  // Helper to determine if an index is pointed to by any pointer
  const getPointersForIndex = (index: number) => {
    if (!step.pointers) return [];
    return Object.entries(step.pointers)
      .filter(([_, ptrIndex]) => ptrIndex === index)
      .map(([name, _]) => name);
  };

  // Assign distinct colors to different pointers
  const getPointerColor = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("left") || n.includes("start") || n === "l") return "bg-emerald-500 text-white";
    if (n.includes("right") || n.includes("end") || n === "r") return "bg-rose-500 text-white";
    if (n.includes("mid") || n === "m") return "bg-amber-500 text-white";
    if (n.includes("slow") || n.includes("i")) return "bg-blue-500 text-white";
    if (n.includes("fast") || n.includes("j")) return "bg-violet-500 text-white";
    return "bg-slate-500 text-white";
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col h-full shadow-inner">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-mono text-cyan-400 font-bold bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-900/30">
            {animationType.replace("_", " ")} Animation
          </span>
          <h4 className="text-sm font-semibold text-slate-100 font-display mt-1">
            {title}
          </h4>
        </div>
        <div className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800/60">
          Step {currentStep + 1} of {totalSteps}
        </div>
      </div>

      {/* Visual Workspace Canvas */}
      <div className="flex-1 min-h-[180px] bg-slate-950/60 rounded-xl p-4 flex flex-col justify-center relative overflow-hidden border border-slate-950">
        
        {/* Decorative Grid lines to enhance tech visualizer vibe */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:16px_16px]"></div>

        {/* Pointer indicator Row - Above the elements */}
        <div className="flex justify-center gap-3 md:gap-4 mb-2 min-h-[28px]">
          {elements.map((_, idx) => {
            const indexPointers = getPointersForIndex(idx);
            return (
              <div key={`ptr-top-${idx}`} className="w-11 md:w-14 flex flex-col items-center justify-end">
                {indexPointers.map((p) => (
                  <motion.div
                    key={`ptr-${p}`}
                    layoutId={`ptr-icon-${p}`}
                    className={`text-[9px] font-mono px-1 py-0.5 rounded uppercase font-bold text-center tracking-tight truncate shadow-sm max-w-full ${getPointerColor(p)}`}
                    initial={{ y: -5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  >
                    {p}
                  </motion.div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Element Box Row */}
        <div className="flex justify-center gap-3 md:gap-4 items-center">
          {elements.map((elem, idx) => {
            const isHighlighted = step.highlightedIndexes?.includes(idx);
            const indexPointers = getPointersForIndex(idx);
            const hasPointers = indexPointers.length > 0;

            return (
              <div key={`elem-container-${idx}`} className="flex flex-col items-center relative">
                {/* Visual Arrow above boxes if pointer hits */}
                {hasPointers && (
                  <motion.div
                    layoutId={`arrow-${idx}`}
                    className="absolute -top-3 text-cyan-400"
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                  >
                    ↓
                  </motion.div>
                )}

                <motion.div
                  className={`w-11 h-11 md:w-14 md:h-14 rounded-xl flex items-center justify-center font-mono font-semibold md:text-base text-sm transition-all shadow-md relative ${
                    isHighlighted
                      ? "bg-cyan-950 border-2 border-cyan-400 text-cyan-300 shadow-cyan-950/50"
                      : "bg-slate-800 border border-slate-700 text-slate-300"
                  }`}
                  animate={{
                    scale: isHighlighted ? 1.05 : 1,
                    boxShadow: isHighlighted ? "0 0 12px rgba(34, 211, 238, 0.2)" : "none",
                  }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                >
                  {elem}
                  <span className="absolute bottom-0.5 right-1 text-[8px] font-mono text-slate-500">
                    {idx}
                  </span>
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* Index pointers underneath - if needed */}
        <div className="min-h-[14px]"></div>
      </div>

      {/* Playback Controls & Progress Bar */}
      <div className="mt-4 space-y-4">
        {/* Timeline Slider Progress */}
        <div className="space-y-1">
          <div className="relative h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            ></div>
            <input
              type="range"
              min="0"
              max={totalSteps - 1}
              value={currentStep}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentStep(parseInt(e.target.value));
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Dynamic step instruction card */}
        <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/70 flex gap-2.5 items-start">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-300 leading-relaxed font-sans select-none">
            {step.note}
          </p>
        </div>

        {/* Variable Tracker Monitors */}
        {step.variables && step.variables.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/40">
            {step.variables.map((v, i) => (
              <div key={`var-${i}`} className="bg-slate-900/50 p-2 rounded border border-slate-800/50 flex flex-col">
                <span className="text-[9px] font-mono uppercase text-slate-500 tracking-wider">
                  {v.name}
                </span>
                <span className="text-xs font-mono font-medium text-slate-200 mt-0.5 truncate">
                  {v.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Action Button Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/50">
          <div className="flex items-center gap-1">
            <button
              onClick={handleReset}
              disabled={currentStep === 0}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 hover:text-slate-100 transition-colors"
              title="Reset Timeline"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 hover:text-slate-100 transition-colors"
              title="Previous Step"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={handlePlayPause}
              className={`p-2 rounded-lg flex items-center justify-center font-semibold text-xs gap-1.5 transition-colors ${
                isPlaying 
                  ? "bg-amber-600 hover:bg-amber-500 text-white" 
                  : "bg-cyan-600 hover:bg-cyan-500 text-white"
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? "Pause" : "Play"}</span>
            </button>
            <button
              onClick={handleNext}
              disabled={currentStep === totalSteps - 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 hover:text-slate-100 transition-colors"
              title="Next Step"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Speed scrubber */}
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono bg-slate-950 px-2 py-1 rounded-md border border-slate-800">
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Speed:</span>
            <select
              value={playSpeed}
              onChange={(e) => setPlaySpeed(parseInt(e.target.value))}
              className="bg-transparent text-cyan-400 focus:outline-none cursor-pointer text-xs font-semibold"
            >
              <option value="2500">0.4x (Slow)</option>
              <option value="1500">1.0x (Normal)</option>
              <option value="800">1.8x (Fast)</option>
              <option value="400">3.0x (Turbo)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
