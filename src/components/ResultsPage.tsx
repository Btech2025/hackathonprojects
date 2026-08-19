import { Shield, AlertTriangle, CheckCircle, ArrowLeft, Brain, Scale, Lightbulb, Info, Lock, Sparkles } from 'lucide-react';
import type { AnalysisResult, RiskLevel, RiskFactor, WarningSign, Recommendation } from '@/types';

interface Props {
  result: AnalysisResult;
  onBack: () => void;
}

const levelColors: Record<RiskLevel, { bg: string; text: string; border: string; ring: string; gradient: string; glow: string }> = {
  Low: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    ring: 'text-emerald-500',
    gradient: 'from-emerald-400 to-teal-500',
    glow: 'shadow-emerald-500/20',
  },
  Medium: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    ring: 'text-amber-500',
    gradient: 'from-amber-400 to-orange-500',
    glow: 'shadow-amber-500/20',
  },
  High: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    ring: 'text-rose-500',
    gradient: 'from-rose-400 to-red-500',
    glow: 'shadow-rose-500/20',
  },
};

function RiskBadge({ level }: { level: RiskLevel }) {
  const c = levelColors[level];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-bold ${c.bg} ${c.text} border ${c.border} shadow-sm`}>
      {level === 'Low' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      {level} Risk
    </span>
  );
}

function ScoreRing({ score, level }: { score: number; level: RiskLevel }) {
  const c = levelColors[level];
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className={`relative w-28 h-28 flex-shrink-0 drop-shadow-sm`}>
      <svg className="w-28 h-28 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-100" />
        <circle
          cx="40"
          cy="40"
          r="36"
          fill="none"
          strokeWidth="6"
          className={c.ring}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-slate-900">{score}</span>
        <span className="text-xs text-slate-400 font-medium">/ 100</span>
      </div>
    </div>
  );
}

function FactorBar({ factor }: { factor: RiskFactor }) {
  const c = levelColors[factor.level];
  return (
    <div className="border-b border-slate-100 last:border-0 py-3.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-slate-800">{factor.name}</span>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}>{factor.level}</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${c.gradient} transition-all duration-700`}
          style={{ width: `${factor.score}%` }}
        />
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">{factor.explanation}</p>
    </div>
  );
}

function WarningSignCard({ sign }: { sign: WarningSign }) {
  const sevColors = {
    High: 'border-l-rose-500 bg-gradient-to-r from-rose-50 to-rose-50/50',
    Medium: 'border-l-amber-500 bg-gradient-to-r from-amber-50 to-amber-50/50',
    Low: 'border-l-sky-500 bg-gradient-to-r from-sky-50 to-sky-50/50',
  };
  const sevIcons = {
    High: 'text-rose-500',
    Medium: 'text-amber-500',
    Low: 'text-sky-500',
  };
  return (
    <div className={`border-l-4 ${sevColors[sign.severity]} rounded-r-xl p-4 transition-shadow hover:shadow-md`}>
      <div className="flex items-center gap-2 mb-1.5">
        <AlertTriangle className={`w-4 h-4 ${sevIcons[sign.severity]}`} />
        <h4 className="text-sm font-bold text-slate-800">{sign.title}</h4>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">{sign.explanation}</p>
    </div>
  );
}

