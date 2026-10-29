import React from 'react';
import {
  Calendar,
  Sparkles,
  RefreshCw,
  Database,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  CheckCircle2,
  DollarSign,
  Coins,
  Bot,
} from 'lucide-react';
import { CurrencyCode } from '../types/finance';

interface NavbarProps {
  currentMonth: string;
  onMonthChange: (month: string) => void;
  activeTab: 'overview' | 'transactions' | 'budgets' | 'goals' | 'ai';
  onTabChange: (tab: 'overview' | 'transactions' | 'budgets' | 'goals' | 'ai') => void;
  onOpenAddExpense: () => void;
  onOpenAddIncome: () => void;
  onOpenScenarios: () => void;
  onOpenDataModal: () => void;
  scenarioName: string;
  refreshing: boolean;
  onRefresh: () => void;
  currency: CurrencyCode;
  onCurrencyChange: (c: CurrencyCode) => void;
  serverStatusText?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMonth,
  onMonthChange,
  activeTab,
  onTabChange,
  onOpenAddExpense,
  onOpenAddIncome,
  onOpenScenarios,
  onOpenDataModal,
  scenarioName,
  refreshing,
  onRefresh,
  currency,
  onCurrencyChange,
  serverStatusText = 'Personal Finance Advisor Bot is running',
}) => {
  // Format month label
  const formatMonthLabel = (m: string) => {
    try {
      const [year, month] = m.split('-').map(Number);
      const date = new Date(year, month - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return m;
    }
  };

  const shiftMonth = (delta: number) => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + delta, 1);
    const newMonthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    onMonthChange(newMonthStr);
  };

  const tabs: Array<{
    id: 'overview' | 'transactions' | 'budgets' | 'goals' | 'ai';
    label: string;
    isAi?: boolean;
  }> = [
    { id: 'overview', label: 'Dashboard' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'budgets', label: 'Budgets' },
    { id: 'goals', label: 'Savings Goals' },
    { id: 'ai', label: 'AI Advisor', isAi: true },
  ];

  return (
    <div className="bg-white border-b border-slate-200/90 select-none">
      {/* 1. Topbar (Matching .topbar in style.css) */}
      <div className="h-14 border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between text-xs text-slate-500">
        {/* Left: Server Status Pill */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-medium text-slate-700 hidden sm:inline">
            {serverStatusText}
          </span>
          <span className="font-medium text-slate-700 sm:hidden">Online</span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Currency Toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              onClick={() => onCurrencyChange('INR')}
              className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                currency === 'INR'
                  ? 'bg-white text-[#1235ee] shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Indian Rupee"
            >
              ₹ INR
            </button>
            <button
              onClick={() => onCurrencyChange('USD')}
              className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                currency === 'USD'
                  ? 'bg-white text-[#1235ee] shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="US Dollar"
            >
              $ USD
            </button>
          </div>

          {/* Month Navigator */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              onClick={() => shiftMonth(-1)}
              className="p-1 hover:bg-white rounded text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-1 px-2 text-[11px] font-bold text-slate-700">
              <Calendar className="w-3 h-3 text-[#1235ee]" />
              <span>{formatMonthLabel(currentMonth)}</span>
            </div>
            <button
              onClick={() => shiftMonth(1)}
              className="p-1 hover:bg-white rounded text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className={`p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer ${
              refreshing ? 'animate-spin text-[#1235ee]' : ''
            }`}
            title="Refresh database records"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Add Actions */}
          <button
            onClick={onOpenAddIncome}
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold text-[11px] transition-colors cursor-pointer"
          >
            <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ Income</span>
          </button>
          <button
            onClick={onOpenAddExpense}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1235ee] text-white hover:bg-[#173df0] font-bold text-[11px] shadow-sm transition-colors cursor-pointer"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+ Expense</span>
          </button>

          {/* User Avatar */}
          <div
            className="w-7 h-7 rounded-full bg-[#697386] text-white font-bold flex items-center justify-center text-[10px] shadow-sm"
            title="User Profile"
          >
            PF
          </div>
        </div>
      </div>

      {/* 2. Project Head (Matching .project-head in style.css) */}
      <div className="px-4 sm:px-8 py-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Personal Finance Advisor Bot</span>
            <span className="text-xl">💰</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Smart personal finance management with income & expense tracking, category budgets, savings goals, monthly analytics, and Gemini AI advisor bot.
          </p>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-full border border-slate-200 overflow-x-auto">
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {tab.isAi && <Sparkles className="w-3 h-3 text-amber-400" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
