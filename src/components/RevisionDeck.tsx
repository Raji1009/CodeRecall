import React, { useState } from "react";
import { 
  Calendar, CheckCircle, RefreshCw, AlertTriangle, Eye, ArrowRight,
  Flame, Award, ShieldAlert, Check, HelpCircle
} from "lucide-react";
import { ProblemPackage } from "../types";
import { doc, updateDoc } from "firebase/firestore";
import { db, OperationType, handleFirestoreError } from "../lib/firebase";

interface RevisionDeckProps {
  problems: ProblemPackage[];
  onReviewRated: (updatedProblem: ProblemPackage) => void;
  onSelectProblem: (problem: ProblemPackage) => void;
}

export default function RevisionDeck({ problems, onReviewRated, onSelectProblem }: RevisionDeckProps) {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Filter problems due/overdue for review
  const now = new Date();
  const dueProblems = problems.filter((p) => {
    const nextReview = new Date(p.nextReviewAt);
    return nextReview <= now || p.memoryStrength < 50;
  });

  const handleRate = async (id: string, rating: number) => {
    setIsUpdating(true);
    try {
      const problem = problems.find((p) => p.id === id);
      if (!problem) return;

      // Simple spaced repetition logic (SuperMemo-2-like)
      let interval = 1;
      let multiplier = 1.5;
      if (rating >= 4) {
        multiplier = 2.0;
      } else if (rating === 3) {
        multiplier = 1.4;
      } else {
        multiplier = 0.5;
      }

      const daysSinceCreated = (Date.now() - new Date(problem.createdAt).getTime()) / (24 * 60 * 60 * 1000);
      interval = Math.max(1, Math.round((daysSinceCreated || 1) * multiplier));

      const newLastReviewedAt = new Date();
      const newNextReviewAt = new Date(Date.now() + interval * 24 * 60 * 60 * 1000);
      const newMemoryStrength = Math.min(100, Math.max(10, Math.round(problem.memoryStrength * multiplier)));

      await updateDoc(doc(db, "problems", id), {
        lastReviewedAt: newLastReviewedAt,
        nextReviewAt: newNextReviewAt,
        memoryStrength: newMemoryStrength
      });

      const updatedProblem = {
        ...problem,
        lastReviewedAt: newLastReviewedAt.toISOString(),
        nextReviewAt: newNextReviewAt.toISOString(),
        memoryStrength: newMemoryStrength
      };

      onReviewRated(updatedProblem);
      setIsRevealed(false);
      setActiveCardId(null);
    } catch (err) {
      console.error("Error rating problem:", err);
      handleFirestoreError(err, OperationType.UPDATE, `problems/${id}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const getUrgencyLabel = (problem: ProblemPackage) => {
    const nextReview = new Date(problem.nextReviewAt);
    const diffTime = nextReview.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `Overdue by ${Math.abs(diffDays)}d`, color: "text-rose-400 bg-rose-950/50 border-rose-900" };
    }
    if (problem.memoryStrength < 50) {
      return { text: "Critical Decay", color: "text-amber-400 bg-amber-950/50 border-amber-900" };
    }
    return { text: "Due Today", color: "text-cyan-400 bg-cyan-950/50 border-cyan-900" };
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Upcoming Reviews</span>
            <span className="text-2xl font-bold font-display text-slate-100">{dueProblems.length}</span>
          </div>
          <div className="w-10 h-10 bg-rose-950/60 border border-rose-900/30 rounded-lg flex items-center justify-center text-rose-400">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Total Mastered</span>
            <span className="text-2xl font-bold font-display text-slate-100">
              {problems.filter((p) => p.memoryStrength >= 80).length}
            </span>
          </div>
          <div className="w-10 h-10 bg-emerald-950/60 border border-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-400">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Average Strength</span>
            <span className="text-2xl font-bold font-display text-slate-100">
              {problems.length > 0
                ? Math.round(problems.reduce((sum, p) => sum + p.memoryStrength, 0) / problems.length)
                : 0}
              %
            </span>
          </div>
          <div className="w-10 h-10 bg-cyan-950/60 border border-cyan-900/30 rounded-lg flex items-center justify-center text-cyan-400">
            <Flame className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Problem queue selection */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-mono uppercase text-slate-500 tracking-wider">Review Queue</h3>
          
          {dueProblems.length > 0 ? (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {dueProblems.map((p) => {
                const isSelected = activeCardId === p.id;
                const urgency = getUrgencyLabel(p);
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setActiveCardId(p.id);
                      setIsRevealed(false);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex flex-col gap-2 ${
                      isSelected
                        ? "bg-slate-850 border-cyan-500 shadow-sm shadow-cyan-950/40"
                        : "bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-mono text-slate-500">#{p.leetcodeId}</span>
                      <span className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded border ${urgency.color}`}>
                        {urgency.text}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-200 font-display">
                      {p.problemTitle}
                    </h4>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/40">
                      <span>Strength: {p.memoryStrength}%</span>
                      <span>{p.tags[0] || "Array"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-900/30 border border-slate-800/60 p-6 rounded-xl text-center space-y-2">
              <Check className="w-6 h-6 text-emerald-400 mx-auto" />
              <h5 className="text-xs font-bold text-slate-300">Memory Palace fully synched!</h5>
              <p className="text-[11px] text-slate-500 leading-normal max-w-xs mx-auto">
                No problems require urgent recall review today. Keep solving on LeetCode to build more learning packages!
              </p>
            </div>
          )}
        </div>

        {/* Right column: Active Recall Flashcard Workspace */}
        <div className="lg:col-span-2">
          {activeCardId ? (
            (() => {
              const problem = problems.find((p) => p.id === activeCardId)!;
              return (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col min-h-[400px] shadow-sm select-text">
                  <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500">Active Recall Prompt</span>
                      <h3 className="text-sm font-bold text-slate-200 font-display mt-0.5">
                        {problem.leetcodeId}. {problem.problemTitle}
                      </h3>
                    </div>
                    <button
                      onClick={() => onSelectProblem(problem)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <span>Inspect Code</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Recall Area */}
                  <div className="flex-1 flex flex-col justify-center items-center py-8">
                    {!isRevealed ? (
                      <div className="text-center space-y-5 max-w-md select-none">
                        <div className="w-14 h-14 bg-slate-950 border border-slate-800 rounded-full flex items-center justify-center text-slate-400 mx-auto shadow-inner">
                          <HelpCircle className="w-7 h-7 text-cyan-500" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-slate-100">Test Your Algorithm Intuition</h4>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Can you describe the **Key Intuition**, **Core Observation**, and why you used the **{problem.animationType.replace("_", " ")}** approach?
                          </p>
                        </div>
                        <button
                          onClick={() => setIsRevealed(true)}
                          className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold rounded-lg border border-slate-700 hover:border-cyan-500/30 transition-all flex items-center gap-1.5 mx-auto cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Reveal Memory Answers</span>
                        </button>
                      </div>
                    ) : (
                      <div className="w-full space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1">💡 Key Intuition</span>
                            <p className="text-xs text-slate-300 leading-relaxed font-sans">{problem.keyIntuition}</p>
                          </div>
                          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1">🔍 Core Observation</span>
                            <p className="text-xs text-slate-300 leading-relaxed font-sans">{problem.coreObservation}</p>
                          </div>
                        </div>

                        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-2">
                          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">🎙️ Original Voice Transcript</span>
                          <p className="text-xs text-slate-400 leading-relaxed italic">
                            "{problem.voiceTranscript}"
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-3 rounded-xl border border-slate-850/40 font-mono text-xs text-slate-400">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase">Time Complexity</span>
                            <div className="text-slate-200 font-bold text-sm mt-0.5">{problem.timeComplexity}</div>
                            <div className="text-[11px] text-slate-400 mt-1 leading-normal font-sans">{problem.timeComplexityExplanation}</div>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase">Space Complexity</span>
                            <div className="text-slate-200 font-bold text-sm mt-0.5">{problem.spaceComplexity}</div>
                            <div className="text-[11px] text-slate-400 mt-1 leading-normal font-sans">{problem.spaceComplexityExplanation}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rating Actions Footer */}
                  {isRevealed && (
                    <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
                      <span className="text-xs font-semibold text-slate-400">Rate your recall success:</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRate(problem.id, 1)}
                          disabled={isUpdating}
                          className="px-3 py-1.5 bg-rose-950/50 hover:bg-rose-900/60 text-rose-400 text-xs font-bold rounded-lg border border-rose-900 transition-colors cursor-pointer"
                        >
                          Forgot (1)
                        </button>
                        <button
                          onClick={() => handleRate(problem.id, 3)}
                          disabled={isUpdating}
                          className="px-3 py-1.5 bg-amber-950/50 hover:bg-amber-900/60 text-amber-400 text-xs font-bold rounded-lg border border-amber-900 transition-colors cursor-pointer"
                        >
                          Struggled (3)
                        </button>
                        <button
                          onClick={() => handleRate(problem.id, 5)}
                          disabled={isUpdating}
                          className="px-3 py-1.5 bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-900 transition-colors cursor-pointer"
                        >
                          Perfect Recall (5)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
              <Calendar className="w-10 h-10 text-slate-600 mb-3" />
              <h4 className="text-sm font-bold text-slate-400">Select a Problem to Recall</h4>
              <p className="text-xs text-slate-500 leading-normal max-w-sm mt-1">
                Choose a LeetCode problem from your active spaced repetition queue on the left to begin active recall testing.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
