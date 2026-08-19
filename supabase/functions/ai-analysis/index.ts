import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ProfileInput {
  accountAge: string;
  accountAgeValue?: string;
  profilePhoto: boolean | null;
  verifiedStatus: boolean | null;
  followersCount: string;
  connectionsCount: string;
  profileInfoConsistent: boolean | null;
  requestsMoney: boolean | null;
  requestsPersonalInfo: boolean | null;
  urgencyPressure: boolean | null;
  suspiciousDetails: string;
  platform: string;
  displayName: string;
}

interface RuleBasedResult {
  score: number;
  level: string;
  factors: { name: string; level: string; score: number; explanation: string }[];
  warningSigns: { title: string; explanation: string; severity: string }[];
  recommendations: { text: string; priority: string }[];
  confidence: string;
  completeness: number;
}

function levelFromScore(score: number): string {
  if (score >= 67) return "High";
  if (score >= 34) return "Medium";
  return "Low";
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { profile, ruleBased } = await req.json() as { profile: ProfileInput; ruleBased: RuleBasedResult };

    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiKey) {
      // Graceful fallback — return the rule-based result enhanced
      return new Response(
        JSON.stringify({
          ...enhancedFallback(profile, ruleBased),
          source: "fallback",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = buildPrompt(profile, ruleBased);

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an online identity safety assistant. You help users recognize potential warning signs in online profiles. You NEVER claim to prove someone is fake or fraudulent. You use cautious language like 'shows potential warning signs' and 'insufficient to verify identity'. You return ONLY valid JSON.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error("OpenAI error:", errText);
      return new Response(
        JSON.stringify({
          ...enhancedFallback(profile, ruleBased),
          source: "fallback",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiData = await openaiRes.json();
    const content = openaiData.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({
          ...enhancedFallback(profile, ruleBased),
          source: "fallback",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = JSON.parse(content);

    // Validate and normalize
    const result = {
      available: true,
      riskAssessment: parsed.riskAssessment || ruleBased.level,
      riskScore: clamp(parsed.riskScore ?? ruleBased.score),
      factors: (parsed.factors || []).map((f: any) => ({
        name: f.name,
        level: f.level,
        score: clamp(f.score),
        explanation: f.explanation,
      })),
      warningSigns: parsed.warningSigns || [],
      recommendations: parsed.recommendations || [],
      explanation: parsed.explanation || "",
      confidence: parsed.confidence || "Moderate confidence",
      source: "ai",
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Function error:", err);
    return new Response(
      JSON.stringify({
        available: true,
        riskAssessment: "Medium",
        riskScore: 50,
        factors: [],
        warningSigns: [],
        recommendations: [],
        explanation: "AI analysis encountered an error. Please rely on the rule-based assessment.",
        confidence: "Low confidence",
        source: "fallback",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildPrompt(profile: ProfileInput, ruleBased: RuleBasedResult): string {
  const fields: string[] = [];
  fields.push(`Platform: ${profile.platform || "not specified"}`);
  fields.push(`Display name: ${profile.displayName || "not specified"}`);
  fields.push(`Account age: ${profile.accountAge || "unknown"}${profile.accountAgeValue ? ` (${profile.accountAgeValue})` : ""}`);
  fields.push(`Profile photo present: ${profile.profilePhoto === null ? "not provided" : profile.profilePhoto ? "yes" : "no"}`);
  fields.push(`Verified status: ${profile.verifiedStatus === null ? "not provided" : profile.verifiedStatus ? "verified" : "not verified"}`);
  fields.push(`Followers count: ${profile.followersCount || "not provided"}`);
  fields.push(`Connections count: ${profile.connectionsCount || "not provided"}`);
  fields.push(`Profile info consistent: ${profile.profileInfoConsistent === null ? "not provided" : profile.profileInfoConsistent ? "yes" : "no"}`);
  fields.push(`Requests money: ${profile.requestsMoney === null ? "not provided" : profile.requestsMoney ? "yes" : "no"}`);
  fields.push(`Requests personal information: ${profile.requestsPersonalInfo === null ? "not provided" : profile.requestsPersonalInfo ? "yes" : "no"}`);
  fields.push(`Urgency/pressure: ${profile.urgencyPressure === null ? "not provided" : profile.urgencyPressure ? "yes" : "no"}`);
  fields.push(`Suspicious details: ${profile.suspiciousDetails || "none provided"}`);
  fields.push(`Rule-based score: ${ruleBased.score}/100 (${ruleBased.level})`);
  fields.push(`Information completeness: ${ruleBased.completeness}%`);

  return `Analyze this online profile for safety risk. Return ONLY a JSON object with this exact structure:

{
  "riskAssessment": "Low" | "Medium" | "High",
  "riskScore": number 0-100,
  "factors": [
    {"name": "Identity Consistency", "level": "Low"|"Medium"|"High", "score": 0-100, "explanation": "contextual explanation specific to THIS profile"},
    {"name": "Social Engineering Risk", "level": "...", "score": ..., "explanation": "..."},
    {"name": "Financial Request Risk", "level": "...", "score": ..., "explanation": "..."},
    {"name": "Privacy Risk", "level": "...", "score": ..., "explanation": "..."},
    {"name": "Urgency/Manipulation Risk", "level": "...", "score": ..., "explanation": "..."},
    {"name": "Profile Credibility Signals", "level": "...", "score": ..., "explanation": "..."}
  ],
  "warningSigns": [
    {"title": "short title", "explanation": "WHY this matters for THIS specific profile", "severity": "Low"|"Medium"|"High"}
  ],
  "recommendations": [
    {"text": "specific actionable recommendation based on detected risks", "priority": "high"|"medium"|"low"}
  ],
  "explanation": "overall explanation using cautious language - never claim someone is fake, use 'shows potential warning signs', 'insufficient to verify identity'",
  "confidence": "Low confidence" | "Moderate confidence" | "Higher confidence"
}

CRITICAL RULES:
- NEVER say "this person is fake" or "this is a scammer". Use "shows potential warning signs".
- If information is very limited, say the assessment has limited confidence.
- Make explanations SPECIFIC to the entered data, not generic.
- Recommendations must match detected risks (money request -> don't send money, personal info request -> don't share info, urgency -> slow down, inconsistency -> verify independently).
- Confidence refers to information quality/completeness, NOT certainty about identity.

Profile data:
${fields.join("\n")}`;
}

function enhancedFallback(profile: ProfileInput, ruleBased: RuleBasedResult) {
  // Simple enhanced fallback — reuse rule-based with slight adjustments
  let score = ruleBased.score;
  let explanation = "";

  if (ruleBased.completeness <= 30) {
    explanation = "Limited information was provided, so this assessment should not be treated as a reliable indication of identity. The profile shows some potential warning signs, but more information would be needed for a more reliable assessment.";
  } else if (score >= 67) {
    explanation = "This profile shows several potential warning signs that, taken together, indicate a high level of risk. This information is insufficient to verify the person's identity, but the pattern of indicators warrants significant caution.";
  } else if (score >= 34) {
    explanation = "This profile shows some potential warning signs. The information is insufficient to verify the person's identity, so consider independently verifying before sharing sensitive information.";
  } else {
    explanation = "This profile shows few warning signs based on the information provided. However, the absence of warning signs does not prove the person's identity.";
  }

  return {
    available: true,
    riskAssessment: ruleBased.level,
    riskScore: score,
    factors: ruleBased.factors,
    warningSigns: ruleBased.warningSigns,
    recommendations: ruleBased.recommendations,
    explanation,
    confidence: ruleBased.confidence,
  };
}
