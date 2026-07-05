import React, { useState, useEffect } from "react";
import { 
  Home, Sparkles, Brain, MessageSquare, Code, Clock, Search, 
  Trash2, X, AlertTriangle, ShieldAlert, BookOpen, Layers,
  ChevronRight, ArrowUpRight, Flame, Trophy, Play, CheckCircle, RefreshCw, LogOut
} from "lucide-react";
import { ProblemPackage } from "./types";
import LeetCodeSandbox from "./components/LeetCodeSandbox";
import AlgorithmVisualizer from "./components/AlgorithmVisualizer";
import MemoryChat from "./components/MemoryChat";
import RevisionDeck from "./components/RevisionDeck";
import { auth, db, googleProvider, OperationType, handleFirestoreError } from "./lib/firebase";
import { onAuthStateChanged, signOut, signInWithPopup, User } from "firebase/auth";
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "leetcode" | "revision" | "search">("dashboard");
  const [problems, setProblems] = useState<ProblemPackage[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<ProblemPackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Search/Filter states for Dashboard
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");
  const [selectedTag, setSelectedTag] = useState<string>("All");

  // Track Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync problems with Firestore for the active user
  useEffect(() => {
    if (!user) {
      setProblems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const q = query(collection(db, "problems"), where("userId", "==", user.uid));
    
    const unsubscribe = onSnapshot(q, 
      async (snapshot) => {
        if (snapshot.empty) {
          // New user: seed their collection with defaults from server.ts
          try {
            const response = await fetch("/api/problems");
            if (response.ok) {
              const seedData: ProblemPackage[] = await response.json();
              for (const prob of seedData) {
                const docId = `seed-${prob.id}-${user.uid}`;
                const newProb = {
                  ...prob,
                  id: docId,
                  userId: user.uid,
                  createdAt: new Date(),
                  lastReviewedAt: new Date(),
                  nextReviewAt: new Date()
                };
                await setDoc(doc(db, "problems", docId), newProb);
              }
            }
          } catch (err) {
            console.error("Failed to seed initial problems:", err);
          } finally {
            setIsLoading(false);
          }
        } else {
          const list: ProblemPackage[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            list.push({
              ...data,
              // Convert native Firestore Timestamps back to ISO Strings
              createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
              lastReviewedAt: data.lastReviewedAt?.toDate?.() ? data.lastReviewedAt.toDate().toISOString() : data.lastReviewedAt || new Date().toISOString(),
              nextReviewAt: data.nextReviewAt?.toDate?.() ? data.nextReviewAt.toDate().toISOString() : data.nextReviewAt || new Date().toISOString(),
            } as ProblemPackage);
          });
          // Sort list so newest created is first
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setProblems(list);
          setIsLoading(false);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "problems");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleNewProblemProcessed = async (newProblem: ProblemPackage) => {
    if (!user) return;
    try {
      const docId = newProblem.id || `prob-${Date.now()}`;
      const newProb = {
        ...newProblem,
        id: docId,
        userId: user.uid,
        createdAt: new Date(),
        lastReviewedAt: new Date(),
        nextReviewAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) // 1 day
      };
      
      await setDoc(doc(db, "problems", docId), newProb);
      
      const formattedProblem = {
        ...newProb,
        createdAt: newProb.createdAt.toISOString(),
        lastReviewedAt: newProb.lastReviewedAt.toISOString(),
        nextReviewAt: newProb.nextReviewAt.toISOString(),
      };
      setSelectedProblem(formattedProblem as ProblemPackage);
      setActiveTab("dashboard");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `problems/${newProblem.id}`);
    }
  };

  const handleProblemDeleted = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    if (!confirm("Are you sure you want to delete this documented problem package?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "problems", id));
      if (selectedProblem?.id === id) {
        setSelectedProblem(null);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `problems/${id}`);
    }
  };

  const handleReviewRated = (updatedProblem: ProblemPackage) => {
    // onSnapshot listener handles state syncing, but let's keep selecting the revised problem instantly
    if (selectedProblem?.id === updatedProblem.id) {
      setSelectedProblem(updatedProblem);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setSelectedProblem(null);
    } catch (err) {
      console.error("Signout failed:", err);
    }
  };

  // Get all unique tags for filter chip list
  const allTags = ["All", ...Array.from(new Set(problems.flatMap((p) => p.tags)))];

  // Filter problems for Dashboard
  const filteredProblems = problems.filter((p) => {
    const matchesSearch =
      p.problemTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.leetcodeId.includes(searchQuery) ||
      p.keyIntuition.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDifficulty =
      selectedDifficulty === "All" || p.difficulty === selectedDifficulty;
    
    const matchesTag =
      selectedTag === "All" || p.tags.includes(selectedTag);

    return matchesSearch && matchesDifficulty && matchesTag;
  });

  if (authLoading) {
    return (
      <div className="bg-slate-950 text-slate-100 min-h-screen font-sans flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <span className="text-xs font-mono text-slate-500">Connecting to CodeRecall AI...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-slate-950 text-slate-100 min-h-screen font-sans flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 shadow-2xl shadow-cyan-950/20 text-center">
          <div className="mx-auto w-12 h-12 bg-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-900/40">
            <Sparkles className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-slate-100">CodeRecall AI</h1>
            <p className="text-xs text-cyan-400 font-mono tracking-widest uppercase mt-1">Second Brain memory bank</p>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-sans px-4">
            An intelligent second brain for software engineers. Document, visualize, and retain your LeetCode intuition and algorithmic insights forever.
          </p>
          <div className="pt-4">
            <button
              onClick={async () => {
                try {
                  await signInWithPopup(auth, googleProvider);
                } catch (err) {
                  console.error("Login failed:", err);
                }
              }}
              className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/30 transition-all cursor-pointer select-none"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28-0.97,2.37-2.07,3.1l3.22,2.5c1.88-1.73,2.97-4.29,2.97-7.23C21.5,12.2,21.45,11.63,21.35,11.1z" />
                <path d="M12,22c2.7,0,4.96-0.9,6.62-2.43l-3.22-2.5c-0.9,0.6-2.06,0.96-3.4,0.96c-2.61,0-4.83-1.76-5.62-4.13L3.1,16.42C4.74,19.74,8.13,22,12,22z" />
                <path d="M6.38,13.9c-0.2-0.6-0.31-1.24-0.31-1.9s0.11-1.3,0.31-1.9L3.1,7.58C2.39,9.01,2,10.61,2,12s0.39,2.99,1.1,4.42L6.38,13.9z" />
                <path d="M12,5.38c1.47,0,2.79,0.51,3.83,1.5l2.87-2.87C16.96,2.3,14.7,1.4,12,1.4c-3.87,0-7.26,2.26-8.9,5.58l3.28,2.52C7.17,7.14,9.39,5.38,12,5.38z" />
              </svg>
              Sign In with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen font-sans flex">
      
      {/* Sidebar Navigation Panel */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 hidden md:flex">
        <div className="flex flex-col">
          {/* Logo brand */}
          <div className="p-6 flex items-center gap-2.5 border-b border-slate-800">
            <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-900/40">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight font-display text-slate-100">CodeRecall AI</h1>
              <span className="text-[10px] font-mono text-cyan-400 font-semibold tracking-wider uppercase block">Second Brain</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => { setActiveTab("dashboard"); setSelectedProblem(null); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "dashboard"
                  ? "bg-cyan-950/60 text-cyan-400 border border-cyan-900/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
              }`}
            >
              <Home className="w-4.5 h-4.5" />
              <span>Memory Palace</span>
            </button>

            <button
              onClick={() => { setActiveTab("leetcode"); setSelectedProblem(null); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "leetcode"
                  ? "bg-cyan-950/60 text-cyan-400 border border-cyan-900/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
              }`}
            >
              <Code className="w-4.5 h-4.5" />
              <span>LeetCode Workspace</span>
            </button>

            <button
              onClick={() => { setActiveTab("revision"); setSelectedProblem(null); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "revision"
                  ? "bg-cyan-950/60 text-cyan-400 border border-cyan-900/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
              }`}
            >
              <Brain className="w-4.5 h-4.5" />
              <span>Revision Coach</span>
              {problems.filter(p => new Date(p.nextReviewAt) <= new Date()).length > 0 && (
                <span className="ml-auto w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab("search"); setSelectedProblem(null); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "search"
                  ? "bg-cyan-950/60 text-cyan-400 border border-cyan-900/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
              }`}
            >
              <MessageSquare className="w-4.5 h-4.5" />
              <span>AI Second Brain Chat</span>
            </button>
          </nav>
        </div>

        {/* User Account Info footer */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-850">
            <div className="flex items-center gap-2">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-7 h-7 bg-cyan-900 rounded-full flex items-center justify-center font-bold text-cyan-300 text-xs">
                  {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
              <div className="truncate flex-1">
                <span className="text-[11px] font-semibold text-slate-200 block truncate">{user.displayName || "User Account"}</span>
                <span className="text-[9px] font-mono text-slate-500 truncate block">{user.email || ""}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 hover:text-slate-100 text-slate-400 text-[10px] font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer select-none"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen relative">
        
        {/* Navigation header for smaller layouts / status */}
        <header className="bg-slate-900/50 backdrop-blur-md px-6 py-4 border-b border-slate-800/80 sticky top-0 z-20 flex items-center justify-between">
          <div className="flex items-center gap-3 md:hidden">
            <div className="w-7 h-7 bg-cyan-600 rounded flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold font-display">CodeRecall AI</span>
          </div>

          <div className="text-xs text-slate-400 font-mono hidden sm:block">
            LeetCode Memory Extension — Dashboard Synced
          </div>

          {/* Quick tabs on mobile */}
          <div className="flex md:hidden items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-2.5 py-1 text-[10px] font-bold rounded transition-colors ${
                activeTab === "dashboard" ? "bg-cyan-950 text-cyan-400" : "text-slate-500"
              }`}
            >
              Palace
            </button>
            <button
              onClick={() => setActiveTab("leetcode")}
              className={`px-2.5 py-1 text-[10px] font-bold rounded transition-colors ${
                activeTab === "leetcode" ? "bg-cyan-950 text-cyan-400" : "text-slate-500"
              }`}
            >
              IDE
            </button>
            <button
              onClick={() => setActiveTab("revision")}
              className={`px-2.5 py-1 text-[10px] font-bold rounded transition-colors ${
                activeTab === "revision" ? "bg-cyan-950 text-cyan-400" : "text-slate-500"
              }`}
            >
              Revision
            </button>
            <button
              onClick={() => setActiveTab("search")}
              className={`px-2.5 py-1 text-[10px] font-bold rounded transition-colors ${
                activeTab === "search" ? "bg-cyan-950 text-cyan-400" : "text-slate-500"
              }`}
            >
              Ask
            </button>
          </div>
        </header>

        {/* Dynamic Inner Tab Workspaces */}
        <div className="p-6 max-w-7xl mx-auto w-full flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-[400px] gap-3">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
              <span className="text-xs font-mono text-slate-500">Syncing Second Brain problem index...</span>
            </div>
          ) : activeTab === "dashboard" ? (
            
            // Tab 1: Memory Palace Dashboard
            <div className="space-y-6">
              
              {/* Stat Banners */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Solved Problems</span>
                    <span className="text-2xl font-bold font-display text-slate-100">{problems.length}</span>
                  </div>
                  <div className="w-9 h-9 bg-slate-950/60 rounded-lg flex items-center justify-center border border-slate-800">
                    <Layers className="w-4.5 h-4.5 text-slate-400" />
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Overdue reviews</span>
                    <span className="text-2xl font-bold font-display text-slate-100">
                      {problems.filter(p => new Date(p.nextReviewAt) <= new Date()).length}
                    </span>
                  </div>
                  <div className="w-9 h-9 bg-slate-950/60 rounded-lg flex items-center justify-center border border-slate-800">
                    <Clock className="w-4.5 h-4.5 text-rose-400" />
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Spaced Interval streak</span>
                    <span className="text-2xl font-bold font-display text-slate-100">12 Days</span>
                  </div>
                  <div className="w-9 h-9 bg-slate-950/60 rounded-lg flex items-center justify-center border border-slate-800">
                    <Flame className="w-4.5 h-4.5 text-amber-500" />
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Interview Preparedness</span>
                    <span className="text-2xl font-bold font-display text-slate-100">High</span>
                  </div>
                  <div className="w-9 h-9 bg-slate-950/60 rounded-lg flex items-center justify-center border border-slate-800">
                    <Trophy className="w-4.5 h-4.5 text-cyan-400" />
                  </div>
                </div>
              </div>

              {/* Filtering / Search Bar */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by title, leetcode id, or intuition..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg focus:outline-none focus:border-cyan-500 font-sans"
                  />
                </div>
                
                {/* Filters */}
                <div className="flex gap-2 w-full md:w-auto">
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 flex-1 md:flex-none cursor-pointer"
                  >
                    <option value="All">All Difficulties</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>

                  <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 flex-1 md:flex-none cursor-pointer max-w-[150px]"
                  >
                    <option value="All">All Tags</option>
                    {allTags.filter((t) => t !== "All").map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Problems Grid List */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono uppercase text-slate-500 tracking-wider">Documented Solution Archives</h3>
                
                {filteredProblems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProblems.map((p) => {
                      const isOverdue = new Date(p.nextReviewAt) <= new Date();
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedProblem(p)}
                          className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between cursor-pointer transition-all hover:translate-y-[-2px] shadow-sm select-none"
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-[10px] font-mono text-slate-500 font-bold">#{p.leetcodeId}</span>
                              <div className="flex items-center gap-1.5">
                                {isOverdue && (
                                  <span className="text-[9px] font-mono font-bold text-rose-400 bg-rose-950 border border-rose-900 px-1.5 py-0.5 rounded-full animate-pulse">
                                    Overdue
                                  </span>
                                )}
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  p.difficulty === "Easy" ? "bg-emerald-950 text-emerald-400 border border-emerald-900/30" :
                                  p.difficulty === "Medium" ? "bg-amber-950 text-amber-400 border border-amber-900/30" :
                                  "bg-rose-950 text-rose-400 border border-rose-900/30"
                                }`}>
                                  {p.difficulty}
                                </span>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-bold text-slate-200 font-display line-clamp-1">
                                {p.problemTitle}
                              </h4>
                              <p className="text-[11px] text-slate-400 leading-normal line-clamp-2 mt-1 italic">
                                "{p.keyIntuition}"
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-1">
                              {p.tags.slice(0, 2).map((t, i) => (
                                <span key={i} className="text-[8px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="pt-3 mt-3 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                            <div className="flex flex-col">
                              <span>Memory Palace</span>
                              <span className={`font-bold mt-0.5 ${
                                p.memoryStrength >= 80 ? "text-emerald-400" :
                                p.memoryStrength >= 50 ? "text-amber-400" :
                                "text-rose-400"
                              }`}>
                                {p.memoryStrength}% strength
                              </span>
                            </div>
                            <button
                              onClick={(e) => handleProblemDeleted(p.id, e)}
                              className="p-1 rounded text-slate-600 hover:text-rose-400 transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-slate-900/30 border border-slate-800/60 rounded-xl p-12 text-center space-y-3">
                    <Layers className="w-10 h-10 text-slate-700 mx-auto" />
                    <h4 className="text-sm font-semibold text-slate-400">No Problems Found</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      We couldn't find any documented problem packages matching your selection. Try checking "LeetCode Workspace" to submit and document your first problem!
                    </p>
                    <button
                      onClick={() => setActiveTab("leetcode")}
                      className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-colors inline-block cursor-pointer"
                    >
                      Open Workspace IDE
                    </button>
                  </div>
                )}
              </div>

            </div>
          ) : activeTab === "leetcode" ? (
            
            // Tab 2: LeetCode Sandbox mock workspace
            <LeetCodeSandbox onProblemProcessed={handleNewProblemProcessed} />

          ) : activeTab === "revision" ? (

            // Tab 3: Revision Spaced Repetition Coach
            <RevisionDeck 
              problems={problems} 
              onReviewRated={handleReviewRated} 
              onSelectProblem={setSelectedProblem} 
            />

          ) : (

            // Tab 4: Chat Retrieve Query
            <MemoryChat problems={problems} onSelectProblem={setSelectedProblem} />

          )}
        </div>
      </main>

      {/* Slide-over problem package inspector modal */}
      {selectedProblem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-end select-text">
          {/* Backdrop trigger */}
          <div className="absolute inset-0 cursor-pointer" onClick={() => setSelectedProblem(null)}></div>
          
          {/* Modal Panel drawer */}
          <div className="relative w-full max-w-4xl bg-slate-900 border-l border-slate-800 h-full flex flex-col justify-between shadow-2xl z-10 overflow-hidden">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-850 flex items-center justify-between bg-slate-900/80 sticky top-0 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-mono text-slate-500">#{selectedProblem.leetcodeId}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  selectedProblem.difficulty === "Easy" ? "bg-emerald-950 text-emerald-400 border border-emerald-900/30" :
                  selectedProblem.difficulty === "Medium" ? "bg-amber-950 text-amber-400 border border-amber-900/30" :
                  "bg-rose-950 text-rose-400 border border-rose-900/30"
                }`}>
                  {selectedProblem.difficulty}
                </span>
                <h2 className="text-sm font-bold text-slate-100 font-display truncate max-w-md">
                  {selectedProblem.problemTitle}
                </h2>
              </div>
              <button
                onClick={() => setSelectedProblem(null)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer scrollable content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Animation Canvas */}
              <div>
                <h3 className="text-xs font-mono uppercase text-slate-500 tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-cyan-400" /> Dynamic Algorithm Animation
                </h3>
                <AlgorithmVisualizer 
                  animationType={selectedProblem.animationType} 
                  animationData={selectedProblem.animationData} 
                />
              </div>

              {/* Two Column details structure */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Column Left: Explanation, Intuition, Mistakes */}
                <div className="space-y-5">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">🗣️ Original Voice Transcript</span>
                    <p className="text-xs text-slate-300 italic leading-relaxed">
                      "{selectedProblem.voiceTranscript}"
                    </p>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">🧠 AI-Structured Explanation</span>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {selectedProblem.structuredExplanation}
                    </p>
                    <div className="pt-2 border-t border-slate-800/40">
                      <span className="text-[9px] font-mono text-cyan-400">Key Intuition:</span>
                      <p className="text-xs text-slate-300 leading-normal font-sans mt-0.5">{selectedProblem.keyIntuition}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-800/40">
                      <span className="text-[9px] font-mono text-cyan-400">Core Observation:</span>
                      <p className="text-xs text-slate-300 leading-normal font-sans mt-0.5">{selectedProblem.coreObservation}</p>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block flex items-center gap-1.5 text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5" /> Common Mistakes Avoided
                    </span>
                    <ul className="list-disc list-inside text-xs text-slate-300 space-y-1.5 font-sans leading-relaxed">
                      {selectedProblem.commonMistakes.map((mistake, i) => (
                        <li key={i}>{mistake}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Column Right: Code block, Complexity, Interview Ready */}
                <div className="space-y-5">
                  <div className="bg-slate-950 rounded-xl border border-slate-850 overflow-hidden flex flex-col">
                    <div className="bg-slate-950 px-3.5 py-1.5 border-b border-slate-850 text-[10px] font-mono text-slate-500">
                      Solution Code ({selectedProblem.language})
                    </div>
                    <pre className="p-3.5 overflow-x-auto text-[10px] text-slate-300 font-mono leading-relaxed max-h-[220px]">
                      <code>{selectedProblem.code}</code>
                    </pre>
                  </div>

                  {/* Complexities */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Time Complexity</span>
                      <div className="text-slate-100 font-bold font-mono text-sm mt-0.5">{selectedProblem.timeComplexity}</div>
                      <p className="text-[10px] text-slate-400 mt-1 font-sans leading-normal">{selectedProblem.timeComplexityExplanation}</p>
                    </div>
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Space Complexity</span>
                      <div className="text-slate-100 font-bold font-mono text-sm mt-0.5">{selectedProblem.spaceComplexity}</div>
                      <p className="text-[10px] text-slate-400 mt-1 font-sans leading-normal">{selectedProblem.spaceComplexityExplanation}</p>
                    </div>
                  </div>

                  {/* Interview explanation card */}
                  <div className="bg-cyan-950/20 border border-cyan-900/30 rounded-xl p-4 space-y-2">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block font-bold">🎯 Live Interview Explanation</span>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans bg-cyan-950/40 p-3 rounded border border-cyan-900/10">
                      "{selectedProblem.interviewExplanation}"
                    </p>
                  </div>

                  {/* Similar problems */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">🔄 Recommended Similar Problems</span>
                    <div className="space-y-2">
                      {selectedProblem.similarProblems.map((sim, i) => (
                        <div key={i} className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-300">{sim.title}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            sim.difficulty === "Easy" ? "bg-emerald-950/50 text-emerald-400" :
                            sim.difficulty === "Medium" ? "bg-amber-950/50 text-amber-400" :
                            "bg-rose-950/50 text-rose-400"
                          }`}>
                            {sim.difficulty}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Drawer Footer controls */}
            <div className="p-4 border-t border-slate-850 bg-slate-950/50 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500">
                Created on {new Date(selectedProblem.createdAt).toLocaleDateString()}
              </span>
              <button
                onClick={() => setSelectedProblem(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Done Reviewing
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
