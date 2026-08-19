import { useState } from 'react';
import { ProfileForm } from '@/components/ProfileForm';
import { ResultsPage } from '@/components/ResultsPage';
import { analyzeRuleBased } from '@/lib/ruleEngine';
import { fetchAIAnalysis } from '@/lib/aiAnalysis';
import type { ProfileInput, AnalysisResult, RiskLevel } from '@/types';

function levelFromScore(score: number): RiskLevel {
  if (score >= 67) return 'High';
  if (score >= 34) return 'Medium';
  return 'Low';
}

function computeFinal(
  ruleScore: number,
  ruleLevel: RiskLevel,
  aiScore: number | undefined,
  aiLevel: RiskLevel | undefined,
  completeness: number
): { level: RiskLevel; score: number; explanation: string } {
  let finalScore: number;
  let explanation: string;

  if (aiScore !== undefined && aiLevel !== undefined) {
    // Weight AI more heavily when more info is available
    const aiWeight = completeness > 60 ? 0.6 : 0.45;
    const ruleWeight = 1 - aiWeight;
    finalScore = Math.round(ruleScore * ruleWeight + aiScore * aiWeight);

    if (completeness <= 30) {
      explanation =
        'Limited information was provided, so this assessment should not be treated as a reliable indication of identity. Both the rule-based and AI analyses are based on incomplete data. The final assessment combines both perspectives but carries low confidence. Consider independently verifying the identity before sharing sensitive information.';
    } else if (finalScore >= 67) {
      explanation = `The rule-based score (${ruleScore}/100, ${ruleLevel}) and the AI assessment (${aiScore}/100, ${aiLevel}) both indicate elevated risk. The final assessment of ${levelFromScore(finalScore)} risk reflects the combination of detected warning signs across multiple risk factors. This information is insufficient to verify the person\u2019s identity, but the pattern warrants significant caution.`;
    } else if (finalScore >= 34) {
      explanation = `The rule-based score (${ruleScore}/100, ${ruleLevel}) and the AI assessment (${aiScore}/100, ${aiLevel}) converge on a moderate level of risk. The final assessment combines both analyses, weighting the AI assessment more heavily due to its ability to consider contextual patterns. Consider independently verifying the identity before sharing sensitive information.`;
    } else {
      explanation = `The rule-based score (${ruleScore}/100, ${ruleLevel}) and the AI assessment (${aiScore}/100, ${aiLevel}) both indicate relatively low risk based on the information provided. However, the absence of warning signs does not prove the person\u2019s identity. Consider independently verifying if you plan to share sensitive information.`;
    }
  } else {
    finalScore = ruleScore;
    explanation = `The AI analysis was unavailable, so the final assessment is based on the rule-based score of ${ruleScore}/100 (${ruleLevel}). ${completeness <= 30 ? 'Limited information was provided, so this assessment carries low confidence.' : 'Consider independently verifying the identity before sharing sensitive information.'}`;
  }

  return { level: levelFromScore(finalScore), score: finalScore, explanation };
}

function App() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async (input: ProfileInput) => {
    setLoading(true);
    const ruleBased = analyzeRuleBased(input);

    let ai = null;
    try {
      ai = await fetchAIAnalysis(input, ruleBased);
    } catch {
      ai = null;
    }

    const final = computeFinal(
      ruleBased.score,
      ruleBased.level,
      ai?.riskScore,
      ai?.riskAssessment,
      ruleBased.completeness
    );

    setResult({ ruleBased, ai, final });
    setLoading(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (result) {
    return <ResultsPage result={result} onBack={handleBack} />;
  }

  return <ProfileForm onAnalyze={handleAnalyze} loading={loading} />;
}

export default App;
