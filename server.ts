import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let currentDir = "";
try {
  currentDir = path.dirname(fileURLToPath(import.meta.url));
} catch (e) {
  currentDir = typeof __dirname !== "undefined" ? __dirname : "";
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

const DATA_DIR = path.join(currentDir, "data");
const DATA_FILE = path.join(DATA_DIR, "memory_bank.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Seed mock data if it doesn't exist
const initialProblems = [
  {
    id: "two-sum-ii",
    problemTitle: "Two Sum II - Input Array Is Sorted",
    leetcodeId: "167",
    difficulty: "Medium",
    language: "TypeScript",
    code: `function twoSum(numbers: number[], target: number): number[] {
    let left = 0;
    let right = numbers.length - 1;
    
    while (left < right) {
        const sum = numbers[left] + numbers[right];
        if (sum === target) {
            return [left + 1, right + 1];
        } else if (sum < target) {
            left++;
        } else {
            right--;
        }
    }
    return [];
}`,
    tags: ["Two Pointers", "Array", "Binary Search"],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    lastReviewedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    nextReviewAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    memoryStrength: 85,
    voiceTranscript: "We start with two pointers at the very ends of the sorted array. If their sum is less than target, we need a larger value, so we move the left pointer forward. If the sum is greater than target, we need a smaller value, so we shift the right pointer backward. Since it is sorted, this is perfect.",
    structuredExplanation: "The two-pointer technique avoids the O(N^2) brute force scan. By leveraging the sorted property, we can adjust pointers inward depending on whether our sum is too small or too large, shrinking the search space by 1 element in O(1) at each step.",
    keyIntuition: "Because the array is sorted, we can make binary decisions: moving the left pointer strictly increases the sum, and moving the right pointer strictly decreases the sum.",
    coreObservation: "The sum changes predictably with pointer movements. This eliminates the need to test every pair combination.",
    whyThisApproach: "Binary search could be run for each element in O(N log N), but Two Pointers achieves O(N) time with only O(1) space.",
    timeComplexity: "O(N)",
    timeComplexityExplanation: "In the worst case, each element is visited at most once as the pointers converge.",
    spaceComplexity: "O(1)",
    spaceComplexityExplanation: "We only store two integer pointers, which requires constant extra space.",
    commonMistakes: [
      "1-based indexing correction: LeetCode requires returning index + 1, not index.",
      "Assuming the array can be empty (constraints say numbers length is at least 2)."
    ],
    similarProblems: [
      { title: "Two Sum", difficulty: "Easy", id: "1" },
      { title: "3Sum", difficulty: "Medium", id: "15" },
      { title: "Container With Most Water", difficulty: "Medium", id: "11" }
    ],
    interviewExplanation: "To solve Two Sum II, we utilize a two-pointer approach starting from the leftmost and rightmost indexes. Since the input array is already sorted, we check the sum of the two pointers. If it matches the target, we return their 1-based indices. If it's less, we increment the left pointer to increase the sum. If it's more, we decrement the right pointer to reduce the sum. This achieves optimal O(N) time complexity and constant O(1) space complexity.",
    animationType: "two_pointers",
    animationData: {
      title: "Finding target sum of 9 in sorted array",
      elements: ["2", "3", "5", "7", "11", "15"],
      steps: [
        {
          stepIndex: 1,
          note: "Initialize pointers. Left (L) points to index 0 (val 2). Right (R) points to index 5 (val 15).",
          pointers: { left: 0, right: 5 },
          highlightedIndexes: [0, 5],
          variables: [
            { name: "Target", value: "9" },
            { name: "Current Sum (2 + 15)", value: "17" },
            { name: "Decision", value: "Sum 17 > 9. Move Right pointer to decrease sum." }
          ]
        },
        {
          stepIndex: 2,
          note: "Right pointer moves left to index 4 (val 11). Left remains at 0 (val 2).",
          pointers: { left: 0, right: 4 },
          highlightedIndexes: [0, 4],
          variables: [
            { name: "Target", value: "9" },
            { name: "Current Sum (2 + 11)", value: "13" },
            { name: "Decision", value: "Sum 13 > 9. Move Right pointer to decrease sum." }
          ]
        },
        {
          stepIndex: 3,
          note: "Right pointer moves left to index 3 (val 7). Left remains at 0 (val 2).",
          pointers: { left: 0, right: 3 },
          highlightedIndexes: [0, 3],
          variables: [
            { name: "Target", value: "9" },
            { name: "Current Sum (2 + 7)", value: "9" },
            { name: "Decision", value: "Sum 9 === 9. TARGET FOUND! Return indices [1, 4]." }
          ]
        }
      ]
    }
  },
  {
    id: "sliding-window-sum",
    problemTitle: "Minimum Size Subarray Sum",
    leetcodeId: "209",
    difficulty: "Medium",
    language: "TypeScript",
    code: `function minSubArrayLen(target: number, nums: number[]): number {
    let minLength = Infinity;
    let sum = 0;
    let left = 0;
    
    for (let right = 0; right < nums.length; right++) {
        sum += nums[right];
        
        while (sum >= target) {
            minLength = Math.min(minLength, right - left + 1);
            sum -= nums[left];
            left++;
        }
    }
    
    return minLength === Infinity ? 0 : minLength;
}`,
    tags: ["Sliding Window", "Array", "Two Pointers"],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    lastReviewedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    nextReviewAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Overdue!
    memoryStrength: 42,
    voiceTranscript: "We expand the window with a right pointer. Once our sum becomes equal to or larger than the target, we try to shrink it from the left. While the sum remains valid, we update our minimum length, subtract the left element, and slide the left pointer right. This finds the shortest valid subarray.",
    structuredExplanation: "This sliding window approach maintains a dynamic subarray that satisfies the sum requirement. Instead of re-summing subarrays (which would be O(N^2)), we add new elements at the right and subtract elements from the left in an amortized O(N) fashion.",
    keyIntuition: "Since all numbers are positive, adding elements strictly increases the sum, and removing elements strictly decreases it. This allows us to use a sliding window.",
    coreObservation: "We don't need to check all subarrays starting at every index. Once we find a valid window, any larger window starting at the same left pointer is redundant.",
    whyThisApproach: "Brute forcing all subarrays is O(N^2). Sliding window keeps track of a sliding sum in O(N).",
    timeComplexity: "O(N)",
    timeComplexityExplanation: "Each element is processed at most twice: once by the right pointer (addition) and once by the left pointer (subtraction).",
    spaceComplexity: "O(1)",
    spaceComplexityExplanation: "We only use primitive variables (left, sum, minLength) which consumes constant space.",
    commonMistakes: [
      "Returning Infinity instead of 0 when no such subarray exists.",
      "Using an 'if' instead of a 'while' loop to shrink the left pointer, missing opportunities to shrink multiple times."
    ],
    similarProblems: [
      { title: "Longest Substring Without Repeating Characters", difficulty: "Medium", id: "3" },
      { title: "Fruit Into Baskets", difficulty: "Medium", id: "904" }
    ],
    interviewExplanation: "To solve Minimum Size Subarray Sum, we use a sliding window with left and right pointers. We iterate through the array using the right pointer, adding each value to our running sum. When the sum is greater than or equal to the target, we contract the window from the left by updating our minimum length, subtracting the left value from the sum, and moving the left pointer right. We repeat this contraction as long as the sum is valid. This guarantees an O(N) time complexity and O(1) auxiliary space.",
    animationType: "sliding_window",
    animationData: {
      title: "Finding smallest subarray sum >= 7",
      elements: ["2", "3", "1", "2", "4", "3"],
      steps: [
        {
          stepIndex: 1,
          note: "Start. Expand window by moving right pointer. Right = 0 (val 2). Sum = 2. Valid sum? No (2 < 7).",
          pointers: { left: 0, right: 0 },
          highlightedIndexes: [0],
          variables: [
            { name: "Target", value: "7" },
            { name: "Running Sum", value: "2" },
            { name: "Min Subarray Len", value: "None" }
          ]
        },
        {
          stepIndex: 2,
          note: "Expand window. Right = 1 (val 3). Sum = 5. Valid sum? No (5 < 7).",
          pointers: { left: 0, right: 1 },
          highlightedIndexes: [0, 1],
          variables: [
            { name: "Target", value: "7" },
            { name: "Running Sum", value: "5" },
            { name: "Min Subarray Len", value: "None" }
          ]
        },
        {
          stepIndex: 3,
          note: "Expand window. Right = 2 (val 1). Sum = 6. Valid sum? No (6 < 7).",
          pointers: { left: 0, right: 2 },
          highlightedIndexes: [0, 1, 2],
          variables: [
            { name: "Target", value: "7" },
            { name: "Running Sum", value: "6" },
            { name: "Min Subarray Len", value: "None" }
          ]
        },
        {
          stepIndex: 4,
          note: "Expand window. Right = 3 (val 2). Sum = 8. Valid sum? YES (8 >= 7). Update Min Len to (3 - 0 + 1) = 4.",
          pointers: { left: 0, right: 3 },
          highlightedIndexes: [0, 1, 2, 3],
          variables: [
            { name: "Target", value: "7" },
            { name: "Running Sum", value: "8" },
            { name: "Min Subarray Len", value: "4" }
          ]
        },
        {
          stepIndex: 5,
          note: "Sum is valid. Try to contract window from left. Subtract left index 0 (val 2). Left moves to 1. Sum = 6. Valid sum? No (6 < 7).",
          pointers: { left: 1, right: 3 },
          highlightedIndexes: [1, 2, 3],
          variables: [
            { name: "Target", value: "7" },
            { name: "Running Sum", value: "6" },
            { name: "Min Subarray Len", value: "4" }
          ]
        },
        {
          stepIndex: 6,
          note: "Expand window. Right = 4 (val 4). Sum = 10. Valid sum? YES (10 >= 7). Update Min Len to (4 - 1 + 1) = 4 (no change).",
          pointers: { left: 1, right: 4 },
          highlightedIndexes: [1, 2, 3, 4],
          variables: [
            { name: "Target", value: "7" },
            { name: "Running Sum", value: "10" },
            { name: "Min Subarray Len", value: "4" }
          ]
        },
        {
          stepIndex: 7,
          note: "Sum is valid. Contract window from left. Subtract index 1 (val 3). Left moves to 2. Sum = 7. Valid sum? YES (7 >= 7). Record smaller Min Len = (4 - 2 + 1) = 3!",
          pointers: { left: 2, right: 4 },
          highlightedIndexes: [2, 3, 4],
          variables: [
            { name: "Target", value: "7" },
            { name: "Running Sum", value: "7" },
            { name: "Min Subarray Len", value: "3" }
          ]
        },
        {
          stepIndex: 8,
          note: "Sum is valid. Contract window from left. Subtract index 2 (val 1). Left moves to 3. Sum = 6. Valid sum? No.",
          pointers: { left: 3, right: 4 },
          highlightedIndexes: [3, 4],
          variables: [
            { name: "Target", value: "7" },
            { name: "Running Sum", value: "6" },
            { name: "Min Subarray Len", value: "3" }
          ]
        },
        {
          stepIndex: 9,
          note: "Expand window. Right = 5 (val 3). Sum = 9. Valid sum? YES (9 >= 7). Update Min Len? (5 - 3 + 1) = 3 (no change).",
          pointers: { left: 3, right: 5 },
          highlightedIndexes: [3, 4, 5],
          variables: [
            { name: "Target", value: "7" },
            { name: "Running Sum", value: "9" },
            { name: "Min Subarray Len", value: "3" }
          ]
        },
        {
          stepIndex: 10,
          note: "Sum is valid. Contract window from left. Subtract index 3 (val 2). Left moves to 4. Sum = 7. Valid sum? YES (7 >= 7). Record smaller Min Len = (5 - 4 + 1) = 2!",
          pointers: { left: 4, right: 5 },
          highlightedIndexes: [4, 5],
          variables: [
            { name: "Target", value: "7" },
            { name: "Running Sum", value: "7" },
            { name: "Min Subarray Len", value: "2" }
          ]
        }
      ]
    }
  }
];

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(initialProblems, null, 2), "utf-8");
}

