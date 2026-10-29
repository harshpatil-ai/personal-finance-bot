import React, { useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Sparkles,
  Bot,
  RefreshCw,
  Play,
  CheckCircle2,
  Tag,
  Calendar,
  AlertCircle,
  HelpCircle,
  Trash2,
  TrendingUp,
  TrendingDown,
  Layers,
  ChevronRight,
  Check,
} from 'lucide-react';
import {
  FinanceOverview,
  Income,
  Expense,
  Category,
  AdviceData,
  SummaryData,
  UnifiedTransaction,
} from '../types/finance';

interface DashboardTabProps {
  overview: FinanceOverview | null;
  summary: SummaryData | null;
  advice: AdviceData | null;
  expenses: Expense[];
  income: Income[];
  categories: Category[];
  currencySymbol: string;
  onRefresh: () => void;
  onOpenAddExpense: () => void;
  onOpenAddIncome: () => void;
  onRunDemoFlow: () => Promise<void>;
  onGoToTab: (tab: 'transactions' | 'budgets' | 'goals' | 'ai') => void;
  onAskAiPrompt: (prompt: string) => void;
  onDeleteIncome: (id: string) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
  onSaveQuickTransaction: (data: {
    kind: 'income' | 'expense';
    category: string;
    amount: number;
    note: string;
    is_recurring: boolean;
  }) => Promise<void>;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  overview,
  summary,
  advice,
  expenses,
  income,
  categories,
  currencySymbol,
  onRefresh,
  onOpenAddExpense,
  onOpenAddIncome,
  onRunDemoFlow,
  onGoToTab,
  onAskAiPrompt,
  onDeleteIncome,
  onDeleteExpense,
  onSaveQuickTransaction,
}) => {
  // Quick inline form state
  const [quickKind, setQuickKind] = useState<'income' | 'expense'>('expense');
  const [quickAmount, setQuickAmount] = useState<string>('');
  const [quickCategory, setQuickCategory] = useState<string>('');
  const [quickNote, setQuickNote] = useState<string>('');
  const [quickRecurring, setQuickRecurring] = useState<boolean>(false);
  const [quickSubmitting, setQuickSubmitting] = useState<boolean>(false);
  const [quickError, setQuickError] = useState<string | null>(null);

  // Step-by-step demo player state
  const [demoStep, setDemoStep] = useState<number>(0);
  const [demoPlaying, setDemoPlaying] = useState<boolean>(false);

  // Fallbacks from summary or overview
  const totalIncome = summary?.income ?? overview?.totalIncome ?? 0;
  const totalExpense = summary?.expense ?? overview?.totalExpenses ?? 0;
  const netBalance = summary?.balance ?? overview?.netSavings ?? 0;
  const savingsRate = summary?.savings_rate ?? overview?.savingsRate ?? 0;
  const topCategory = summary?.top_category ?? (overview?.categoryBreakdown[0]?.category || '—');

  // Categories filtered for quick form
  const relevantCategories = categories.filter((c) => c.type === quickKind);

  // Format currency helper
  const formatMoney = (val: number) => {
    return `${currencySymbol}${Math.round(val).toLocaleString('en-IN')}`;
  };

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickError(null);
    const amountNum = parseFloat(quickAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setQuickError('Please enter a valid amount greater than 0.');
      return;
    }
    const catToSave = quickCategory || relevantCategories[0]?.name || (quickKind === 'income' ? 'Salary & Wages' : 'Groceries & Food');

    setQuickSubmitting(true);
    try {
      await onSaveQuickTransaction({
        kind: quickKind,
        category: catToSave,
        amount: amountNum,
        note: quickNote.trim(),
        is_recurring: quickRecurring,
      });
      // Reset form fields
      setQuickAmount('');
      setQuickNote('');
      setQuickRecurring(false);
    } catch (err: any) {
      setQuickError(err.message || 'Failed to save transaction');
    } finally {
      setQuickSubmitting(false);
    }
  };

  // Step-by-step demo execution
  const handleStepByStepDemo = async () => {
    if (demoPlaying) return;
    setDemoPlaying(true);
    setDemoStep(1);

    try {
      // Step 1: Add Income 25000 Other
      await onSaveQuickTransaction({
        kind: 'income',
        category: 'Allowance & Stipend',
        amount: 25000,
        note: 'Monthly allowance',
        is_recurring: true,
      });
      setDemoStep(2);
      await new Promise((r) => setTimeout(r, 600));

      // Step 2: Add Expense 4500 Food
      await onSaveQuickTransaction({
        kind: 'expense',
        category: 'Groceries & Food',
        amount: 4500,
        note: 'Food & Meals',
        is_recurring: false,
      });
      setDemoStep(3);
      await new Promise((r) => setTimeout(r, 600));

      // Step 3: Add Expense 1800 Transport
      await onSaveQuickTransaction({
        kind: 'expense',
        category: 'Transportation',
        amount: 1800,
        note: 'Transport & Commute',
        is_recurring: false,
      });
      setDemoStep(4);
      await new Promise((r) => setTimeout(r, 600));

      // Step 4: Add Expense 2500 Education
      await onSaveQuickTransaction({
        kind: 'expense',
        category: 'Education & Books',
        amount: 2500,
        note: 'Education & Courses',
        is_recurring: false,
      });
      setDemoStep(5);
      await new Promise((r) => setTimeout(r, 600));
    } finally {
      setDemoPlaying(false);
    }
  };

  // Combined recent transactions list (sorted newest first)
  const unifiedTransactions = [
    ...income.map((i) => ({
      id: i.id,
      kind: 'income' as const,
      category: i.category,
      amount: i.amount,
      note: i.notes || i.source,
      date: i.date,
      is_recurring: i.is_recurring,
      raw: i,
    })),
    ...expenses.map((e) => ({
      id: e.id,
      kind: 'expense' as const,
      category: e.category,
      amount: e.amount,
      note: e.notes || e.description,
      date: e.date,
      is_recurring: e.is_recurring,
      raw: e,
    })),
  ].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return (
    <div className="space-y-6">
      {/* Notice Banner (Matching style_9a1c2d05.css .notice) */}
      <div className="notice-banner rounded-xl p-4 sm:p-5 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold">Personal Finance Advisor Bot Active</h3>
              <span className="text-[10px] bg-white/25 px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                Live Engine
              </span>
            </div>
            <p className="text-xs text-white/90 mt-0.5 max-w-2xl">
              Automatic cash flow recalculations, category budget tracking, and real-time AI financial advice. Test the 1-click Demo Flow or add your transactions below.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRunDemoFlow}
            className="px-3.5 py-2 text-xs font-bold rounded-lg bg-white text-[#1235ee] hover:bg-white/90 transition-all shadow cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-[#1235ee]" />
            <span>1-Click Demo Flow</span>
          </button>
          <button
            onClick={() => onGoToTab('ai')}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-black/20 hover:bg-black/30 border border-white/30 text-white transition-all cursor-pointer flex items-center gap-1 shrink-0"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Chat AI</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Grid (minmax(0,1fr) 315px) */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* 1. Intro Card (Matching .intro .card) */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm text-slate-800">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Smart Financial Intelligence Dashboard</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Track your monthly income and expenses, maintain category budgets, watch your net savings grow, and receive instant AI-driven financial insights based on your spending ratio.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <button
                  onClick={onOpenAddIncome}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                >
                  + Add Income
                </button>
                <button
                  onClick={onOpenAddExpense}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                >
                  + Add Expense
                </button>
              </div>
            </div>
          </div>

          {/* 2. Stats Grid (Matching .stats .purple .green .blue) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Total Income */}
            <div className="stat-card purple p-4 rounded-xl text-white shadow-sm flex flex-col justify-between min-h-[110px]">
              <div className="flex items-center justify-between text-xs opacity-90">
                <span className="font-semibold uppercase tracking-wider text-[10px]">TOTAL INCOME</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-2xl font-bold tracking-tight block">
                  {formatMoney(totalIncome)}
                </strong>
                <span className="text-[11px] opacity-85 mt-1 block">
                  {income.length} record(s) logged
                </span>
              </div>
            </div>

            {/* Total Expenses */}
            <div className="stat-card green p-4 rounded-xl text-white shadow-sm flex flex-col justify-between min-h-[110px]">
              <div className="flex items-center justify-between text-xs opacity-90">
                <span className="font-semibold uppercase tracking-wider text-[10px]">TOTAL EXPENSES</span>
                <TrendingDown className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-2xl font-bold tracking-tight block">
                  {formatMoney(totalExpense)}
                </strong>
                <span className="text-[11px] opacity-85 mt-1 block">
                  {expenses.length} transaction(s)
                </span>
              </div>
            </div>

            {/* Net Balance / Savings */}
            <div className="stat-card blue p-4 rounded-xl text-white shadow-sm flex flex-col justify-between min-h-[110px]">
              <div className="flex items-center justify-between text-xs opacity-90">
                <span className="font-semibold uppercase tracking-wider text-[10px]">NET BALANCE</span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-bold">
                  {savingsRate}% saved
                </span>
              </div>
              <div>
                <strong className="text-2xl font-bold tracking-tight block">
                  {formatMoney(netBalance)}
                </strong>
                <span className="text-[11px] opacity-85 mt-1 block">
                  {netBalance >= 0 ? 'Monthly Surplus' : 'Monthly Deficit'}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Fast Transaction Form (Matching .forms .seg .primary) */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm text-slate-800">
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Record Transaction</h3>
                <p className="text-xs text-slate-500">Quickly add an inflow or outflow to update your balance</p>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                Instant Recalc
              </span>
            </div>

            {quickError && (
              <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{quickError}</span>
              </div>
            )}

            <form onSubmit={handleQuickSubmit} className="space-y-3.5">
              {/* Kind Toggle Button Group */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setQuickKind('expense');
                    const firstExp = categories.find((c) => c.type === 'expense');
                    if (firstExp) setQuickCategory(firstExp.name);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    quickKind === 'expense'
                      ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                  <span>Expense (Outflow)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuickKind('income');
                    const firstInc = categories.find((c) => c.type === 'income');
                    if (firstInc) setQuickCategory(firstInc.name);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    quickKind === 'income'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Income (Inflow)</span>
                </button>
              </div>

              {/* Form Row: Amount & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Amount ({currencySymbol})
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      required
                      placeholder="e.g. 2500"
                      value={quickAmount}
                      onChange={(e) => setQuickAmount(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-[#1235ee] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Category
                  </label>
                  <select
                    value={quickCategory || relevantCategories[0]?.name || ''}
                    onChange={(e) => setQuickCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#1235ee] transition-all cursor-pointer"
                  >
                    {relevantCategories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Form Row: Description & Recurring Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-center">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {quickKind === 'income' ? 'Source / Note' : 'Description / Vendor'}
                  </label>
                  <input
                    type="text"
                    placeholder={quickKind === 'income' ? 'e.g. Monthly allowance, salary...' : 'e.g. Food, Groceries, Metro commute...'}
                    value={quickNote}
                    onChange={(e) => setQuickNote(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#1235ee] transition-all"
                  />
                </div>

                {/* Recurring Checkbox */}
                <div className="pt-2 sm:pt-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={quickRecurring}
                      onChange={(e) => setQuickRecurring(e.target.checked)}
                      className="rounded text-[#1235ee] focus:ring-[#1235ee]"
                    />
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Monthly Recurring</span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={quickSubmitting}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#173df0] hover:bg-[#1235ee] text-white text-xs font-bold shadow transition-all cursor-pointer disabled:opacity-50"
                >
                  {quickSubmitting
                    ? 'Saving...'
                    : `+ Add ${quickKind === 'income' ? 'Income' : 'Expense'}`}
                </button>
              </div>
            </form>
          </div>

          {/* 4. AI Advisor Box (Matching .advisor .bot-icon) */}
          <div className="advisor-box rounded-xl p-4 sm:p-5 border border-[#e2e7ff] bg-[#f5f7ff] shadow-sm flex flex-col sm:flex-row items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#173df0] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {advice?.title || 'AI-style financial insight'}
                </h3>
                <button
                  onClick={onRefresh}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Recalculate advice"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {advice?.text || 'Add your monthly income and a few expenses to generate personalized budget suggestions.'}
              </p>
              {advice?.tip && (
                <div className="mt-2 text-[11px] font-medium text-[#173df0] bg-white/80 p-2 rounded-lg border border-[#dbe3ff] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>{advice.tip}</span>
                </div>
              )}
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => onAskAiPrompt(`Explain this financial insight in detail and give me 3 ways to improve: "${advice?.text || ''}"`)}
                  className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-[#173df0] text-white hover:bg-[#1235ee] transition-all cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Deep Dive with Gemini</span>
                </button>
                <button
                  onClick={() => onGoToTab('ai')}
                  className="px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Open Advisor Chat
                </button>
              </div>
            </div>
          </div>

          {/* 5. Live Transactions Table (Matching .table-wrap table) */}
          <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Live Transaction History</h3>
                <p className="text-xs text-slate-500">
                  Showing {unifiedTransactions.length} recorded entry/entries
                </p>
              </div>
              <button
                onClick={() => onGoToTab('transactions')}
                className="text-xs font-semibold text-[#173df0] hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <span>View Full Ledger</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200/80 text-left text-slate-500 font-semibold">
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4">Amount</th>
                    <th className="py-2.5 px-4">Note / Description</th>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unifiedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        No transactions recorded yet. Use the form above or click "1-Click Demo Flow".
                      </td>
                    </tr>
                  ) : (
                    unifiedTransactions.slice(0, 8).map((tx) => {
                      const isInc = tx.kind === 'income';
                      return (
                        <tr key={`${tx.kind}-${tx.id}`} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-bold">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] ${
                                isInc
                                  ? 'bg-emerald-50 text-[#16895e] border border-emerald-200'
                                  : 'bg-rose-50 text-[#dc4c4c] border border-rose-200'
                              }`}
                            >
                              {isInc ? '↑ Income' : '↓ Expense'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800">
                            <span className="flex items-center gap-1.5">
                              <Tag className="w-3 h-3 text-slate-400" />
                              {tx.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <span className={isInc ? 'text-[#16895e]' : 'text-slate-900'}>
                              {isInc ? '+' : '-'}
                              {formatMoney(tx.amount)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                            <div className="flex items-center gap-1.5">
                              <span>{tx.note || '—'}</span>
                              {Boolean(tx.is_recurring) && (
                                <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200 font-medium">
                                  Recurring
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {tx.date}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                if (confirm(`Delete this ${tx.kind} record?`)) {
                                  if (isInc) onDeleteIncome(tx.id);
                                  else onDeleteExpense(tx.id);
                                }
                              }}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete transaction"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (320px) */}
        <div className="space-y-5">
          {/* 1. Official Demo Flow Card (Matching demo_data_b19358bc.txt) */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-sm text-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#1235ee] bg-blue-50 px-2 py-0.5 rounded">
                Official Demo Test
              </span>
              <span className="text-[11px] text-slate-400">demo_data.txt</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              ⚡ 1-Click Demo Flow
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              Loads the benchmark dataset to test automatic balance updates and advisor insights:
            </p>

            {/* Steps list */}
            <div className="space-y-2 mb-4 text-xs">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${demoStep >= 1 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {demoStep >= 1 ? <Check className="w-3 h-3" /> : '1'}
                </div>
                <div className="flex-1 text-[11px]">
                  <strong>Add Income:</strong> {currencySymbol}25,000 (Allowance)
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${demoStep >= 2 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {demoStep >= 2 ? <Check className="w-3 h-3" /> : '2'}
                </div>
                <div className="flex-1 text-[11px]">
                  <strong>Add Expense:</strong> {currencySymbol}4,500 (Food)
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${demoStep >= 3 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {demoStep >= 3 ? <Check className="w-3 h-3" /> : '3'}
                </div>
                <div className="flex-1 text-[11px]">
                  <strong>Add Expense:</strong> {currencySymbol}1,800 (Transport)
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${demoStep >= 4 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {demoStep >= 4 ? <Check className="w-3 h-3" /> : '4'}
                </div>
                <div className="flex-1 text-[11px]">
                  <strong>Add Expense:</strong> {currencySymbol}2,500 (Education)
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50/70 border border-emerald-100">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${demoStep >= 5 ? 'bg-emerald-500 text-white' : 'bg-emerald-200 text-emerald-800'}`}>
                  {demoStep >= 5 ? <Check className="w-3 h-3" /> : '5'}
                </div>
                <div className="flex-1 text-[11px] text-emerald-900 font-semibold">
                  Dashboard updates & generates insight
                </div>
              </div>
            </div>

            {/* Runner Buttons */}
            <div className="space-y-2">
              <button
                onClick={onRunDemoFlow}
                className="w-full py-2.5 px-3 rounded-lg bg-[#1235ee] hover:bg-[#173df0] text-white text-xs font-bold shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Load Complete Demo Flow</span>
              </button>
              <button
                onClick={handleStepByStepDemo}
                disabled={demoPlaying}
                className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                {demoPlaying ? `Playing Step ${demoStep}...` : 'Play Step-by-Step Simulation'}
              </button>
            </div>
          </div>

          {/* 2. Category Spending Progress Card (Matching .progress-card .bar) */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-sm text-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Spending by Category</h3>
              <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                Top: {topCategory}
              </span>
            </div>

            <div className="space-y-3">
              {overview?.categoryBreakdown && overview.categoryBreakdown.length > 0 ? (
                overview.categoryBreakdown.slice(0, 5).map((cat) => {
                  const shareOfTotal = totalExpense > 0 ? Math.round((cat.spent / totalExpense) * 100) : 0;
                  return (
                    <div key={cat.category}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700">{cat.category}</span>
                        <span className="text-slate-500 font-medium">
                          {formatMoney(cat.spent)} ({shareOfTotal}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#2563eb] rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(shareOfTotal, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">
                  No expense records yet to calculate breakdown.
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Planned Budgets:</span>
              <button
                onClick={() => onGoToTab('budgets')}
                className="text-[#1235ee] font-semibold hover:underline cursor-pointer"
              >
                Manage Limits →
              </button>
            </div>
          </div>

          {/* 3. Monthly Recurring Commitments Card */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-sm text-slate-800">
            <div className="flex items-center gap-2 mb-2 text-[#1235ee]">
              <RefreshCw className="w-4 h-4" />
              <h3 className="text-sm font-bold text-slate-900">Recurring Commitments</h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Monthly scheduled subscriptions, salary, and recurring bills:
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-600">Recurring Inflows:</span>
                <span className="font-bold text-[#16895e]">
                  +{formatMoney(overview?.recurringIncome || 0)}
                </span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-600">Recurring Bills:</span>
                <span className="font-bold text-[#dc4c4c]">
                  -{formatMoney(overview?.recurringExpenses || 0)}
                </span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-blue-50 text-[#1235ee] font-bold">
                <span>Net Recurring Buffer:</span>
                <span>
                  {formatMoney((overview?.recurringIncome || 0) - (overview?.recurringExpenses || 0))}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Architecture & Stack Card (Matching .architecture .tags .skills) */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-sm text-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              System Architecture & Stack
            </h3>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="text-[10px] font-semibold bg-[#e8f0ff] text-[#2152dd] px-2 py-1 rounded-md">
                Python / Flask API
              </span>
              <span className="text-[10px] font-semibold bg-[#e8f0ff] text-[#2152dd] px-2 py-1 rounded-md">
                Express + SQLite
              </span>
              <span className="text-[10px] font-semibold bg-[#e8f0ff] text-[#2152dd] px-2 py-1 rounded-md">
                Gemini 3.8 Flash AI
              </span>
              <span className="text-[10px] font-semibold bg-[#e8f0ff] text-[#2152dd] px-2 py-1 rounded-md">
                React 19 & Tailwind
              </span>
            </div>

            <div className="architecture-box bg-[#f7f8fc] rounded-lg p-3 text-center text-[11px] text-[#31415d] leading-relaxed">
              <code>Client UI ⇄ REST API ⇄ SQLite DB ⇄ Gemini AI Advisor</code>
            </div>
          </div>

          {/* 5. Expandable Guidelines & FAQ (Matching details summary in style.css) */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-sm text-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Advisor Rules & Reference
            </h3>

            <details className="text-xs group border-b border-slate-100 pb-2">
              <summary className="font-semibold text-slate-800 cursor-pointer hover:text-[#1235ee] select-none py-1">
                How does the AI Advisor calculate insights?
              </summary>
              <p className="text-slate-500 text-[11px] mt-1 leading-relaxed pl-2 border-l-2 border-blue-300">
                The bot evaluates your expense-to-income ratio. Above 80% triggers high-risk alerts to cut discretionary spending; 60–80% recommends trimming the highest spending category; under 60% validates healthy emergency cushion building.
              </p>
            </details>

            <details className="text-xs group border-b border-slate-100 pb-2">
              <summary className="font-semibold text-slate-800 cursor-pointer hover:text-[#1235ee] select-none py-1">
                What is the 50 / 30 / 20 rule?
              </summary>
              <p className="text-slate-500 text-[11px] mt-1 leading-relaxed pl-2 border-l-2 border-blue-300">
                50% of net income is allocated for essential Needs (rent, groceries, utilities), 30% for Lifestyle Wants (entertainment, dining), and 20% toward Savings or debt reduction.
              </p>
            </details>

            <details className="text-xs group">
              <summary className="font-semibold text-slate-800 cursor-pointer hover:text-[#1235ee] select-none py-1">
                How do recurring items work?
              </summary>
              <p className="text-slate-500 text-[11px] mt-1 leading-relaxed pl-2 border-l-2 border-blue-300">
                Checking the 'Monthly Recurring' flag marks regular commitments like monthly salaries, rent, subscriptions, or allowances for baseline projections.
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
};
