import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OLLAMA_URL = "http://host.docker.internal:11434"; // Standard for Supabase local dev

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { jd_text } = await req.json();

    if (!jd_text) {
      return new Response(JSON.stringify({ error: "Missing job description text. (Ollama llama3 requires text input)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are NEXUS, an elite AI recruiter. Analyze the job description and return a JSON object with these fields:
{
  "title": "string",
  "company": "string",
  "summary": "string",
  "key_skills": ["string"],
  "experience_requirements": "string",
  "nice_to_haves": ["string"],
  "full_text": "string"
}
Ensure the output is valid JSON and nothing else. Focus on core technical skills and work experience.`;

    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this JD:\n${jd_text}` },
        ],
        stream: false,
        format: "json",
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama error: ${res.statusText}`);
    }

    const data = await res.json();
    const parsed = JSON.parse(data.message.content);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-jd error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