// Read problems from file
function readProblems() {
  try {
    const data = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading problems file:", error);
    return [];
  }
}

// Write problems to file
function writeProblems(problems: any[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(problems, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing problems file:", error);
  }
}

// API Routes

// Get all problems
app.get("/api/problems", (req, res) => {
  const problems = readProblems();
  res.json(problems);
});

// Process a solved problem with Gemini
app.post("/api/problems/process", async (req, res) => {
  try {
    const { problemTitle, difficulty, language, code, tags, voiceBase64, voiceText } = req.body;

    if (!problemTitle || !code) {
      return res.status(400).json({ error: "Problem title and code are required." });
    }

    console.log("Analyzing problem submission with Gemini:", problemTitle);

    let promptParts: any[] = [];
    
    // If we have an actual base64 voice recording, let's feed it directly to Gemini!
    if (voiceBase64) {
      console.log("Sending actual voice file to Gemini for multimodal translation and reasoning...");
      promptParts.push({
        inlineData: {
          mimeType: "audio/webm", // Standard audio mime-type from browser media recorders
          data: voiceBase64,
        }
      });
    }

    const textPrompt = `
You are the CodeRecall AI Engine, an intelligent second brain that documents the thought process of software engineers on LeetCode.
We just solved an algorithmic problem. Below are the details:

Problem Title: ${problemTitle}
LeetCode Difficulty: ${difficulty}
Programming Language: ${language}
Selected Tags: ${tags ? tags.join(", ") : "None"}

Here is the accepted code solution:
\`\`\`${language.toLowerCase()}
${code}
\`\`\`

User's spoken/text brief explanation of their intuition:
"${voiceText || (voiceBase64 ? "The user provided a voice recording of their explanation. Please listen to it and transcribe/integrate it." : "The user skipped writing an explanation. Please extract the intuition entirely from their code.")}"

YOUR TASK:
1. Listen and transcribe the user's voice explanation (if audio is provided). Clean up filler words, and capture their precise algorithm intuition, optimizations, reasoning, and mistakes avoided. If no audio is provided, write a clean narrative as if the user was explaining their own intuition in the first person.
2. Formulate a comprehensive structured review package in JSON format.
3. The package MUST strictly follow the requested JSON schema.
4. Critically: Under "animationData", design a step-by-step visual animation scenario of 4 to 8 elements (for arrays, trees, or DP states) that demonstrates the exact logic of the user's code on a small concrete sample input. For Two Pointers, Slide Left/Right pointers. For Sliding Window, expand/shrink. For Binary Search, show low/mid/high. Ensure pointers and highlightedIndices change correctly and predictably.
`;

    promptParts.push({ text: textPrompt });

    // Call Gemini with the structured response schema
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptParts,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            voiceTranscript: { 
              type: Type.STRING, 
              description: "Accurate transcription of the user's spoken voice explanation, or cleaned-up first-person narrative text of their solution reasoning." 
            },
            structuredExplanation: { 
              type: Type.STRING, 
              description: "Clean step-by-step technical breakdown of the code and algorithm logic." 
            },
            keyIntuition: { 
              type: Type.STRING, 
              description: "The core breakthrough observation or trick of this solution." 
            },
            coreObservation: { 
              type: Type.STRING, 
              description: "The primary mathematical or structural observation that makes this approach possible." 
            },
            whyThisApproach: { 
              type: Type.STRING, 
              description: "Comparison explaining why this approach is superior to other approaches (e.g. brute force)." 
            },
            timeComplexity: { 
              type: Type.STRING, 
              description: "Time complexity e.g., O(N) or O(N log N)" 
            },
            timeComplexityExplanation: { 
              type: Type.STRING, 
              description: "Short, precise reasoning for the time complexity" 
            },
            spaceComplexity: { 
              type: Type.STRING, 
              description: "Space complexity e.g., O(1) or O(N)" 
            },
            spaceComplexityExplanation: { 
              type: Type.STRING, 
              description: "Short, precise reasoning for the space complexity" 
            },
            commonMistakes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of 2-3 common pitfalls, off-by-one errors, overflow problems, or edge cases for this problem."
            },
            similarProblems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  difficulty: { type: Type.STRING, description: "Easy, Medium, or Hard" },
                  id: { type: Type.STRING, description: "LeetCode problem ID number (as a string)" }
                },
                required: ["title", "difficulty"]
              }
            },
            interviewExplanation: { 
              type: Type.STRING, 
              description: "A concise verbal answer of 3-4 sentences, written in active first-person, perfect for explaining this solution clearly and confidently during a live technical interview." 
            },
            animationType: { 
              type: Type.STRING, 
              description: "Type of animation, must be one of: 'two_pointers', 'sliding_window', 'binary_search', 'tree_traversal', 'dp_table', or 'general'" 
            },
            animationData: {
              type: Type.OBJECT,
              description: "Details for animating the execution on an illustrative sample array or list.",
              properties: {
                title: { type: Type.STRING, description: "Descriptive scenario name, e.g., 'Summing to target in sorted array'." },
                elements: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "An array of 4 to 8 stringified elements representing the sequence (e.g., ['1', '3', '5'] or node labels)."
                },
                steps: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      stepIndex: { type: Type.INTEGER },
                      note: { type: Type.STRING, description: "Action text for this step (e.g. 'Left incremented')." },
                      pointers: {
                        type: Type.OBJECT,
                        description: "Map of pointer labels to their array element index, e.g. { 'left': 0, 'right': 4 } or { 'mid': 2 }."
                      },
                      highlightedIndexes: {
                        type: Type.ARRAY,
                        items: { type: Type.INTEGER },
                        description: "Indices that should be highlighted as active in this step."
                      },
                      variables: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING },
                            value: { type: Type.STRING }
                          },
                          required: ["name", "value"]
                        },
                        description: "List of key-value variables to display at this step (e.g., running sum, min length)."
                      }
                    },
                    required: ["stepIndex", "note"]
                  }
                }
              },
              required: ["title", "elements", "steps"]
            }
          },
          required: [
            "voiceTranscript",
            "structuredExplanation",
            "keyIntuition",
            "coreObservation",
            "whyThisApproach",
            "timeComplexity",
            "timeComplexityExplanation",
            "spaceComplexity",
            "spaceComplexityExplanation",
            "commonMistakes",
            "similarProblems",
            "interviewExplanation",
            "animationType",
            "animationData"
          ]
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");

    // Add metadata for user problem package
    const newProblem = {
      id: "prob-" + Date.now(),
      problemTitle,
      leetcodeId: req.body.leetcodeId || Math.floor(Math.random() * 1000 + 1).toString(),
      difficulty: difficulty || "Medium",
      language: language || "TypeScript",
      code,
      tags: tags || [parsedData.animationType === "two_pointers" ? "Two Pointers" : parsedData.animationType === "sliding_window" ? "Sliding Window" : "Array"],
      createdAt: new Date().toISOString(),
      lastReviewedAt: new Date().toISOString(),
      nextReviewAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // next review in 1 day
      memoryStrength: 100,
      ...parsedData,
    };

    // Let frontend save to Firestore under user's document
    res.json(newProblem);
  } catch (error: any) {
    console.error("Error processing problem with Gemini:", error);
    res.status(500).json({ error: error.message || "Failed to process solution with Gemini AI." });
  }
});

