import type {
  ProfileInput,
  RuleBasedResult,
  RiskFactor,
  RiskLevel,
  WarningSign,
  Recommendation,
  ConfidenceLevel,
} from '@/types';

function levelFromScore(score: number): RiskLevel {
  if (score >= 67) return 'High';
  if (score >= 34) return 'Medium';
  return 'Low';
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function parseCount(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.toLowerCase().replace(/,/g, '').trim();
  const match = cleaned.match(/([\d.]+)\s*(k|m)?/);
  if (!match) return null;
  let n = parseFloat(match[1]);
  if (match[2] === 'k') n *= 1000;
  if (match[2] === 'm') n *= 1_000_000;
  return Math.round(n);
}

function completeness(input: ProfileInput): number {
  const fields: (boolean | null | string)[] = [
    input.accountAge && input.accountAge !== 'unknown',
    input.profilePhoto,
    input.verifiedStatus,
    input.followersCount,
    input.connectionsCount,
    input.profileInfoConsistent,
    input.requestsMoney,
    input.requestsPersonalInfo,
    input.urgencyPressure,
    input.suspiciousDetails,
  ];
  const filled = fields.filter((f) => f !== '' && f !== null && f !== false || f === false && f !== null).length;
  // Count fields that are explicitly set (not null and not empty string)
  let count = 0;
  if (input.accountAge && input.accountAge !== 'unknown') count++;
  if (input.profilePhoto !== null) count++;
  if (input.verifiedStatus !== null) count++;
  if (input.followersCount.trim()) count++;
  if (input.connectionsCount.trim()) count++;
  if (input.profileInfoConsistent !== null) count++;
  if (input.requestsMoney !== null) count++;
  if (input.requestsPersonalInfo !== null) count++;
  if (input.urgencyPressure !== null) count++;
  if (input.suspiciousDetails.trim()) count++;
  return clamp((count / 10) * 100);
}

function confidenceFromCompleteness(c: number): ConfidenceLevel {
  if (c <= 30) return 'Low confidence';
  if (c <= 60) return 'Moderate confidence';
  return 'Higher confidence';
}

export function analyzeRuleBased(input: ProfileInput): RuleBasedResult {
  const factors: RiskFactor[] = [];

  // 1. Identity consistency
  let consistencyScore = 20;
  if (input.profileInfoConsistent === true) consistencyScore = 15;
  else if (input.profileInfoConsistent === false) consistencyScore = 75;
  if (input.suspiciousDetails.trim()) consistencyScore += 15;
  if (input.displayName.trim() && input.profileInfoConsistent === true) consistencyScore -= 5;
  factors.push({
    name: 'Identity Consistency',
    level: levelFromScore(consistencyScore),
    score: clamp(consistencyScore),
    explanation:
      input.profileInfoConsistent === false
        ? 'The profile information appears inconsistent, which can indicate a fabricated or misleading identity.'
        : input.profileInfoConsistent === true
        ? 'The profile information appears internally consistent, though this alone does not verify the identity.'
        : 'Insufficient information was provided to assess identity consistency.',
  });

  // 2. Social engineering risk
  let seScore = 20;
  if (input.requestsPersonalInfo === true) seScore += 50;
  if (input.urgencyPressure === true) seScore += 30;
  if (input.suspiciousDetails.trim()) seScore += 10;
  factors.push({
    name: 'Social Engineering Risk',
    level: levelFromScore(seScore),
    score: clamp(seScore),
    explanation:
      input.requestsPersonalInfo === true
        ? 'Requests for sensitive personal information from an unverified source are a common social engineering tactic.'
        : input.urgencyPressure === true
        ? 'Urgency or pressure tactics are often used to force quick decisions without independent verification.'
        : 'No direct social engineering indicators were detected from the provided information.',
  });

  // 3. Financial request risk
  let finScore = 15;
  if (input.requestsMoney === true) finScore = 85;
  factors.push({
    name: 'Financial Request Risk',
    level: levelFromScore(finScore),
    score: clamp(finScore),
    explanation:
      input.requestsMoney === true
        ? 'Requests for money from an online contact whose identity has not been independently verified are a major warning sign.'
        : 'No financial requests were indicated in the provided information.',
  });

  // 4. Privacy risk
  let privScore = 25;
  if (input.requestsPersonalInfo === true) privScore += 40;
  if (input.profileInfoConsistent === false) privScore += 15;
  if (input.suspiciousDetails.trim()) privScore += 10;
  factors.push({
    name: 'Privacy Risk',
    level: levelFromScore(privScore),
    score: clamp(privScore),
    explanation:
      input.requestsPersonalInfo === true
        ? 'Sharing personal information with an unverified contact can expose you to identity theft or further targeting.'
        : 'No direct privacy threats were detected, but always exercise caution with new online contacts.',
  });

  // 5. Urgency / manipulation risk
  let urgScore = 15;
  if (input.urgencyPressure === true) urgScore = 75;
  if (input.requestsMoney === true && input.urgencyPressure === true) urgScore = 90;
  factors.push({
    name: 'Urgency / Manipulation Risk',
    level: levelFromScore(urgScore),
    score: clamp(urgScore),
    explanation:
      input.urgencyPressure === true
        ? 'Urgency is a common manipulation tactic designed to prevent you from verifying the request independently.'
        : 'No urgency or pressure tactics were indicated in the provided information.',
  });

  // 6. Profile credibility signals
  let credScore = 20;
  if (input.accountAge === 'new') credScore += 35;
  else if (input.accountAge === 'unknown' || !input.accountAge) credScore += 20;
  if (input.profilePhoto === false) credScore += 25;
  if (input.verifiedStatus === false) credScore += 15;
  const followers = parseCount(input.followersCount);
  if (followers !== null && followers < 50) credScore += 20;
  factors.push({
    name: 'Profile Credibility Signals',
    level: levelFromScore(credScore),
    score: clamp(credScore),
    explanation:
      input.accountAge === 'new'
        ? 'A newly created account combined with other factors can indicate a throwaway or fraudulent profile.'
        : input.profilePhoto === false
        ? 'The absence of a profile photo reduces credibility, though legitimate users may also omit photos.'
        : 'Profile credibility signals are limited based on the information provided.',
  });

  // Overall score: weighted average
  const weights = [1.2, 1.3, 1.5, 1.0, 1.1, 1.0];
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const weightedSum = factors.reduce((sum, f, i) => sum + f.score * weights[i], 0);
  const overallScore = clamp(weightedSum / totalWeight);

  // Warning signs
  const warningSigns: WarningSign[] = [];
  if (input.requestsMoney === true) {
    warningSigns.push({
      title: 'Requests for Money',
      explanation:
        'Requests for money from an online contact whose identity has not been independently verified are one of the strongest warning signs of online fraud.',
      severity: 'High',
    });
  }
  if (input.requestsPersonalInfo === true) {
    warningSigns.push({
      title: 'Requests for Personal Information',
      explanation:
        'Requests for sensitive personal information can be a warning sign when the requester\u2019s identity or purpose has not been independently verified.',
      severity: 'High',
    });
  }
  if (input.urgencyPressure === true) {
    warningSigns.push({
      title: 'Urgency or Pressure',
      explanation:
        'Urgency tactics are designed to make you act quickly without verifying. Legitimate contacts rarely demand immediate action under pressure.',
      severity: 'Medium',
    });
  }
  if (input.profileInfoConsistent === false) {
    warningSigns.push({
      title: 'Inconsistent Profile Information',
      explanation:
        'Inconsistencies in profile details can indicate a fabricated identity or an account impersonating someone else.',
      severity: 'Medium',
    });
  }
  if (input.accountAge === 'new') {
    warningSigns.push({
      title: 'Newly Created Account',
      explanation:
        'A very new account combined with sensitive requests increases the likelihood that the account was created for deceptive purposes.',
      severity: 'Medium',
    });
  }
  if (input.profilePhoto === false) {
    warningSigns.push({
      title: 'No Profile Photo',
      explanation:
        'The absence of a profile photo reduces credibility, especially when combined with requests for money or personal information.',
      severity: 'Low',
    });
  }
  if (input.verifiedStatus === false) {
    warningSigns.push({
      title: 'Unverified Account',
      explanation:
        'The account lacks platform verification. While most legitimate users are unverified, the absence of verification means the platform has not confirmed the identity.',
      severity: 'Low',
    });
  }
  if (input.suspiciousDetails.trim()) {
    warningSigns.push({
      title: 'Additional Suspicious Details',
      explanation: `The user noted: "${input.suspiciousDetails.trim()}". This detail warrants independent verification before trusting the contact.`,
      severity: 'Medium',
    });
  }

  // Recommendations
  const recommendations: Recommendation[] = [];
  if (input.requestsMoney === true) {
    recommendations.push({
      text: 'Do not send money until the person\u2019s identity has been independently verified through a trusted channel.',
      priority: 'high',
    });
  }
  if (input.requestsPersonalInfo === true) {
    recommendations.push({
      text: 'Do not share sensitive personal information with this contact until their identity and purpose are independently verified.',
      priority: 'high',
    });
  }
  if (input.urgencyPressure === true) {
    recommendations.push({
      text: 'Slow down. Urgency is a manipulation tactic \u2014 take time to independently verify the request before acting.',
      priority: 'high',
    });
  }
  if (input.profileInfoConsistent === false) {
    recommendations.push({
      text: 'Verify the profile information through a trusted independent source before engaging further.',
      priority: 'medium',
    });
  }
  if (input.accountAge === 'new') {
    recommendations.push({
      text: 'Treat new accounts with extra caution. Consider waiting to see if the account establishes a trustworthy history.',
      priority: 'medium',
    });
  }
  recommendations.push({
    text: 'Consider independently verifying the identity before sharing any sensitive information or acting on requests.',
    priority: 'low',
  });

  const comp = completeness(input);

  return {
    score: overallScore,
    level: levelFromScore(overallScore),
    factors,
    warningSigns,
    recommendations,
    confidence: confidenceFromCompleteness(comp),
    completeness: comp,
  };
}
