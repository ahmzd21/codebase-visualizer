const AIInsight = require("../../models/AIInsight");
const File = require("../../models/File");
const Graph = require("../../models/Graph");
const AppError = require("../../utils/AppError");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const requireCompleted = (repo) => {
  if (repo.status !== "completed") {
    throw new AppError(
      "Repository analysis is not yet complete. Please poll /api/jobs/:jobId for progress.",
      202,
      "ANALYSIS_INCOMPLETE"
    );
  }
};

// Call the Gemini API using native fetch (Node 18+)
const callGemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AppError("AI service is not configured. Add GEMINI_API_KEY to your .env file.", 503, "AI_NOT_CONFIGURED");
  }

  // Using v1beta since v1 was returning 404 for this specific model/endpoint combo
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  }
  );

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error("[Gemini API Error]", res.status, errBody);
    throw new AppError("AI service request failed.", 502, "AI_SERVICE_ERROR");
  }

  const data = await res.json();

  try {
    let rawText = data.candidates[0].content.parts[0].text;
    // Strip markdown code fences if Gemini wraps the response (e.g. ```json ... ```)
    rawText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    return JSON.parse(rawText);
  } catch (err) {
    console.error("[Gemini Parse Error]", err.message);
    throw new AppError("Failed to parse AI response.", 500, "AI_PARSE_ERROR");
  }
};

// ─── Get cached insight ───────────────────────────────────────────────────────

const getCachedInsight = async (repoId) => {
  return AIInsight.findOne({ repoId });
};

// ─── Generate full insight ────────────────────────────────────────────────────

const generateInsight = async (repo) => {
  requireCompleted(repo);

  // Delete any existing insight for this repo (regenerate)
  await AIInsight.deleteMany({ repoId: repo._id });

  // Gather context
  const files = await File.find({ repoId: repo._id });
  const graph = await Graph.findOne({ repoId: repo._id });

  const totalFiles = files.length;
  const totalComplexity = files.reduce((s, f) => s + f.complexity, 0);
  const avgComplexity =
    totalFiles > 0 ? (totalComplexity / totalFiles).toFixed(2) : 0;
  const maxComplexityFile = files.reduce(
    (max, f) => (f.complexity > max.complexity ? f : max),
    files[0] || { path: "N/A", complexity: 0 }
  );
  const languageBreakdown = files.reduce((acc, f) => {
    acc[f.language] = (acc[f.language] || 0) + 1;
    return acc;
  }, {});

  const fileList = files
    .slice(0, 50) // Cap to avoid huge prompts
    .map((f) => `${f.path} (${f.language}) imports: [${f.imports.join(", ")}]`)
    .join("\n");

  const nodeCount = graph ? graph.nodes.length : 0;
  const edgeCount = graph ? graph.edges.length : 0;

  const prompt = `You are a senior software architect. Analyze the following repository data and provide a comprehensive architectural insight.

Repository: ${repo.repoName} (${repo.repoUrl})
Total files: ${totalFiles}
Languages: ${JSON.stringify(languageBreakdown)}
Average complexity: ${avgComplexity}
Most complex file: ${maxComplexityFile.path} (complexity: ${maxComplexityFile.complexity})
Dependency graph: ${nodeCount} nodes, ${edgeCount} edges

File list with imports (first 50):
${fileList}

Respond with a JSON object matching this exact schema:
{
  "summary": "A 2-3 paragraph summary of the codebase architecture, purpose, organization, and key patterns.",
  "architecturePatterns": ["Pattern1", "Pattern2"],
  "risks": ["Risk description 1", "Risk description 2"],
  "refactoringSuggestions": ["Suggestion 1", "Suggestion 2"],
  "overallScore": 72
}

Rules:
- "summary" should be detailed and written for a developer new to the codebase.
- "architecturePatterns" should list 2-5 patterns you observe (e.g. "MVC", "Modular Monolith", "Event-driven").
- "risks" should list 2-5 concrete risks or code smells.
- "refactoringSuggestions" should list 3-5 actionable, specific suggestions.
- "overallScore" is a health score from 0-100 based on complexity, modularity, and maintainability.
- Return ONLY valid JSON — no markdown fences, no extra text.`;

  const parsed = await callGemini(prompt);

  const insight = await AIInsight.create({
    repoId: repo._id,
    summary: parsed.summary || "",
    architecturePatterns: parsed.architecturePatterns || [],
    risks: parsed.risks || [],
    refactoringSuggestions: parsed.refactoringSuggestions || [],
    overallScore:
      typeof parsed.overallScore === "number" ? parsed.overallScore : null,
  });

  return insight;
};

// ─── Chat with Codebase ───────────────────────────────────────────────────────

const callGeminiChat = async (contents, systemInstructionText) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AppError("AI service is not configured. Add GEMINI_API_KEY to your .env file.", 503, "AI_NOT_CONFIGURED");
  }
  
  const body = { contents };
  if (systemInstructionText) {
    body.systemInstruction = {
      parts: [{ text: systemInstructionText }]
    };
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error("[Gemini API Error]", res.status, errBody);
    throw new AppError("AI service request failed.", 502, "AI_SERVICE_ERROR");
  }

  const data = await res.json();
  try {
    return data.candidates[0].content.parts[0].text;
  } catch (err) {
    console.error("[Gemini Parse Error]", err.message);
    throw new AppError("Failed to parse AI response.", 500, "AI_PARSE_ERROR");
  }
};

const chatAboutCodebase = async (repo, message, history) => {
  requireCompleted(repo);
  
  const files = await File.find({ repoId: repo._id });
  
  let context = `You are a helpful AI assistant that answers questions about the codebase.\nCodebase Name: ${repo.repoName}\n\n`;
  context += `Here is the contents of the files in the repository:\n\n`;
  
  for (const f of files) {
    if (f.content) {
      context += `--- File: ${f.path} ---\n\`\`\`\n${f.content}\n\`\`\`\n\n`;
    }
  }
  
  const contents = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));
  
  contents.push({
    role: 'user',
    parts: [{ text: message }]
  });
  
  const responseText = await callGeminiChat(contents, context);
  return responseText;
};

const generateChatTitle = async (message) => {
  try {
    const contents = [{
      role: 'user',
      parts: [{ text: `Generate a very short title (2-5 words) summarizing this request. Do NOT use quotes or punctuation in the title:\n\n${message}` }]
    }];
    let title = await callGeminiChat(contents);
    title = title.replace(/['"]/g, '').trim();
    if (title.length > 50) title = title.substring(0, 50) + "...";
    return title;
  } catch (err) {
    return "New Chat";
  }
};

module.exports = { getCachedInsight, generateInsight, chatAboutCodebase, generateChatTitle };
