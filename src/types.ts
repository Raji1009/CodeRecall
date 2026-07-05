export interface SimilarProblem {
  title: string;
  difficulty: "Easy" | "Medium" | "Hard" | string;
  id: string;
}

export interface AnimationVariable {
  name: string;
  value: string;
}

export interface AnimationStep {
  stepIndex: number;
  note: string;
  pointers: Record<string, number>;
  highlightedIndexes: number[];
  variables: AnimationVariable[];
}

export interface AnimationData {
  title: string;
  elements: string[];
  steps: AnimationStep[];
}

export interface ProblemPackage {
  id: string;
  leetcodeId: string;
  problemTitle: string;
  difficulty: "Easy" | "Medium" | "Hard";
  language: string;
  code: string;
  tags: string[];
  createdAt: string;
  lastReviewedAt: string;
  nextReviewAt: string;
  memoryStrength: number; // 0 to 100
  voiceTranscript: string;
  structuredExplanation: string;
  keyIntuition: string;
  coreObservation: string;
  whyThisApproach: string;
  timeComplexity: string;
  timeComplexityExplanation: string;
  spaceComplexity: string;
  spaceComplexityExplanation: string;
  commonMistakes: string[];
  similarProblems: SimilarProblem[];
  interviewExplanation: string;
  animationType: "two_pointers" | "sliding_window" | "binary_search" | "tree_traversal" | "dp_table" | "general" | string;
  animationData: AnimationData;
}

export interface SearchResponse {
  matchedIds: string[];
  responseMessage: string;
}
