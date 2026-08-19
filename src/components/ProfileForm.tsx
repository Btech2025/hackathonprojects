import { useState, useMemo } from 'react';
import { Shield, AlertTriangle, Info, ChevronRight, User, Eye, BadgeCheck, Users, Link2, DollarSign, KeyRound, Clock, FileWarning } from 'lucide-react';
import type { ProfileInput } from '@/types';

const MIN_FIELDS = 3;

function countFilledFields(input: ProfileInput): number {
  let count = 0;
  if (input.platform.trim()) count++;
  if (input.displayName.trim()) count++;
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
  return count;
}

interface Props {
  onAnalyze: (input: ProfileInput) => void;
  loading: boolean;
}

const emptyInput: ProfileInput = {
  accountAge: 'unknown',
  accountAgeValue: '',
  profilePhoto: null,
  verifiedStatus: null,
  followersCount: '',
  connectionsCount: '',
  profileInfoConsistent: null,
  requestsMoney: null,
  requestsPersonalInfo: null,
  urgencyPressure: null,
  suspiciousDetails: '',
  platform: '',
  displayName: '',
};

type TriState = 'yes' | 'no' | null;

function toTriState(v: boolean | null): TriState {
  if (v === true) return 'yes';
  if (v === false) return 'no';
  return null;
}

function fromTriState(v: TriState): boolean | null {
  if (v === 'yes') return true;
  if (v === 'no') return false;
  return null;
}

function TriToggle({ value, onChange }: { value: TriState; onChange: (v: TriState) => void }) {
  return (
    <div className="inline-flex rounded-xl overflow-hidden shadow-sm ring-1 ring-slate-200">
      <button
        type="button"
        onClick={() => onChange(value === 'yes' ? null : 'yes')}
        className={`px-5 py-2 text-sm font-semibold transition-all duration-200 ${
          value === 'yes'
            ? 'bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-inner scale-105'
            : 'bg-white text-slate-500 hover:bg-rose-50 hover:text-rose-600'
        }`}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange(value === 'no' ? null : 'no')}
        className={`px-5 py-2 text-sm font-semibold transition-all duration-200 border-l border-slate-200 ${
          value === 'no'
            ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-inner scale-105'
            : 'bg-white text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'
        }`}
      >
        No
      </button>
    </div>
  );
}

function FieldLabel({ children, hint, icon: Icon }: { children: React.ReactNode; hint?: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="mb-2">
      <label className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
        {Icon && <Icon className="w-4 h-4 text-slate-400" />}
        {children}
      </label>
      {hint && <p className="text-xs text-slate-400 mt-0.5 ml-6">{hint}</p>}
    </div>
  );
}