function RecommendationItem({ rec }: { rec: Recommendation }) {
  const colors = {
    high: 'bg-gradient-to-r from-rose-100 to-rose-50 text-rose-700 border-rose-200',
    medium: 'bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 border-amber-200',
    low: 'bg-gradient-to-r from-sky-100 to-sky-50 text-sky-700 border-sky-200',
  };
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${colors[rec.priority]} flex-shrink-0 mt-0.5`}>
        {rec.priority.toUpperCase()}
      </span>
      <p className="text-sm text-slate-700 leading-relaxed">{rec.text}</p>
    </div>
  );
}

function ScoreCard({ title, score, level, highlight }: { title: string; score: number; level: RiskLevel; highlight?: boolean }) {
  const c = levelColors[level];
  return (
    <div className={`rounded-2xl p-5 text-center transition-all duration-300 hover:-translate-y-1 ${
      highlight
        ? `border-2 border-slate-800 bg-gradient-to-b from-slate-50 to-white shadow-lg ${c.glow}`
        : `border border-slate-200 bg-white shadow-sm hover:shadow-md`
    }`}>
      <p className={`text-xs font-bold uppercase tracking-wide mb-3 ${highlight ? 'text-slate-700' : 'text-slate-400'}`}>{title}</p>
      <ScoreRing score={score} level={level} />
      <div className="mt-3">
        <RiskBadge level={level} />
      </div>
    </div>
  );
}

export function ResultsPage({ result, onBack }: Props) {
  const { ruleBased, ai, final } = result;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(56,189,248,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(99,102,241,0.2) 0%, transparent 40%)' }} />
        <div className="relative max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-500/30 ring-1 ring-white/20">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold">Analysis Results</h1>
            </div>
            <button
              onClick={onBack}
              className="group flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl border border-white/10"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              New Analysis
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Final Assessment */}
        <section className="bg-white rounded-2xl shadow-md shadow-slate-200/60 border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Risk Assessment</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <ScoreCard title="Rule-Based Score" score={ruleBased.score} level={ruleBased.level} />
            {ai ? (
              <ScoreCard title="AI Assessment" score={ai.riskScore} level={ai.riskAssessment} />
            ) : (
              <div className="border border-slate-200 rounded-2xl p-5 text-center bg-white shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">AI Assessment</p>
                <p className="text-sm text-slate-400 py-10">Not available</p>
              </div>
            )}
            <ScoreCard title="Final Safety Assessment" score={final.score} level={final.level} highlight />
          </div>

          <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl p-4 border border-slate-100">
            <p className="text-sm text-slate-700 leading-relaxed">{final.explanation}</p>
          </div>
        </section>

        {/* AI Safety Analysis */}
        {ai && (
          <section className="bg-white rounded-2xl shadow-md shadow-slate-200/60 border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">AI Safety Analysis</h2>
              <span
                className={`ml-auto text-xs font-bold px-3 py-1.5 rounded-full border ${
                  ai.source === 'ai'
                    ? 'bg-gradient-to-r from-indigo-100 to-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {ai.source === 'ai' ? (
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI-Powered
                  </span>
                ) : (
                  'Enhanced Fallback'
                )}
              </span>
            </div>

            {/* AI explanation */}
            <div className="bg-gradient-to-br from-indigo-50 to-sky-50 border border-indigo-100 rounded-xl p-4 mb-5">
              <p className="text-sm text-slate-700 leading-relaxed">{ai.explanation}</p>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-indigo-100/80">
                <Info className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <span className="text-xs text-slate-600">
                  Confidence: <strong>{ai.confidence}</strong> — reflects information quality, not identity certainty.
                </span>
              </div>
            </div>

            {/* AI risk breakdown */}
            <h3 className="text-sm font-bold text-slate-800 mb-1">Risk Factor Breakdown</h3>
            <div className="mb-5">
              {ai.factors.map((f, i) => (
                <FactorBar key={i} factor={f} />
              ))}
            </div>

            {/* AI warning signs */}
            {ai.warningSigns.length > 0 && (
              <div className="mb-5">
                <h3 className="text-sm font-bold text-slate-800 mb-3">Detected Warning Signs</h3>
                <div className="space-y-2.5">
                  {ai.warningSigns.map((sign, i) => (
                    <WarningSignCard key={i} sign={sign} />
                  ))}
                </div>
              </div>
            )}

            {/* AI recommendations */}
            {ai.recommendations.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Lightbulb className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">Recommended Safe Actions</h3>
                </div>
                <div className="space-y-1">
                  {ai.recommendations.map((rec, i) => (
                    <RecommendationItem key={i} rec={rec} />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Rule-based detail */}
        <section className="bg-white rounded-2xl shadow-md shadow-slate-200/60 border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Rule-Based Analysis (Phase 1)</h2>
          </div>

          <h3 className="text-sm font-bold text-slate-800 mb-1">Risk Factor Breakdown</h3>
          <div className="mb-5">
            {ruleBased.factors.map((f, i) => (
              <FactorBar key={i} factor={f} />
            ))}
          </div>

          {ruleBased.warningSigns.length > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-bold text-slate-800 mb-3">Warning Signs</h3>
              <div className="space-y-2.5">
                {ruleBased.warningSigns.map((sign, i) => (
                  <WarningSignCard key={i} sign={sign} />
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Recommendations</h3>
            </div>
            <div className="space-y-1">
              {ruleBased.recommendations.map((rec, i) => (
                <RecommendationItem key={i} rec={rec} />
              ))}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500">
              Information completeness: {ruleBased.completeness}% — Confidence: {ruleBased.confidence}
            </span>
          </div>
        </section>

        {/* Uncertainty / limited info */}
        {ruleBased.completeness <= 30 && (
          <div className="flex items-start gap-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-sm text-amber-900 leading-relaxed pt-1">
              <strong>Limited information was provided.</strong> This assessment should not be treated as a reliable
              indication of identity. Consider providing more details about the profile for a more thorough analysis.
            </p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="flex items-start gap-3 bg-gradient-to-r from-slate-100 to-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
            <Lock className="w-5 h-5 text-slate-500" />
          </div>
          <p className="text-sm text-slate-600 leading-relaxed pt-1">
            IdentityShield is a safety assistant that helps you recognize potential warning signs. It does <strong>not</strong> prove
            that anyone is real, fake, or fraudulent. Always independently verify a person's identity before sharing
            sensitive information or acting on requests.
          </p>
        </div>

        <button
          onClick={onBack}
          className="group w-full flex items-center justify-center gap-2 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white font-bold text-base py-4 rounded-2xl transition-all duration-200 shadow-xl shadow-slate-900/20 hover:shadow-2xl hover:shadow-slate-900/30 hover:-translate-y-0.5 active:translate-y-0"
        >
          <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          Analyze Another Profile
        </button>
      </main>
    </div>
  );
}
