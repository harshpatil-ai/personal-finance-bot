import React, { useState } from 'react';
import {
  Target,
  Plus,
  Calendar,
  Sparkles,
  TrendingUp,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  PiggyBank,
  DollarSign,
} from 'lucide-react';
import { SavingsGoal } from '../types/finance';

interface GoalsTabProps {
  goals: SavingsGoal[];
  netMonthlySavings: number;
  onOpenAddGoal: () => void;
  onEditGoal: (goal: SavingsGoal) => void;
  onDeleteGoal: (id: string) => void;
  onContribute: (goalId: string, amount: number) => void;
  onAskAiPrompt: (prompt: string) => void;
}

export const GoalsTab: React.FC<GoalsTabProps> = ({
  goals,
  netMonthlySavings,
  onOpenAddGoal,
  onEditGoal,
  onDeleteGoal,
  onContribute,
  onAskAiPrompt,
}) => {
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('100');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const totalSaved = goals.reduce((acc, g) => acc + g.current_amount, 0);
  const totalTarget = goals.reduce((acc, g) => acc + g.target_amount, 0);
  const overallPercentage = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  // Calculate months remaining until target date
  const getMonthsRemaining = (targetDateStr: string) => {
    try {
      const target = new Date(targetDateStr);
      const now = new Date();
      const diffMonths = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
      return Math.max(1, diffMonths);
    } catch {
      return 1;
    }
  };

  const handleQuickContribute = (goalId: string, amount: number) => {
    onContribute(goalId, amount);
    setContributeGoalId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Financial Savings & Milestones</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Turn your monthly surplus into tangible wealth: emergency cushions, travel funds, education & major investments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onAskAiPrompt(`I have ${formatCurrency(netMonthlySavings)} in monthly surplus and ${goals.length} active savings goals. How should I allocate my monthly savings across these goals to reach them fastest?`)}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI Allocation Strategy</span>
          </button>
          <button
            onClick={onOpenAddGoal}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-md shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Goal</span>
          </button>
        </div>
      </div>

      {/* Aggregate Goal Progress Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-md">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Accumulated Savings</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{formatCurrency(totalSaved)}</div>
          <div className="text-xs text-slate-400 mt-2">Across {goals.length} target goal(s)</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-md">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Targets Value</div>
          <div className="text-2xl font-bold text-white mt-1">{formatCurrency(totalTarget)}</div>
          <div className="text-xs text-slate-400 mt-2">
            Remaining to accumulate: {formatCurrency(Math.max(0, totalTarget - totalSaved))}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-md">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monthly Available Surplus</div>
          <div className={`text-2xl font-bold mt-1 ${netMonthlySavings >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
            {formatCurrency(netMonthlySavings)}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            {netMonthlySavings > 0 ? 'Ready to allocate into goals' : 'Increase income or trim expenses to fund goals'}
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {goals.length === 0 ? (
          <div className="col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
            No savings goals established yet.{' '}
            <button onClick={onOpenAddGoal} className="text-emerald-400 underline cursor-pointer">
              Create your first savings goal
            </button>
          </div>
        ) : (
          goals.map((goal) => {
            const percentage = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
            const remaining = Math.max(0, goal.target_amount - goal.current_amount);
            const monthsLeft = getMonthsRemaining(goal.target_date);
            const monthlyRequired = remaining > 0 ? Math.ceil(remaining / monthsLeft) : 0;
            const isCompleted = percentage >= 100;

            return (
              <div
                key={goal.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 hover:border-slate-700 transition-all relative group"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold ${
                        isCompleted
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-teal-500/10 text-teal-400'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base leading-tight">{goal.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-medium border border-slate-700">
                          {goal.category || 'General'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-[11px]">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          Target: {goal.target_date} ({monthsLeft} mo left)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEditGoal(goal)}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
                      title="Edit goal"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete savings goal "${goal.title}"?`)) onDeleteGoal(goal.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 cursor-pointer"
                      title="Delete goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar & Figures */}
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline text-xs">
                    <div>
                      <span className="text-xl font-bold text-emerald-400">{formatCurrency(goal.current_amount)}</span>
                      <span className="text-slate-400 ml-1.5">of {formatCurrency(goal.target_amount)}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-200">{percentage}%</span>
                  </div>

                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                    <span>
                      {isCompleted ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Goal Achieved!
                        </span>
                      ) : (
                        <span>Remaining: {formatCurrency(remaining)}</span>
                      )}
                    </span>
                    {!isCompleted && monthlyRequired > 0 && (
                      <span className="text-slate-300 font-medium">
                        Need ~<strong className="text-white">{formatCurrency(monthlyRequired)}</strong>/mo
                      </span>
                    )}
                  </div>
                </div>

                {/* Action: Quick Contribute */}
                {!isCompleted && (
                  <div className="pt-2 border-t border-slate-800/80">
                    {contributeGoalId === goal.id ? (
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-2 text-slate-400 text-xs">$</span>
                          <input
                            type="number"
                            min="1"
                            value={customAmount}
                            onChange={(e) => setCustomAmount(e.target.value)}
                            placeholder="Amount"
                            className="w-full pl-6 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const val = parseFloat(customAmount);
                            if (val > 0) handleQuickContribute(goal.id, val);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setContributeGoalId(null)}
                          className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Quick Contribute:</span>
                        <div className="flex items-center gap-1.5">
                          {[50, 100, 250].map((amt) => (
                            <button
                              key={amt}
                              onClick={() => handleQuickContribute(goal.id, amt)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
                            >
                              +${amt}
                            </button>
                          ))}
                          <button
                            onClick={() => {
                              setContributeGoalId(goal.id);
                              setCustomAmount('100');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold cursor-pointer"
                          >
                            Custom
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