function SectionCard({ title, subtitle, icon: Icon, iconColor, children }: { title: string; subtitle?: string; icon: React.ComponentType<{ className?: string }>; iconColor: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl shadow-md shadow-slate-200/60 border border-slate-100 p-6 transition-shadow hover:shadow-lg hover:shadow-slate-200/50">
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColor}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none hover:border-slate-300';

export function ProfileForm({ onAnalyze, loading }: Props) {
  const [input, setInput] = useState<ProfileInput>(emptyInput);
  const [showError, setShowError] = useState(false);

  const update = <K extends keyof ProfileInput>(key: K, val: ProfileInput[K]) => {
    setInput((prev) => ({ ...prev, [key]: val }));
    setShowError(false);
  };

  const filledCount = useMemo(() => countFilledFields(input), [input]);
  const canSubmit = filledCount >= MIN_FIELDS;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      setShowError(true);
      return;
    }
    onAnalyze(input);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(56,189,248,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(99,102,241,0.2) 0%, transparent 40%)' }} />
        <div className="relative max-w-3xl mx-auto px-6 py-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-xl shadow-sky-500/30 ring-1 ring-white/20">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">IdentityShield</h1>
              <p className="text-sm text-sky-200 font-medium">AI-Assisted Online Identity Safety Analyzer</p>
            </div>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
            Enter information about an online profile to receive a safety assessment. IdentityShield helps you
            recognize potential warning signs — it does <strong className="text-white">not</strong> prove whether
            someone is real or fake. Always verify independently before sharing sensitive information.
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 -mt-4 relative z-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic info */}
          <SectionCard title="Profile Overview" icon={User} iconColor="bg-gradient-to-br from-sky-400 to-sky-600">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel icon={Link2}>Platform</FieldLabel>
                <input
                  type="text"
                  value={input.platform}
                  onChange={(e) => update('platform', e.target.value)}
                  placeholder="e.g. Instagram, LinkedIn, Tinder"
                  className={inputClass}
                />
              </div>
              <div>
                <FieldLabel icon={User}>Display Name</FieldLabel>
                <input
                  type="text"
                  value={input.displayName}
                  onChange={(e) => update('displayName', e.target.value)}
                  placeholder="Profile name or username"
                  className={inputClass}
                />
              </div>
            </div>
          </SectionCard>

          {/* Account details */}
          <SectionCard title="Account Details" icon={BadgeCheck} iconColor="bg-gradient-to-br from-indigo-400 to-indigo-600">
            <div className="space-y-5">
              <div>
                <FieldLabel icon={Clock} hint="How long has this account existed?">Account Age</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {(['new', 'months', 'years', 'unknown'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => update('accountAge', opt)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all duration-200 ${
                        input.accountAge === opt
                          ? 'bg-gradient-to-b from-sky-500 to-sky-600 text-white border-sky-600 shadow-md shadow-sky-500/30 scale-105'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-sky-300 hover:text-sky-600 hover:bg-sky-50'
                      }`}
                    >
                      {opt === 'new' ? 'New (days)' : opt === 'months' ? 'Months old' : opt === 'years' ? 'Years old' : 'Unknown'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <FieldLabel icon={Eye}>Has a profile photo?</FieldLabel>
                  <TriToggle value={toTriState(input.profilePhoto)} onChange={(v) => update('profilePhoto', fromTriState(v))} />
                </div>
                <div>
                  <FieldLabel icon={BadgeCheck}>Is the account verified?</FieldLabel>
                  <TriToggle value={toTriState(input.verifiedStatus)} onChange={(v) => update('verifiedStatus', fromTriState(v))} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel icon={Users} hint="Approximate number">Followers</FieldLabel>
                  <input
                    type="text"
                    value={input.followersCount}
                    onChange={(e) => update('followersCount', e.target.value)}
                    placeholder="e.g. 500, 1.2k, 0"
                    className={inputClass}
                  />
                </div>
                <div>
                  <FieldLabel icon={Users} hint="Approximate number">Connections / Friends</FieldLabel>
                  <input
                    type="text"
                    value={input.connectionsCount}
                    onChange={(e) => update('connectionsCount', e.target.value)}
                    placeholder="e.g. 50, 200, 10k"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <FieldLabel icon={Link2} hint="Do the profile details seem internally consistent?">Profile info consistent?</FieldLabel>
                <TriToggle value={toTriState(input.profileInfoConsistent)} onChange={(v) => update('profileInfoConsistent', fromTriState(v))} />
              </div>
            </div>
          </SectionCard>

          {/* Behavioral signals */}
          <SectionCard title="Behavioral Signals" subtitle="These are the most important indicators of potential risk." icon={AlertTriangle} iconColor="bg-gradient-to-br from-amber-400 to-orange-500">
            <div className="space-y-5">
              <div>
                <FieldLabel icon={DollarSign}>Has this person requested money?</FieldLabel>
                <TriToggle value={toTriState(input.requestsMoney)} onChange={(v) => update('requestsMoney', fromTriState(v))} />
              </div>
              <div>
                <FieldLabel icon={KeyRound}>Has this person requested personal information?</FieldLabel>
                <TriToggle value={toTriState(input.requestsPersonalInfo)} onChange={(v) => update('requestsPersonalInfo', fromTriState(v))} />
              </div>
              <div>
                <FieldLabel icon={Clock} hint="Do they create urgency or pressure to act quickly?">Urgency or pressure?</FieldLabel>
                <TriToggle value={toTriState(input.urgencyPressure)} onChange={(v) => update('urgencyPressure', fromTriState(v))} />
              </div>
              <div>
                <FieldLabel icon={FileWarning} hint="Any other details that seem suspicious or inconsistent">Other suspicious details</FieldLabel>
                <textarea
                  value={input.suspiciousDetails}
                  onChange={(e) => update('suspiciousDetails', e.target.value)}
                  rows={3}
                  placeholder="e.g. Story keeps changing, refuses video call, photos look like different people..."
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>
          </SectionCard>

          {/* Privacy notice */}
          <div className="flex items-start gap-3 bg-gradient-to-r from-sky-50 to-cyan-50 border border-sky-200 rounded-2xl p-4 shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-sky-600" />
            </div>
            <p className="text-sm text-sky-900 leading-relaxed pt-1">
              <strong>Privacy notice:</strong> The information you enter stays in your browser and is sent only to
              IdentityShield's analysis service. No data is stored or shared. Do not enter passwords, financial
              details, or other sensitive credentials.
            </p>
          </div>

          {/* Validation error */}
          {showError && (
            <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 animate-in fade-in duration-200">
              <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0" />
              <p className="text-sm text-rose-700 font-medium">
                Please fill in at least {MIN_FIELDS} fields before analyzing. You've filled {filledCount} so far.
              </p>
            </div>
          )}

          {/* Progress indicator */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  canSubmit ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-sky-400 to-sky-500'
                }`}
                style={{ width: `${Math.min((filledCount / MIN_FIELDS) * 100, 100)}%` }}
              />
            </div>
            <span className={`text-xs font-semibold flex-shrink-0 ${canSubmit ? 'text-emerald-600' : 'text-slate-400'}`}>
              {filledCount}/{MIN_FIELDS} fields
            </span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="group w-full flex items-center justify-center gap-2 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white font-bold text-base py-4 rounded-2xl transition-all duration-200 shadow-xl shadow-slate-900/20 hover:shadow-2xl hover:shadow-slate-900/30 hover:-translate-y-0.5 active:translate-y-0 disabled:translate-y-0 disabled:shadow-none"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                Analyze Profile
                <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>

          <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            IdentityShield is a safety assistant, not a verification tool. It cannot prove anyone's identity.
          </p>
        </form>
      </main>
    </div>
  );
}
