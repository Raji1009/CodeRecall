import React, { useState, useEffect, useRef } from "react";
import { 
  Play, CheckCircle2, Mic, Square, Trash2, ArrowRight, RefreshCw, 
  Sparkles, Code, FileText, ChevronRight, Volume2, AlertTriangle, HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ProblemPackage } from "../types";

interface LeetCodeSandboxProps {
  onProblemProcessed: (newProblem: ProblemPackage) => void;
}

interface SandboxProblem {
  title: string;
  leetcodeId: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
  description: string;
  starterCode: string;
  sampleInput: string;
  sampleOutput: string;
}

const PRESET_PROBLEMS: SandboxProblem[] = [
  {
    title: "Container With Most Water",
    leetcodeId: "11",
    difficulty: "Medium",
    tags: ["Two Pointers", "Array", "Greedy"],
    description: `You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]).

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Return the maximum amount of water a container can store.

Notice that you may not slant the container.`,
    sampleInput: "height = [1,8,6,2,5,4,8,3,7]",
    sampleOutput: "49",
    starterCode: `function maxArea(height: number[]): number {
    let maxWater = 0;
    let left = 0;
    let right = height.length - 1;
    
    while (left < right) {
        const width = right - left;
        const currentArea = Math.min(height[left], height[right]) * width;
        maxWater = Math.max(maxWater, currentArea);
        
        // Move the pointer pointing to the shorter line
        if (height[left] < height[right]) {
            left++;
        } else {
            right--;
        }
    }
    
    return maxWater;
}`
  },
  {
    title: "Binary Search",
    leetcodeId: "704",
    difficulty: "Easy",
    tags: ["Binary Search", "Array"],
    description: `Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.

You must write an algorithm with O(log n) runtime complexity.`,
    sampleInput: "nums = [-1,0,3,5,9,12], target = 9",
    sampleOutput: "4 (index of 9)",
    starterCode: `function search(nums: number[], target: number): number {
    let low = 0;
    let high = nums.length - 1;
    
    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        
        if (nums[mid] === target) {
            return mid; // Found element
        } else if (nums[mid] < target) {
            low = mid + 1; // Narrow search space to right half
        } else {
            high = mid - 1; // Narrow search space to left half
        }
    }
    
    return -1; // Not found
}`
  },
  {
    title: "Longest Substring Without Repeating Characters",
    leetcodeId: "3",
    difficulty: "Medium",
    tags: ["Sliding Window", "Hash Table", "String"],
    description: `Given a string s, find the length of the longest substring without repeating characters.`,
    sampleInput: 's = "abcabcbb"',
    sampleOutput: "3 (substring is 'abc')",
    starterCode: `function lengthOfLongestSubstring(s: string): number {
    let maxLength = 0;
    let left = 0;
    const seenChars = new Set<string>();
    
    for (let right = 0; right < s.length; right++) {
        // Shrink window if duplicate character is found
        while (seenChars.has(s[right])) {
            seenChars.delete(s[left]);
            left++;
        }
        
        seenChars.add(s[right]);
        maxLength = Math.max(maxLength, right - left + 1);
    }
    
    return maxLength;
}`
  }
];

