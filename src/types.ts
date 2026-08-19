export type RiskLevel = 'Low' | 'Medium' | 'High';
export type ConfidenceLevel = 'Low confidence' | 'Moderate confidence' | 'Higher confidence';

export interface ProfileInput {
  accountAge: string; // 'new' | 'months' | 'years' | 'unknown'
  accountAgeValue?: string;
  profilePhoto: boolean | null;
  verifiedStatus: boolean | null;
  followersCount: string; // raw string from user
  connectionsCount: string;
  profileInfoConsistent: boolean | null;
  requestsMoney: boolean | null;
  requestsPersonalInfo: boolean | null;
  urgencyPressure: boolean | null;
  suspiciousDetails: string; // free text
  platform: string;
  displayName: string;
}

export interface RiskFactor {
  name: string;
  level: RiskLevel;
  score: number;
  explanation: string;
}

export interface WarningSign {
  title: string;
  explanation: string;
  severity: RiskLevel;
}

export interface Recommendation {
  text: string;
  priority: 'high' | 'medium' | 'low';
}

export interface RuleBasedResult {
  score: number;
  level: RiskLevel;
  factors: RiskFactor[];
  warningSigns: WarningSign[];
  recommendations: Recommendation[];
  confidence: ConfidenceLevel;
  completeness: number; // 0-100, how much info was provided
}

export interface AIAnalysisResult {
  available: boolean;
  riskAssessment: RiskLevel;
  riskScore: number;
  factors: RiskFactor[];
  warningSigns: WarningSign[];
  recommendations: Recommendation[];
  explanation: string;
  confidence: ConfidenceLevel;
  source: 'ai' | 'fallback';
}

export interface AnalysisResult {
  ruleBased: RuleBasedResult;
  ai: AIAnalysisResult | null;
  final: {
    level: RiskLevel;
    score: number;
    explanation: string;
  };
}
