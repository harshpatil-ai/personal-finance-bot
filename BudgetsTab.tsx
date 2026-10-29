import React from 'react';
import {
  Scale,
  Plus,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Edit2,
  Trash2,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Info,
} from 'lucide-react';
import { Budget, FinanceOverview, Category } from '../types/finance';

interface BudgetsTabProps {
  budgets: Budget[];
  overview: FinanceOverview | null;
  categories: Category[];
  onOpenAddBudget: () => void;
  onEditBudget: (category: string, currentLimit: number) => void;
  onDeleteBudget: (id: string) => void;
  onAskAiPrompt: (prompt: string) => void;
}

export const BudgetsTab: React.FC<BudgetsTabProps> = ({
  budgets,
  overview,
  categories,
  onOpenAddBudget,
  onEditBudget,
  onDeleteBudget,
  onAskAiPrompt,
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const totalBudget = budgets.reduce((acc, b) => acc + b.monthly_limit, 0);
  const totalSpent = overview?.totalExpenses || 0;
  const totalIncome = overview?.totalIncome || 0;

  // 50/30/20 calculation
  const needsKeywords = ['housing', 'rent', 'groceries', 'utilities', 'bills', 'healthcare', 'transportation'];
  let actualNeeds = 0;
  let actualWants = 0;

  overview?.categoryBreakdown.forEach((item) => {
    const isNeed = needsKeywords.some((nk) => item.category.toLowerCase().includes(nk));
    if (isNeed) actualNeeds += item.spent;
    else actualWants += item.spent;
  });

  const targetNeeds = totalIncome * 0.5;
  const targetWants = totalIncome * 0.3;
  const targetSavings = totalIncome * 0.2;
  const actualSavings = overview?.netSavings || 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Monthly Budget Planning</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Set category spending caps, prevent budget overruns, and maintain disciplined cash flow
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onAskAiPrompt('Analyze my category budgets. Where am I overspending and how can I adjust my limits realistically?')}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI Budget Review</span>
          </button>
          <button
            onClick={onOpenAddBudget}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-md shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Set Category Budget</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-md">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Planned Budget</div>
          <div className="text-2xl font-bold text-white mt-1">{formatCurrency(totalBudget)}</div>
          <div className="text-xs text-slate-400 mt-2">Across {budgets.length} configured categories</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-md">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Actual Spent</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{formatCurrency(totalSpent)}</div>
          <div className="text-xs text-slate-400 mt-2">
            {totalBudget > 0 ? `${Math.round((totalSpent / totalBudget) * 100)}% of total budget` : 'No budget set'}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-md">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Remaining Unallocated</div>
          <div className={`text-2xl font-bold mt-1 ${totalBudget - totalSpent >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
            {formatCurrency(totalBudget - totalSpent)}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            {totalBudget - totalSpent >= 0 ? 'Buffer remaining for month' : 'Over total budget limit'}
          </div>
        </div>
      </div>

      {/* Category Budget Cards Grid */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white">Active Category Budgets</h3>
          <span className="text-xs text-slate-400">{budgets.length} categories active</span>
        </div>

        {budgets.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No budgets configured yet.{' '}
            <button onClick={onOpenAddBudget} className="text-emerald-400 underline cursor-pointer">
              Add your first category budget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgets.map((b) => {
              const breakdown = overview?.categoryBreakdown.find(
                (cb) => cb.category.toLowerCase() === b.category.toLowerCase()
              );
              const spent = breakdown ? breakdown.spent : 0;
              const percentage = Math.round((spent / b.monthly_limit) * 100);
              const remaining = b.monthly_limit - spent;

              let statusColor = 'text-emerald-400';
              let barColor = 'bg-emerald-500';
              let badge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
              let statusLabel = 'On Track';

              if (percentage >= 100) {
                statusColor = 'text-rose-400';
                barColor = 'bg-rose-500';
                badge = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                statusLabel = 'Exceeded';
              } else if (percentage >= 80) {
                statusColor = 'text-amber-400';
                barColor = 'bg-amber-400';
                badge = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                statusLabel = 'Warning (≥80%)';
              }

              return (
                <div
                  key={b.id}
                  className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all space-y-3 group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-100 text-sm">{b.category}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold uppercase ${badge}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEditBudget(b.category, b.monthly_limit)}
                        className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 cursor-pointer"
                        title="Edit limit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remove budget for ${b.category}?`)) onDeleteBudget(b.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 cursor-pointer"
                        title="Delete budget"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">
                        Spent: <strong className="text-white">{formatCurrency(spent)}</strong>
                      </span>
                      <span className="text-slate-400">
                        Limit: <strong className="text-white">{formatCurrency(b.monthly_limit)}</strong>
                      </span>
                    </div>
                    <div className="w-full bg-slate-700/60 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className={`font-semibold ${statusColor}`}>{percentage}% utilized</span>
                      <span className={remaining >= 0 ? 'text-slate-400' : 'text-rose-400 font-semibold'}>
                        {remaining >= 0 ? `${formatCurrency(remaining)} left` : `Exceeded by ${formatCurrency(Math.abs(remaining))}`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 50/30/20 Interactive Deep Dive Rule Calculator */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">50 / 30 / 20 Rule Financial Health Engine</h3>
            <p className="text-xs text-slate-400">
              Gold-standard budgeting methodology evaluated against your real monthly income of {formatCurrency(totalIncome)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Needs Bucket */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-200">50% Essential Needs</span>
              <span className="text-indigo-400">Target: {formatCurrency(targetNeeds)}</span>
            </div>
            <div className="text-xs text-slate-400">Rent, groceries, utilities, transit & healthcare</div>
            <div className="pt-2 flex items-baseline justify-between">
              <span className="text-lg font-bold text-white">{formatCurrency(actualNeeds)}</span>
              <span className={`text-xs font-semibold ${actualNeeds > targetNeeds ? 'text-rose-400' : 'text-emerald-400'}`}>
                {actualNeeds > targetNeeds
                  ? `+${formatCurrency(actualNeeds - targetNeeds)} over target`
                  : `Well balanced`}
              </span>
            </div>
          </div>

          {/* Wants Bucket */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-200">30% Lifestyle Wants</span>
              <span className="text-teal-400">Target: {formatCurrency(targetWants)}</span>
            </div>
            <div className="text-xs text-slate-400">Dining out, entertainment, shopping & hobbies</div>
            <div className="pt-2 flex items-baseline justify-between">
              <span className="text-lg font-bold text-white">{formatCurrency(actualWants)}</span>
              <span className={`text-xs font-semibold ${actualWants > targetWants ? 'text-rose-400' : 'text-emerald-400'}`}>
                {actualWants > targetWants
                  ? `+${formatCurrency(actualWants - targetWants)} over target`
                  : `Well balanced`}
              </span>
            </div>
          </div>

          {/* Savings Bucket */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-200">20% Savings & Debt Payoff</span>
              <span className="text-emerald-400">Target: {formatCurrency(targetSavings)}</span>
            </div>
            <div className="text-xs text-slate-400">Emergency fund, investments & goal progress</div>
            <div className="pt-2 flex items-baseline justify-between">
              <span className="text-lg font-bold text-emerald-400">{formatCurrency(actualSavings)}</span>
              <span className={`text-xs font-semibold ${actualSavings >= targetSavings ? 'text-emerald-400' : 'text-amber-400'}`}>
                {actualSavings >= targetSavings
                  ? `Achieving ${Math.round((actualSavings / (totalIncome || 1)) * 100)}% savings rate!`
                  : `Deficit of ${formatCurrency(targetSavings - actualSavings)}`}
              </span>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-800/30 border border-slate-700/40 text-xs text-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Tip: When discretionary "Wants" exceed 30%, trimming just 2 non-essential subscriptions or one restaurant dinner can restore your savings target.
            </span>
          </div>
          <button
            onClick={() => onAskAiPrompt(`My current actual 50/30/20 breakdown is Needs: ${actualNeeds}, Wants: ${actualWants}, Savings: ${actualSavings} against total income of ${totalIncome}. Give me a 3-step action plan to reach optimal 50/30/20.`)}
            className="text-xs font-semibold text-emerald-400 hover:underline shrink-0 ml-4 cursor-pointer"
          >
            Ask AI Advisor →
          </button>
        </div>
      </div>
    </div>
  );
};