export default function LeetCodeSandbox({ onProblemProcessed }: LeetCodeSandboxProps) {
  const [selectedProblem, setSelectedProblem] = useState<SandboxProblem>(PRESET_PROBLEMS[0]);
  const [codeValue, setCodeValue] = useState(selectedProblem.starterCode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);

  // Extension Panel State
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceTextMemo, setVoiceTextMemo] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Update code field when preset problem changes
  useEffect(() => {
    setCodeValue(selectedProblem.starterCode);
    setIsAccepted(false);
    resetRecording();
  }, [selectedProblem]);

  // Handle timer countdown
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 60) {
            handleStopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const handleSubmitCode = () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsAccepted(true);
    }, 1500);
  };

  const startRecording = async () => {
    audioChunksRef.current = [];
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordingSeconds(0);
    setErrorMessage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Determine format supported by browser
      let options = { mimeType: "audio/webm" };
      if (!MediaRecorder.isTypeSupported("audio/webm")) {
        options = { mimeType: "audio/ogg" };
      }
      if (!MediaRecorder.isTypeSupported("audio/ogg")) {
        options = { mimeType: "" }; // default fallback
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Stop all audio tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error("Microphone access denied:", err);
      setErrorMessage("Could not access your microphone. You can type your explanation text memo instead!");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const resetRecording = () => {
    setIsRecording(false);
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordingSeconds(0);
    setVoiceTextMemo("");
    setErrorMessage(null);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleProcessWithAI = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      let base64Audio = "";
      
      // Convert audio blob to base64 if present
      if (audioBlob) {
        base64Audio = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            // Get base64 payload from data URI
            const base64 = result.split(",")[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(audioBlob);
        });
      }

      const response = await fetch("/api/problems/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemTitle: selectedProblem.title,
          leetcodeId: selectedProblem.leetcodeId,
          difficulty: selectedProblem.difficulty,
          language: "TypeScript",
          code: codeValue,
          tags: selectedProblem.tags,
          voiceBase64: base64Audio || null,
          voiceText: voiceTextMemo || null
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to process solution with AI.");
      }

      const newProblemPackage: ProblemPackage = await response.json();
      
      // Callback to add to dashboard list
      onProblemProcessed(newProblemPackage);
      
      // Reset state
      setIsAccepted(false);
      resetRecording();
    } catch (err: any) {
      console.error("Failed to process with AI:", err);
      setErrorMessage(err.message || "Something went wrong while processing your explanation with Gemini.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (secs: number) => {
    return `0:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-5">
      {/* LeetCode Workspace Mockup */}
      <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden min-h-[500px]">
        
        {/* LeetCode header */}
        <div className="bg-slate-950 px-4 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-amber-500 rounded flex items-center justify-center font-bold text-slate-950 text-xs">
              LC
            </div>
            <span className="text-sm font-semibold text-slate-200">LeetCode Sandbox</span>
            <div className="h-4 w-px bg-slate-800"></div>
            <select
              value={selectedProblem.title}
              onChange={(e) => {
                const prob = PRESET_PROBLEMS.find((p) => p.title === e.target.value);
                if (prob) setSelectedProblem(prob);
              }}
              className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded px-2 py-1 focus:outline-none focus:border-cyan-500 font-medium cursor-pointer"
            >
              {PRESET_PROBLEMS.map((p) => (
                <option key={p.leetcodeId} value={p.title}>
                  {p.leetcodeId}. {p.title}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              selectedProblem.difficulty === "Easy" ? "bg-emerald-950/60 text-emerald-400 border border-emerald-900" :
              selectedProblem.difficulty === "Medium" ? "bg-amber-950/60 text-amber-400 border border-amber-900" :
              "bg-rose-950/60 text-rose-400 border border-rose-900"
            }`}>
              {selectedProblem.difficulty}
            </span>
          </div>
        </div>

        {/* LeetCode Workstation Splitscreen */}
        <div className="flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-800 overflow-hidden">
          
          {/* Left panel: Problem details */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[500px] md:max-h-[600px] select-text">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-100 font-display">
                {selectedProblem.leetcodeId}. {selectedProblem.title}
              </h2>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedProblem.tags.map((t, idx) => (
                  <span key={idx} className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-300 space-y-3 leading-relaxed whitespace-pre-wrap font-sans">
              {selectedProblem.description}
            </div>

            <div className="pt-4 border-t border-slate-800/50 space-y-3.5">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-500">Sample Input</span>
                <pre className="bg-slate-950/50 border border-slate-800/50 p-2.5 rounded text-xs text-slate-300 font-mono mt-1 overflow-x-auto">
                  {selectedProblem.sampleInput}
                </pre>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-500">Expected Output</span>
                <pre className="bg-slate-950/50 border border-slate-800/50 p-2.5 rounded text-xs text-slate-300 font-mono mt-1">
                  {selectedProblem.sampleOutput}
                </pre>
              </div>
            </div>
          </div>

          {/* Right panel: Custom Code Editor */}
          <div className="flex-1 flex flex-col bg-slate-950 max-h-[500px] md:max-h-[600px]">
            <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono bg-slate-950/80">
              <span className="flex items-center gap-1.5"><Code className="w-3.5 h-3.5 text-cyan-400" /> solution.ts (TypeScript)</span>
              <span>Edit solutions below</span>
            </div>
            
            <textarea
              value={codeValue}
              onChange={(e) => setCodeValue(e.target.value)}
              className="flex-1 p-4 bg-slate-950 text-slate-300 font-mono text-xs focus:outline-none resize-none leading-relaxed min-h-[300px] md:min-h-0"
              spellCheck="false"
              style={{
                backgroundAttachment: "local",
                backgroundImage: "linear-gradient(rgba(148,163,184,0.03) 50%, transparent 50%)",
                backgroundSize: "100% 3rem"
              }}
            />

            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
              <span className="text-[10px] font-mono text-slate-500">Beats ~90% when evaluated</span>
              <button
                onClick={handleSubmitCode}
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Evaluating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Submit Code
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Accepted Confirmation Banner */}
        <AnimatePresence>
          {isAccepted && !isSubmitting && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-emerald-950/90 border-t border-emerald-500/30 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 font-sans"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-300">Accepted ✅</h4>
                  <p className="text-xs text-emerald-400 mt-0.5">
                    Your code passed <strong>all 32/32 test cases</strong> successfully. Let's record your thinking.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 font-mono text-xs text-emerald-300 bg-emerald-950 border border-emerald-800 px-3 py-1.5 rounded-lg shrink-0">
                <span>Runtime: <strong>64ms</strong> (beats 94%)</span>
                <span className="opacity-40">|</span>
                <span>Memory: <strong>42MB</strong> (beats 90%)</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CodeRecall Extension Popup Simulation (Drawer Side-over) */}
      <AnimatePresence>
        {isAccepted && (
          <motion.div
            initial={{ opacity: 0, x: 100, width: 0 }}
            animate={{ opacity: 1, x: 0, width: "100%" }}
            exit={{ opacity: 0, x: 100, width: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="w-full lg:w-[380px] bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col relative shrink-0 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-4">
              <div className="w-7 h-7 bg-cyan-600 rounded-lg flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 font-display">CodeRecall AI</h3>
                <p className="text-[10px] text-cyan-400 font-medium">Browser Memory Assistant Active</p>
              </div>
            </div>

            {/* Instruction body */}
            <div className="space-y-3 mb-5">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
                <h4 className="text-xs font-semibold text-slate-200">"Explain your solution in 60 seconds."</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                  Don't just read the code. Briefly record **why** you chose this data structure, key insights, constraints avoided, or edge cases.
                </p>
              </div>
            </div>

            {/* Voice Recorder Block */}
            <div className="flex-1 flex flex-col justify-center items-center bg-slate-950 rounded-xl p-5 border border-slate-950 shadow-inner relative overflow-hidden min-h-[160px]">
              
              {/* Animating audio wave when recording */}
              {isRecording && (
                <div className="absolute inset-0 flex items-center justify-center opacity-10 gap-1 pointer-events-none">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 bg-cyan-400 rounded-full"
                      animate={{ height: [12, Math.random() * 60 + 20, 12] }}
                      transition={{ repeat: Infinity, duration: 0.5 + Math.random() * 0.4, ease: "easeInOut" }}
                    />
                  ))}
                </div>
              )}

              <div className="z-10 flex flex-col items-center space-y-4">
                <div className="text-sm font-mono font-semibold text-slate-300">
                  {isRecording ? (
                    <span className="text-rose-400 flex items-center gap-1.5 animate-pulse">
                      ● Recording {formatTime(recordingSeconds)}
                    </span>
                  ) : audioUrl ? (
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4" /> Voice Explanation Ready
                    </span>
                  ) : (
                    <span className="text-slate-400">Microphone Ready</span>
                  )}
                </div>

                {/* Main Mic trigger */}
                <div className="flex items-center gap-3">
                  {!isRecording && !audioUrl ? (
                    <button
                      onClick={startRecording}
                      className="w-14 h-14 bg-cyan-600 hover:bg-cyan-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-cyan-950/30 transition-transform active:scale-95 cursor-pointer"
                    >
                      <Mic className="w-6 h-6" />
                    </button>
                  ) : isRecording ? (
                    <button
                      onClick={handleStopRecording}
                      className="w-14 h-14 bg-rose-600 hover:bg-rose-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-rose-950/30 transition-transform active:scale-95 cursor-pointer"
                    >
                      <Square className="w-5 h-5 fill-current" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <audio src={audioUrl!} controls className="h-8 w-44 scale-90" />
                      <button
                        onClick={resetRecording}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 transition-colors"
                        title="Delete Recording"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {recordingSeconds > 0 && isRecording && (
                  <span className="text-[10px] text-slate-500">60s Limit. Press Stop to conclude.</span>
                )}
              </div>
            </div>

            {/* Error alerts */}
            {errorMessage && (
              <div className="bg-rose-950/60 border border-rose-900/50 p-2.5 rounded-lg mt-3 flex gap-2 items-start text-[10px] text-rose-300 leading-normal">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Text Memo Textarea fallback */}
            <div className="mt-4 space-y-1.5">
              <label className="text-[10px] font-mono uppercase text-slate-500 flex items-center gap-1">
                <span>Written Notes / Text explanation (Optional)</span>
              </label>
              <textarea
                value={voiceTextMemo}
                onChange={(e) => setVoiceTextMemo(e.target.value)}
                placeholder="Alternative: Write down your key realization here instead of recording voice, or write extra notes for the AI..."
                className="w-full h-16 p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-cyan-500 resize-none leading-relaxed"
              />
            </div>

            {/* Submit to AI */}
            <div className="mt-5 pt-3 border-t border-slate-800 flex gap-2">
              <button
                onClick={() => setIsAccepted(false)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Skip Documentation
              </button>
              <button
                onClick={handleProcessWithAI}
                disabled={isProcessing}
                className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-cyan-950/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Structuring Brain...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Process with AI
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
