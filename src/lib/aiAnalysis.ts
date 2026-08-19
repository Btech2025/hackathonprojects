import type { ProfileInput, RuleBasedResult, AIAnalysisResult, RiskLevel, RiskFactor, WarningSign, Recommendation, ConfidenceLevel } from '@/types';

function levelFromScore(score: number): RiskLevel {
  if (score >= 67) return 'High';
  if (score >= 34) return 'Medium';
  return 'Low';
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Enhanced fallback analysis that mimics the AI layer when no LLM API key is configured.
 * Uses the same risk-factor breakdown but applies deeper contextual reasoning.
 */
export function fallbackAIAnalysis(input: ProfileInput, ruleBased: RuleBasedResult): AIAnalysisResult {
  const factors: RiskFactor[] = [];

  // Identity consistency — deeper reasoning
  let consistencyScore = ruleBased.factors[0].score;
  let consistencyExpl = ruleBased.factors[0].explanation;
  if (input.profileInfoConsistent === false && input.suspiciousDetails.trim()) {
    consistencyScore = Math.min(90, consistencyScore + 10);
    consistencyExpl = `The profile shows inconsistencies, and additional details ("${input.suspiciousDetails.trim()}") further undermine its reliability. This combination suggests the identity may be fabricated or misleading.`;
  }
  factors.push({
    name: 'Identity Consistency',
    level: levelFromScore(consistencyScore),
    score: clamp(consistencyScore),
    explanation: consistencyExpl,
  });

  // Social engineering risk
  let seScore = ruleBased.factors[1].score;
  let seExpl = ruleBased.factors[1].explanation;
  if (input.requestsPersonalInfo === true && input.urgencyPressure === true) {
    seScore = Math.min(95, seScore + 10);
    seExpl = 'The combination of requesting personal information AND applying urgency is a well-documented social engineering pattern. This dual pressure significantly increases the risk that the contact is attempting manipulation.';
  }
  factors.push({
    name: 'Social Engineering Risk',
    level: levelFromScore(seScore),
    score: clamp(seScore),
    explanation: seExpl,
  });

  // Financial request risk
  factors.push({ ...ruleBased.factors[2] });

  // Privacy risk
  factors.push({ ...ruleBased.factors[3] });

  // Urgency / manipulation
  factors.push({ ...ruleBased.factors[4] });

  // Profile credibility — deeper
  let credScore = ruleBased.factors[5].score;
  let credExpl = ruleBased.factors[5].explanation;
  if (input.accountAge === 'new' && input.profilePhoto === false && input.requestsMoney === true) {
    credScore = Math.min(95, credScore + 15);
    credExpl = 'A new account with no profile photo that also requests money shows multiple overlapping credibility deficits. This pattern is strongly associated with fraudulent profiles.';
  }
  factors.push({
    name: 'Profile Credibility Signals',
    level: levelFromScore(credScore),
    score: clamp(credScore),
    explanation: credExpl,
  });

  // Warning signs with contextual explanations
  const warningSigns: WarningSign[] = [...ruleBased.warningSigns];

  // Smart recommendations based on detected risks
  const recommendations: Recommendation[] = [...ruleBased.recommendations];
  if (input.requestsMoney === true && input.urgencyPressure === true) {
    recommendations.unshift({
      text: 'This is a high-risk combination: a request for money combined with urgency. Independently verify the person through a known, trusted channel before considering any action. Do not send money under pressure.',
      priority: 'high',
    });
  }

  const weights = [1.2, 1.3, 1.5, 1.0, 1.1, 1.0];
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const weightedSum = factors.reduce((sum, f, i) => sum + f.score * weights[i], 0);
  const aiScore = clamp(weightedSum / totalWeight);

  let explanation: string;
  if (ruleBased.completeness <= 30) {
    explanation =
      'Limited information was provided, so this assessment should not be treated as a reliable indication of identity. The profile shows several potential warning signs, but more information would be needed for a more reliable assessment.';
  } else if (aiScore >= 67) {
    explanation =
      'This profile shows several potential warning signs that, taken together, indicate a high level of risk. This information is insufficient to verify the person\u2019s identity, but the pattern of indicators warrants significant caution. Consider independently verifying the identity before sharing sensitive information.';
  } else if (aiScore >= 34) {
    explanation =
      'This profile shows some potential warning signs. The information is insufficient to verify the person\u2019s identity, so consider independently verifying before sharing sensitive information or acting on requests.';
  } else {
    explanation =
      'This profile shows few warning signs based on the information provided. However, the absence of warning signs does not prove the person\u2019s identity. Consider independently verifying the identity if you plan to share sensitive information.';
  }

  let confidence: ConfidenceLevel;
  if (ruleBased.completeness <= 30) confidence = 'Low confidence';
  else if (ruleBased.completeness <= 60) confidence = 'Moderate confidence';
  else confidence = 'Higher confidence';

  return {
    available: true,
    riskAssessment: levelFromScore(aiScore),
    riskScore: aiScore,
    factors,
    warningSigns,
    recommendations,
    explanation,
    confidence,
    source: 'fallback',
  };
}

/**
 * Calls the edge function for AI-powered analysis. Falls back to the local
 * enhanced rule-based engine if the edge function is unavailable or errors.
 */
export async function fetchAIAnalysis(input: ProfileInput, ruleBased: RuleBasedResult): Promise<AIAnalysisResult> {
  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-analysis`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ profile: input, ruleBased }),
    });

    if (!res.ok) {
      throw new Error(`Edge function returned ${res.status}`);
    }

    const data = await res.json();
    if (!data || !data.riskAssessment) {
      throw new Error('Invalid response from AI analysis');
    }

    return {
      available: true,
      riskAssessment: data.riskAssessment,
      riskScore: clamp(data.riskScore),
      factors: data.factors || [],
      warningSigns: data.warningSigns || [],
      recommendations: data.recommendations || [],
      explanation: data.explanation || '',
      confidence: data.confidence || 'Moderate confidence',
      source: data.source || 'ai',
    };
  } catch {
    return fallbackAIAnalysis(input, ruleBased);
  }
}
