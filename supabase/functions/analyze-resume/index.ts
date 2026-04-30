import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OLLAMA_URL = "http://host.docker.internal:11434";

function cosineSimilarity(vecA: number[], vecB: number[]) {
  let dotProduct = 0;
  let mA = 0;
  let mB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    mA += vecA[i] * vecA[i];
    mB += vecB[i] * vecB[i];
  }
  mA = Math.sqrt(mA);
  mB = Math.sqrt(mB);
  return dotProduct / (mA * mB);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { resume_text, job_description, resume_filename } = await req.json();

    if (!resume_text || !job_description) {
      return new Response(JSON.stringify({ error: "Missing resume text or job description. (Local Ollama requires text input)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Get Embeddings for Semantic Matching
    const [resumeEmbedRes, jdEmbedRes] = await Promise.all([
      fetch(`${OLLAMA_URL}/api/embeddings`, {
        method: "POST",
        body: JSON.stringify({ model: "nomic-embed-text", prompt: resume_text }),
      }),
      fetch(`${OLLAMA_URL}/api/embeddings`, {
        method: "POST",
        body: JSON.stringify({ model: "nomic-embed-text", prompt: job_description }),
      }),
    ]);

    if (!resumeEmbedRes.ok || !jdEmbedRes.ok) {
      throw new Error("Failed to get embeddings from Ollama (nomic-embed-text)");
    }

    const [resumeData, jdData] = await Promise.all([resumeEmbedRes.json(), jdEmbedRes.json()]);
    const similarity = cosineSimilarity(resumeData.embedding, jdData.embedding);
    const semanticScore = Math.round(similarity * 100);

    // 2. Get Structured Analysis using llama3
    const systemPrompt = `You are NEXUS, an elite AI recruiter. Analyze the candidate's resume against the job description.
Return a JSON object with these fields:
{
  "candidate_name": "string",
  "analysis": "2-4 sentence executive summary of fit.",
  "top_skills": ["string"],
  "missing_skills": ["string"],
  "shortlist_status": boolean (true if fit is strong)
}
Ensure the output is valid JSON and nothing else.`;

    const chatRes = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `JOB DESCRIPTION:\n${job_description}\n\nRESUME:\n${resume_text}` },
        ],
        stream: false,
        format: "json",
      }),
    });

    if (!chatRes.ok) {
      throw new Error(`Ollama chat error: ${chatRes.statusText}`);
    }

    const chatData = await chatRes.json();
    const analysis = JSON.parse(chatData.message.content);

    // 3. Combine Score and Analysis
    const result = {
      ...analysis,
      match_score: semanticScore,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-resume error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