// Update review status / memory strength
app.post("/api/problems/review", (req, res) => {
  const { id, rating } = req.body; // rating from 1 to 5
  if (!id || !rating) {
    return res.status(400).json({ error: "Problem ID and rating are required." });
  }

  const problems = readProblems();
  const problemIndex = problems.findIndex((p: any) => p.id === id);

  if (problemIndex === -1) {
    return res.status(404).json({ error: "Problem not found." });
  }

  const problem = problems[problemIndex];

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

  problem.lastReviewedAt = new Date().toISOString();
  problem.nextReviewAt = new Date(Date.now() + interval * 24 * 60 * 60 * 1000).toISOString();
  problem.memoryStrength = Math.min(100, Math.max(10, Math.round(problem.memoryStrength * multiplier)));

  problems[problemIndex] = problem;
  writeProblems(problems);

  res.json({ success: true, problem });
});

// Delete a saved problem package
app.post("/api/problems/delete", (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "Problem ID is required." });
  }

  const problems = readProblems();
  const filtered = problems.filter((p: any) => p.id !== id);
  writeProblems(filtered);

  res.json({ success: true });
});

// AI Search and Memory Palace Chat
app.post("/api/problems/search", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Query is required." });
    }

    const problems = req.body.problems || readProblems();

    // Pass problem titles, tags, complexities, and mistakes to Gemini to filter
    const searchPrompt = `
You are CodeRecall AI's Memory Retrieval Engine.
The user is searching across their solved LeetCode problems memory bank.
Here is the user's search query:
"${query}"

Below is the list of all their saved problems in their memory bank:
${JSON.stringify(
  problems.map((p: any) => ({
    id: p.id,
    leetcodeId: p.leetcodeId,
    title: p.problemTitle,
    difficulty: p.difficulty,
    tags: p.tags,
    timeComplexity: p.timeComplexity,
    spaceComplexity: p.spaceComplexity,
    keyIntuition: p.keyIntuition,
    commonMistakes: p.commonMistakes,
  })),
  null,
  2
)}

Based on the user's request, perform two tasks:
1. Identify the list of problem IDs that match their query (whether by tag, algorithm type, time complexity, or mistakes). Be generous with matches.
2. Provide a helpful, friendly AI explanation of 2-3 sentences responding to their query, summarizing what they have in their memory bank regarding this search and offering a tip.

Return your response strictly in JSON format using this schema:
{
  "matchedIds": ["id1", "id2"],
  "responseMessage": "A short conversational summary of what was found."
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: searchPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchedIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "The list of IDs of problems that match the query criteria."
            },
            responseMessage: {
              type: Type.STRING,
              description: "Friendly summary message explaining what was retrieved and why, with advice."
            }
          },
          required: ["matchedIds", "responseMessage"]
        }
      }
    });

    const parsedResult = JSON.parse(response.text || "{}");
    res.json(parsedResult);
  } catch (error: any) {
    console.error("Error in memory search:", error);
    res.status(500).json({ error: error.message || "Failed to search memories." });
  }
});

// Vite Middleware & Static Serves
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CodeRecall AI running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
