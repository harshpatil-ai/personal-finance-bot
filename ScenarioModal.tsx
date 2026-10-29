import React from 'react';
import { X, Briefcase, GraduationCap, Laptop, Home, RefreshCw, Trash2, CheckCircle2 } from 'lucide-react';
import { ScenarioKey } from '../types/finance';

interface ScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeScenario: ScenarioKey;
  onSelectScenario: (scenario: ScenarioKey) => Promise<void>;
}

export const ScenarioModal: React.FC<ScenarioModalProps> = ({
  isOpen,
  onClose,
  activeScenario,
  onSelectScenario,
}) => {
  if (!isOpen) return null;

  const scenarios: Array<{
    key: ScenarioKey;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    color: string;
    details: string;
  }> = [
    {
      key: 'demo',
      title: 'Official Demo: Allowance & Essentials',
      subtitle: '₹25,000 allowance, Food (₹4.5k), Transport (₹1.8k), Education (₹2.5k)',
      icon: <CheckCircle2 className="w-5 h-5 text-blue-400" />,
      color: 'border-blue-500/30 hover:border-blue-500/60',
      details: 'Loads the exact demo dataset from demo_data.txt to test instant recalculations and AI financial advice.',
    },
    {
      key: 'salaried',
      title: 'Scenario 1: Salaried Professional',
      subtitle: '$5,550/mo tech income, rent, grocery & dining budgets',
      icon: <Briefcase className="w-5 h-5 text-emerald-400" />,
      color: 'border-emerald-500/30 hover:border-emerald-500/60',
      details: 'Tests monthly corporate direct deposit, balanced category caps (rent, dining out, transport), emergency fund goal, and retirement dividend tracking.',
    },
    {
      key: 'student',
      title: 'Scenario 2: College Student',
      subtitle: '$1,350/mo allowance & part-time tutoring, textbook costs',
      icon: <GraduationCap className="w-5 h-5 text-indigo-400" />,
      color: 'border-indigo-500/30 hover:border-indigo-500/60',
      details: 'Tests managing tight budgets on a low budget, shared student rent, identifying unnecessary late-night snacks, and saving for a coding laptop.',
    },
    {
      key: 'freelancer',
      title: 'Scenario 3: Freelancer / Consultant',
      subtitle: '$5,180/mo fluctuating client invoices, software expenses',
      icon: <Laptop className="w-5 h-5 text-teal-400" />,
      color: 'border-teal-500/30 hover:border-teal-500/60',
      details: 'Tests multiple irregular income streams (milestones, retainers, digital sales), tax buffer goal, business subscriptions, and irregular cash flow.',
    },
    {
      key: 'household',
      title: 'Scenario 4: Household Family',
      subtitle: '$8,200/mo dual income, mortgage, groceries & childcare',
      icon: <Home className="w-5 h-5 text-amber-400" />,
      color: 'border-amber-500/30 hover:border-amber-500/60',
      details: 'Tests multi-member household budgeting: mortgage, utilities, high-volume grocery runs, healthcare copays, and college fund milestone.',
    },
    {
      key: 'empty',
      title: 'Blank Custom Profile',
      subtitle: 'Start with empty tables to enter your own personal finances',
      icon: <Trash2 className="w-5 h-5 text-slate-400" />,
      color: 'border-slate-700 hover:border-slate-500',
      details: 'Clears all sample records so you can start from scratch with a completely clean SQLite database.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">Preset Financial Scenarios</h3>
            <p className="text-xs text-slate-400">
              Instantly test the application across different realistic income & spending archetypes
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Scenarios */}
        <div className="p-5 pt-0 space-y-3 max-h-[60vh] overflow-y-auto">
          {scenarios.map((s) => {
            const isCurrent = activeScenario === s.key;
            return (
              <div
                key={s.key}
                onClick={async () => {
                  await onSelectScenario(s.key);
                  onClose();
                }}
                className={`p-4 rounded-xl bg-slate-800/40 border transition-all cursor-pointer group flex items-start gap-3.5 ${
                  isCurrent ? 'border-emerald-500 bg-emerald-500/10' : `${s.color} hover:bg-slate-800/80`
                }`}
              >
                <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 shrink-0">
                  {s.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors">
                      {s.title}
                    </h4>
                    {isCurrent && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">{s.subtitle}</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{s.details}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
