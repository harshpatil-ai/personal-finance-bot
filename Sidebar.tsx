import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  Target,
  Bot,
  Play,
  Database,
  UserCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { ScenarioKey } from '../types/finance';

interface SidebarProps {
  activeTab: 'overview' | 'transactions' | 'budgets' | 'goals' | 'ai';
  onTabChange: (tab: 'overview' | 'transactions' | 'budgets' | 'goals' | 'ai') => void;
  onRunDemoFlow: () => void;
  scenarioName: string;
  onOpenScenarios: () => void;
  onOpenDataModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onRunDemoFlow,
  scenarioName,
  onOpenScenarios,
  onOpenDataModal,
}) => {
  const navItems: Array<{
    id: 'overview' | 'transactions' | 'budgets' | 'goals' | 'ai';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    isAi?: boolean;
  }> = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'budgets', label: 'Budgets & Limits', icon: PiggyBank },
    { id: 'goals', label: 'Savings Goals', icon: Target },
    { id: 'ai', label: 'AI Advisor Bot', icon: Bot, isAi: true },
  ];

  return (
    <aside className="w-56 bg-[#1235ee] text-white flex-none flex flex-col justify-between p-5 min-h-screen select-none">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-9 px-1">
          <div className="bg-white text-[#1235ee] font-black rounded-lg text-lg px-2.5 py-1 tracking-tight shadow-sm">
            PF
          </div>
          <div>
            <b className="block text-xs uppercase tracking-wider font-extrabold text-white">
              Personal Finance
            </b>
            <span className="text-[10px] text-blue-200 tracking-wide font-medium">
              Advisor Bot
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-[#1736e8] shadow-sm font-bold'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#1736e8]' : 'text-blue-200'}`} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.isAi && (
                  <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        {/* 1-Click Demo Flow Shortcut */}
        <div className="mt-6 pt-5 border-t border-white/15">
          <span className="block text-[10px] uppercase font-bold text-blue-200 mb-2 px-1 tracking-wider">
            Quick Demos
          </span>
          <button
            onClick={onRunDemoFlow}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white/15 hover:bg-white/25 text-white transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white text-white" />
            <span>1-Click Demo Flow</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-6 border-t border-white/15 space-y-3">
        {/* Active Profile */}
        <div>
          <span className="block text-[10px] uppercase font-bold text-blue-200 mb-1 px-1">
            Active Profile
          </span>
          <button
            onClick={onOpenScenarios}
            className="w-full text-left px-2.5 py-1.5 rounded-lg bg-blue-900/40 hover:bg-blue-900/60 border border-white/10 text-[11px] font-medium text-white flex items-center justify-between transition-colors cursor-pointer"
            title="Switch Scenario Profile"
          >
            <span className="truncate">{scenarioName}</span>
            <UserCheck className="w-3.5 h-3.5 text-blue-200 shrink-0 ml-1" />
          </button>
        </div>

        {/* Data & Backup */}
        <button
          onClick={onOpenDataModal}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-blue-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <Database className="w-3.5 h-3.5 text-blue-200" />
          <span>Backup / Export</span>
        </button>

        {/* Engine status */}
        <div className="flex items-center gap-2 text-[10px] text-blue-200 pt-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Engine Online (SQLite)</span>
        </div>
      </div>
    </aside>
  );
};
