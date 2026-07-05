import React, { useState } from "react";
import { Search, Sparkles, MessageSquare, ArrowRight, HelpCircle, AlertCircle, RefreshCw } from "lucide-react";
import { ProblemPackage, SearchResponse } from "../types";

interface MemoryChatProps {
  problems: ProblemPackage[];
  onSelectProblem: (problem: ProblemPackage) => void;
}

const SEARCH_SUGGESTIONS = [
  "Show me Two Pointer problems.",
  "Which problems did I make duplicate/boundary errors on?",
  "Find solutions with O(1) space complexity.",
  "What problems are overdue for review?"
];

export default function MemoryChat({ problems, onSelectProblem }: MemoryChatProps) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [matchedProblems, setMatchedProblems] = useState<ProblemPackage[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setError(null);
    setHasSearched(true);
    setAiMessage(null);

    try {
      const response = await fetch("/api/problems/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, problems }),
      });

      if (!response.ok) {
        throw new Error("Failed to search second brain.");
      }

      const data: SearchResponse = await response.json();
      
      setAiMessage(data.responseMessage);
      
      // Filter the local problems list by matched IDs from Gemini
      const matched = problems.filter((p) => data.matchedIds.includes(p.id));
      setMatchedProblems(matched);
    } catch (err: any) {
      console.error(err);
      setError("Failed to query the second brain. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h3 className="text-base font-bold text-slate-100 font-display flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          Second Brain Chat Search
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed mt-1">
          Query your personal competitive programming index using plain natural language. CodeRecall AI will locate your original voice transcripts, code, complexity patterns, or mistake logs.
        </p>

        {/* Input Bar */}
        <div className="mt-4 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
              placeholder="e.g. Find two-pointer problems where I had off-by-one errors..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 text-sm text-slate-200 rounded-lg focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-600 font-sans"
            />
          </div>
          <button
            onClick={() => handleSearch(query)}
            disabled={isSearching}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shrink-0 shadow-lg shadow-cyan-950/20 transition-colors cursor-pointer"
          >
            {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            <span>Ask Brain</span>
          </button>
        </div>

        {/* Suggestions chips */}
        <div className="mt-4 pt-4 border-t border-slate-800/50">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-2">Suggested Queries</span>
          <div className="flex flex-wrap gap-2">
            {SEARCH_SUGGESTIONS.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(suggestion);
                  handleSearch(suggestion);
                }}
                className="text-xs text-slate-400 hover:text-cyan-400 bg-slate-950/50 hover:bg-slate-950 border border-slate-800 hover:border-cyan-900/50 px-3 py-1.5 rounded-lg transition-all text-left cursor-pointer select-none"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI message response and results */}
      {hasSearched && (
        <div className="space-y-4">
          <h4 className="text-xs font-mono uppercase text-slate-500 tracking-wider">Search Results</h4>
          
          {isSearching ? (
            <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-xl flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-xs text-slate-400 font-mono">Retrieving matching solution records and drafting response...</p>
            </div>
          ) : error ? (
            <div className="bg-rose-950/30 border border-rose-900 p-4 rounded-xl flex gap-2.5 items-start">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-300 font-sans">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Left Column: AI Conversation summary */}
              <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-fit">
                <div className="flex items-center gap-1.5 pb-2 border-b border-slate-800 mb-2.5">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-slate-200">AI Memory Synthesis</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line">
                  {aiMessage || "Query completed. No matching problems were returned by the AI search filter."}
                </p>
              </div>

              {/* Right Column: Matched problem cards list */}
              <div className="md:col-span-2 space-y-3">
                {matchedProblems.length > 0 ? (
                  matchedProblems.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => onSelectProblem(p)}
                      className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 p-4 rounded-xl flex items-center justify-between cursor-pointer transition-all shadow-sm select-none"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-500">#{p.leetcodeId}</span>
                          <h4 className="text-xs font-bold text-slate-200 font-display hover:text-cyan-400">
                            {p.problemTitle}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            p.difficulty === "Easy" ? "bg-emerald-950 text-emerald-400" :
                            p.difficulty === "Medium" ? "bg-amber-950 text-amber-400" :
                            "bg-rose-950 text-rose-400"
                          }`}>
                            {p.difficulty}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            Complexities: {p.timeComplexity} / {p.spaceComplexity}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-right shrink-0">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-500 uppercase tracking-tight">Memory</span>
                          <span className={`text-xs font-mono font-bold mt-0.5 ${
                            p.memoryStrength >= 80 ? "text-emerald-400" :
                            p.memoryStrength >= 50 ? "text-amber-400" :
                            "text-rose-400"
                          }`}>
                            {p.memoryStrength}%
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-slate-900/30 border border-slate-800/60 p-8 rounded-xl flex flex-col items-center justify-center space-y-2 text-center">
                    <HelpCircle className="w-6 h-6 text-slate-600" />
                    <h5 className="text-xs font-semibold text-slate-400">No Matched Problems</h5>
                    <p className="text-[11px] text-slate-500 max-w-sm">
                      We didn't find any saved problems that match your precise criteria. Try a different query like "two pointers" or "time complexity O(1)".
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
