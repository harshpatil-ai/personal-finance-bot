import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Percent,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Plus,
  ShieldCheck,
  Scale,
  Receipt,
  Wallet,
} from 'lucide-react';
import { FinanceOverview, Expense, Income, SavingsGoal } from '../types/finance';

interface OverviewTabProps {
  overview: FinanceOverview | null;
  expenses: Expense[];
  income: Income[];
  goals: SavingsGoal[];
  onOpenAddExpense: () => void;
  onOpenAddIncome: () => void;
  onOpenAddBudget: () => void;
  onGoToTab: (tab: 'transactions' | 'budgets' | 'goals' | 'ai') => void;
  onAskAiPrompt: (prompt: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  overview,
  expenses,
  income,
  goals,
  onOpenAddExpense,
  onOpenAddIncome,
  onOpenAddBudget,
  onGoToTab,
  onAskAiPrompt,
}) => {
  if (!overview) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mr-3" />
        Loading financial overview...
      </div>
    );
  }

  // 50/30/20 rough classification
  // Needs: Housing, Groceries, Utilities, Healthcare, Transportation
  // Wants: Dining, Entertainment, Shopping, Miscellaneous
  // Savings: Net savings
  const needsCategories = ['housing', 'rent', 'groceries', 'utilities', 'bills', 'healthcare', 'transportation'];
  let totalNeeds = 0;
  let totalWants = 0;

  overview.categoryBreakdown.forEach((item) => {
    const isNeed = needsCategories.some((nc) => item.category.toLowerCase().includes(nc));
    if (isNeed) {
      totalNeeds += item.spent;
    } else {
      totalWants += item.spent;
    }
  });

  const totalInc = overview.totalIncome || 1;
  const needsPct = Math.round((totalNeeds / totalInc) * 100);
  const wantsPct = Math.round((totalWants / totalInc) * 100);
  const savingsPct = overview.savingsRate;

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / AI Advisory Alert */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/70 border border-emerald-500/25 p-5 shadow-xl">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white">AI Financial Advisor Active</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  Live Grounded
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                Gemini is tracking your {expenses.length} expenses and {income.length} income entries. Your monthly savings rate is{' '}
                <strong className={overview.savingsRate >= 20 ? 'text-emerald-400' : 'text-amber-400'}>
                  {overview.savingsRate}%
                </strong>
                .
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onAskAiPrompt('Analyze my financial health this month and give me 3 specific recommendations')}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Analyze Finances</span>
            </button>
            <button
              onClick={() => onGoToTab('ai')}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer flex items-center gap-1"
            >
              <span>Open Chatbot</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative group hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Income</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatCurrency(overview.totalIncome)}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
            <span>{income.length} record(s) logged</span>
            <button
              onClick={onOpenAddIncome}
              className="text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
            >
              + Add
            </button>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative group hover:border-rose-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Expenses</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatCurrency(overview.totalExpenses)}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
            <span>{expenses.length} transaction(s)</span>
            <button
              onClick={onOpenAddExpense}
              className="text-rose-400 hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
            >
              + Add
            </button>
          </div>
        </div>

        {/* Net Monthly Savings */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative group hover:border-teal-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Savings</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold tracking-tight ${overview.netSavings >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
            {formatCurrency(overview.netSavings)}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
            <span>{overview.netSavings >= 0 ? 'Monthly Surplus' : 'Monthly Deficit'}</span>
            <button
              onClick={() => onGoToTab('goals')}
              className="text-teal-400 hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
            >
              Allocate
            </button>
          </div>
        </div>

        {/* Savings Rate % */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative group hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Savings Rate</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-white tracking-tight">
              {overview.savingsRate}%
            </div>
            <span className={`text-xs font-semibold ${overview.savingsRate >= 20 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {overview.savingsRate >= 20 ? 'Healthy (≥20%)' : 'Needs attention'}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Target: 20% rule</span>
            <span className="text-slate-300 font-medium">{overview.goalsCount} active goal(s)</span>
          </div>
        </div>
      </div>

      {/* Alerts Strip (if any) */}
      {overview.alerts && overview.alerts.length > 0 && (
        <div className="space-y-2">
          {overview.alerts.slice(0, 3).map((alert, idx) => {
            let bg = 'bg-slate-800/80 border-slate-700 text-slate-200';
            let icon = <AlertCircle className="w-4 h-4 text-blue-400 shrink-0" />;
            if (alert.type === 'danger') {
              bg = 'bg-rose-500/10 border-rose-500/30 text-rose-200';
              icon = <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />;
            } else if (alert.type === 'warning') {
              bg = 'bg-amber-500/10 border-amber-500/30 text-amber-200';
              icon = <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
            } else if (alert.type === 'success') {
              bg = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200';
              icon = <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
            }
            return (
              <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border text-xs sm:text-sm font-medium ${bg}`}>
                {icon}
                <span className="flex-1">{alert.message}</span>
                {alert.category && (
                  <button
                    onClick={() => onAskAiPrompt(`How can I optimize my spending in the "${alert.category}" category?`)}
                    className="text-xs underline hover:text-white cursor-pointer ml-2"
                  >
                    Ask AI
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Main Grid: Category Budget Tracker & 50/30/20 Rule Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Budget Tracker (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Category Spending & Budgets</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Comparison of actual expenses against monthly planned limits
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAddBudget}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              >
                + Set Budget
              </button>
              <button
                onClick={() => onGoToTab('budgets')}
                className="text-xs font-semibold text-emerald-400 hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>
          </div>

          {/* Overall Budget Progress */}
          {overview.totalBudgetLimit > 0 && (
            <div className="mb-6 p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="text-slate-300">Overall Budget Utilization</span>
                <span className={overview.budgetUtilization > 100 ? 'text-rose-400' : 'text-emerald-400'}>
                  {formatCurrency(overview.totalExpenses)} / {formatCurrency(overview.totalBudgetLimit)} ({overview.budgetUtilization}%)
                </span>
              </div>
              <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    overview.budgetUtilization > 100
                      ? 'bg-rose-500'
                      : overview.budgetUtilization > 85
                      ? 'bg-amber-400'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(overview.budgetUtilization, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Categories List */}
          <div className="space-y-3.5">
            {overview.categoryBreakdown.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No expense records logged for this month yet.{' '}
                <button onClick={onOpenAddExpense} className="text-emerald-400 underline cursor-pointer">
                  Log your first expense
                </button>
              </div>
            ) : (
              overview.categoryBreakdown.map((item) => {
                let badgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                let barClass = 'bg-emerald-500';
                if (item.status === 'exceeded') {
                  badgeClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                  barClass = 'bg-rose-500';
                } else if (item.status === 'warning') {
                  badgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                  barClass = 'bg-amber-400';
                }

                return (
                  <div key={item.category} className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">{item.category}</span>
                        {item.limit > 0 && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${badgeClass}`}>
                            {item.status === 'exceeded' ? 'Over budget' : item.status === 'warning' ? 'Near limit' : 'On track'}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-white">{formatCurrency(item.spent)}</span>
                        {item.limit > 0 ? (
                          <span className="text-slate-400 ml-1.5">/ {formatCurrency(item.limit)}</span>
                        ) : (
                          <span className="text-slate-500 ml-1.5 text-[11px]">(no limit set)</span>
                        )}
                      </div>
                    </div>

                    {item.limit > 0 ? (
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${barClass}`}
                          style={{ width: `${Math.min(item.percentage, 100)}%` }}
                        />
                      </div>
                    ) : (
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-600 rounded-full"
                          style={{
                            width: `${Math.min((item.spent / (overview.totalExpenses || 1)) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: 50/30/20 Rule & Quick Savings Goals */}
        <div className="space-y-6">
          {/* 50/30/20 Rule Benchmark Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">50 / 30 / 20 Budget Rule</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Monthly Breakdown</span>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Standard financial rule allocates 50% to essential Needs, 30% to Lifestyle Wants, and 20% to Wealth Savings.
            </p>

            <div className="space-y-3">
              {/* Needs */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Needs (Target: ≤50%)</span>
                  <span className={`font-semibold ${needsPct > 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {needsPct}% ({formatCurrency(totalNeeds)})
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${needsPct > 50 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(needsPct, 100)}%` }}
                  />
                </div>
              </div>

              {/* Wants */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Wants (Target: ≤30%)</span>
                  <span className={`font-semibold ${wantsPct > 30 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {wantsPct}% ({formatCurrency(totalWants)})
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${wantsPct > 30 ? 'bg-rose-500' : 'bg-teal-500'}`}
                    style={{ width: `${Math.min(wantsPct, 100)}%` }}
                  />
                </div>
              </div>

              {/* Savings */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Savings (Target: ≥20%)</span>
                  <span className={`font-semibold ${savingsPct >= 20 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {savingsPct}% ({formatCurrency(overview.netSavings)})
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${savingsPct >= 20 ? 'bg-indigo-500' : 'bg-amber-400'}`}
                    style={{ width: `${Math.max(0, Math.min(savingsPct, 100))}%` }}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => onAskAiPrompt(`Evaluate my 50/30/20 spending distribution: Needs: ${needsPct}%, Wants: ${wantsPct}%, Savings: ${savingsPct}%. How can I get closer to optimal?`)}
              className="w-full mt-4 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-emerald-400 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI Advisor to Balance</span>
            </button>
          </div>

          {/* Active Goals Preview */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">Savings Goals</h3>
              <button
                onClick={() => onGoToTab('goals')}
                className="text-xs text-emerald-400 hover:underline cursor-pointer font-semibold"
              >
                View all ({goals.length})
              </button>
            </div>

            {goals.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-500">
                No active savings goals set.{' '}
                <button onClick={() => onGoToTab('goals')} className="text-emerald-400 underline cursor-pointer">
                  Create a goal
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {goals.slice(0, 2).map((g) => {
                  const pct = Math.min(Math.round((g.current_amount / g.target_amount) * 100), 100);
                  return (
                    <div key={g.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-semibold text-slate-200">{g.title}</span>
                        <span className="text-emerald-400 font-bold">{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1.5">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>{formatCurrency(g.current_amount)} saved</span>
                        <span>Target: {formatCurrency(g.target_amount)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Recent Transactions</h3>
          </div>
          <button
            onClick={() => onGoToTab('transactions')}
            className="text-xs text-emerald-400 hover:underline font-semibold cursor-pointer"
          >
            Manage all transactions
          </button>
        </div>

        {expenses.length === 0 && income.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">No transactions found for this month.</div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {expenses.slice(0, 5).map((exp) => (
              <div key={exp.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200">{exp.description}</div>
                    <div className="text-slate-400 text-[11px] flex items-center gap-2">
                      <span>{exp.category}</span>
                      <span>•</span>
                      <span>{exp.date}</span>
                      <span>•</span>
                      <span>{exp.payment_method}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right font-bold text-rose-400 text-sm">
                  -{formatCurrency(exp.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
