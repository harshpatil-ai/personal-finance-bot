import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardTab } from './components/DashboardTab';
import { TransactionsTab } from './components/TransactionsTab';
import { BudgetsTab } from './components/BudgetsTab';
import { GoalsTab } from './components/GoalsTab';
import { AiAdvisorTab } from './components/AiAdvisorTab';
import { TransactionModal } from './components/TransactionModal';
import { BudgetModal } from './components/BudgetModal';
import { GoalModal } from './components/GoalModal';
import { ScenarioModal } from './components/ScenarioModal';
import { DataModal } from './components/DataModal';
import {
  FinanceOverview,
  Income,
  Expense,
  Budget,
  SavingsGoal,
  Category,
  ScenarioKey,
  SummaryData,
  AdviceData,
  CurrencyCode,
} from './types/finance';
import { api } from './services/api';

export default function App() {
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    return new Date().toISOString().slice(0, 7);
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'budgets' | 'goals' | 'ai'>('overview');
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const currencySymbol = currency === 'INR' ? '₹' : '$';

  // Core Data
  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [advice, setAdvice] = useState<AdviceData | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>('salaried');
  const [scenarioName, setScenarioName] = useState<string>('Salaried Professional');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [serverStatusText, setServerStatusText] = useState<string>('Personal Finance Advisor Bot is running');
  const [initialAiPrompt, setInitialAiPrompt] = useState<string>('');

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalType, setTxModalType] = useState<'income' | 'expense'>('expense');
  const [editingTx, setEditingTx] = useState<Income | Expense | null>(null);

  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingBudgetCategory, setEditingBudgetCategory] = useState<string | undefined>(undefined);
  const [editingBudgetLimit, setEditingBudgetLimit] = useState<number | undefined>(undefined);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);

  // Load all data
  const loadAllData = useCallback(async (month: string) => {
    setRefreshing(true);
    try {
      const [ovData, sumData, advData, expData, incData, bgtData, goalsData, catsData, healthData] = await Promise.all([
        api.getOverview(month),
        api.getSummary(month).catch(() => null),
        api.getAdvice(month).catch(() => null),
        api.getExpenses(month),
        api.getIncome(month),
        api.getBudgets(),
        api.getGoals(),
        api.getCategories(),
        api.getHealth().catch(() => ({ status: 'Personal Finance Advisor Bot is running' })),
      ]);

      setOverview(ovData);
      if (sumData) setSummary(sumData);
      if (advData) setAdvice(advData);
      setExpenses(expData);
      setIncome(incData);
      setBudgets(bgtData);
      setGoals(goalsData);
      setCategories(catsData);
      if (healthData?.status) setServerStatusText(healthData.status);
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData(currentMonth);
  }, [currentMonth, loadAllData]);

  // Income Operations
  const handleSaveIncome = async (data: Partial<Income>) => {
    if (editingTx && 'source' in editingTx) {
      await api.updateIncome(editingTx.id, data);
    } else {
      await api.createIncome(data);
    }
    await loadAllData(currentMonth);
  };

  const handleDeleteIncome = async (id: string) => {
    await api.deleteIncome(id);
    await loadAllData(currentMonth);
  };

  // Expense Operations
  const handleSaveExpense = async (data: Partial<Expense>) => {
    if (editingTx && 'description' in editingTx) {
      await api.updateExpense(editingTx.id, data);
    } else {
      await api.createExpense(data);
    }
    await loadAllData(currentMonth);
  };

  const handleDeleteExpense = async (id: string) => {
    await api.deleteExpense(id);
    await loadAllData(currentMonth);
  };

  // Quick inline transaction from dashboard
  const handleSaveQuickTransaction = async (data: {
    kind: 'income' | 'expense';
    category: string;
    amount: number;
    note: string;
    is_recurring: boolean;
  }) => {
    await api.createUnifiedTransaction({
      kind: data.kind,
      category: data.category,
      amount: data.amount,
      note: data.note,
      date: new Date().toISOString().slice(0, 10),
      is_recurring: data.is_recurring,
    });
    await loadAllData(currentMonth);
  };

  // 1-Click Demo Flow Loader
  const handleRunDemoFlow = async () => {
    try {
      setScenarioKey('demo');
      setScenarioName('Official Demo (Allowance & Essentials)');
      await api.loadDemoFlow();
      await loadAllData(currentMonth);
    } catch (err) {
      console.error('Failed to load demo flow:', err);
    }
  };

  // Budget Operations
  const handleSaveBudget = async (category: string, limit: number) => {
    await api.setBudget(category, limit);
    await loadAllData(currentMonth);
  };

  const handleDeleteBudget = async (id: string) => {
    await api.deleteBudget(id);
    await loadAllData(currentMonth);
  };

  // Goal Operations
  const handleSaveGoal = async (data: Partial<SavingsGoal>) => {
    if (editingGoal) {
      await api.updateGoal(editingGoal.id, data);
    } else {
      await api.createGoal(data);
    }
    await loadAllData(currentMonth);
  };

  const handleContributeGoal = async (goalId: string, amount: number) => {
    await api.contributeToGoal(goalId, amount);
    await loadAllData(currentMonth);
  };

  const handleDeleteGoal = async (id: string) => {
    await api.deleteGoal(id);
    await loadAllData(currentMonth);
  };

  // Scenario switch
  const handleSelectScenario = async (key: ScenarioKey) => {
    setScenarioKey(key);
    const mapName: Record<ScenarioKey, string> = {
      demo: 'Official Demo (Allowance & Essentials)',
      salaried: 'Salaried Professional',
      student: 'College Student',
      freelancer: 'Freelancer / Consultant',
      household: 'Household Family',
      empty: 'Blank Custom Profile',
    };
    setScenarioName(mapName[key] || 'Custom Profile');
    await api.loadScenario(key);
    await loadAllData(currentMonth);
  };

  // AI Prompt jumpstart
  const handleAskAiPrompt = (prompt: string) => {
    setInitialAiPrompt(prompt);
    setActiveTab('ai');
  };

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-[#202532] flex flex-col md:flex-row font-sans selection:bg-[#1235ee]/20 selection:text-[#1235ee]">
      {/* Sidebar (Matching style.css .sidebar) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(t) => setActiveTab(t)}
        onRunDemoFlow={handleRunDemoFlow}
        scenarioName={scenarioName}
        onOpenScenarios={() => setIsScenarioModalOpen(true)}
        onOpenDataModal={() => setIsDataModalOpen(true)}
      />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Navigation & Topbar */}
        <Navbar
          currentMonth={currentMonth}
          onMonthChange={(m) => setCurrentMonth(m)}
          activeTab={activeTab}
          onTabChange={(t) => setActiveTab(t)}
          onOpenAddExpense={() => {
            setEditingTx(null);
            setTxModalType('expense');
            setIsTxModalOpen(true);
          }}
          onOpenAddIncome={() => {
            setEditingTx(null);
            setTxModalType('income');
            setIsTxModalOpen(true);
          }}
          onOpenScenarios={() => setIsScenarioModalOpen(true)}
          onOpenDataModal={() => setIsDataModalOpen(true)}
          scenarioName={scenarioName}
          refreshing={refreshing}
          onRefresh={() => loadAllData(currentMonth)}
          currency={currency}
          onCurrencyChange={(c) => setCurrency(c)}
          serverStatusText={serverStatusText}
        />

        {/* Tab Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <DashboardTab
              overview={overview}
              summary={summary}
              advice={advice}
              expenses={expenses}
              income={income}
              categories={categories}
              currencySymbol={currencySymbol}
              onRefresh={() => loadAllData(currentMonth)}
              onOpenAddExpense={() => {
                setEditingTx(null);
                setTxModalType('expense');
                setIsTxModalOpen(true);
              }}
              onOpenAddIncome={() => {
                setEditingTx(null);
                setTxModalType('income');
                setIsTxModalOpen(true);
              }}
              onRunDemoFlow={handleRunDemoFlow}
              onGoToTab={(t) => setActiveTab(t)}
              onAskAiPrompt={handleAskAiPrompt}
              onDeleteIncome={handleDeleteIncome}
              onDeleteExpense={handleDeleteExpense}
              onSaveQuickTransaction={handleSaveQuickTransaction}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsTab
              income={income}
              expenses={expenses}
              categories={categories}
              currencySymbol={currencySymbol}
              onOpenAddIncome={() => {
                setEditingTx(null);
                setTxModalType('income');
                setIsTxModalOpen(true);
              }}
              onOpenAddExpense={() => {
                setEditingTx(null);
                setTxModalType('expense');
                setIsTxModalOpen(true);
              }}
              onEditIncome={(inc) => {
                setEditingTx(inc);
                setTxModalType('income');
                setIsTxModalOpen(true);
              }}
              onEditExpense={(exp) => {
                setEditingTx(exp);
                setTxModalType('expense');
                setIsTxModalOpen(true);
              }}
              onDeleteIncome={handleDeleteIncome}
              onDeleteExpense={handleDeleteExpense}
            />
          )}

          {activeTab === 'budgets' && (
            <BudgetsTab
              budgets={budgets}
              overview={overview}
              categories={categories}
              onOpenAddBudget={() => {
                setEditingBudgetCategory(undefined);
                setEditingBudgetLimit(undefined);
                setIsBudgetModalOpen(true);
              }}
              onEditBudget={(cat, lim) => {
                setEditingBudgetCategory(cat);
                setEditingBudgetLimit(lim);
                setIsBudgetModalOpen(true);
              }}
              onDeleteBudget={handleDeleteBudget}
              onAskAiPrompt={handleAskAiPrompt}
            />
          )}

          {activeTab === 'goals' && (
            <GoalsTab
              goals={goals}
              netMonthlySavings={overview?.netSavings || 0}
              onOpenAddGoal={() => {
                setEditingGoal(null);
                setIsGoalModalOpen(true);
              }}
              onEditGoal={(g) => {
                setEditingGoal(g);
                setIsGoalModalOpen(true);
              }}
              onDeleteGoal={handleDeleteGoal}
              onContribute={handleContributeGoal}
              onAskAiPrompt={handleAskAiPrompt}
            />
          )}

          {activeTab === 'ai' && (
            <AiAdvisorTab
              overview={overview}
              currentMonth={currentMonth}
              initialPrompt={initialAiPrompt}
              onClearInitialPrompt={() => setInitialAiPrompt('')}
            />
          )}
        </main>

        {/* Global Footer */}
        <footer className="border-t border-slate-200/80 bg-white py-5 px-6 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">Personal Finance Advisor Bot</span>
              <span>•</span>
              <span>Python / Flask API Compatible • SQLite & Google Gemini 3.8 Flash</span>
            </div>
            <div className="flex items-center gap-4 text-slate-500 font-medium">
              <button
                onClick={() => handleSelectScenario('demo')}
                className="hover:text-[#1235ee] transition-colors cursor-pointer"
              >
                1-Click Demo Data
              </button>
              <span>•</span>
              <button
                onClick={() => setIsScenarioModalOpen(true)}
                className="hover:text-[#1235ee] transition-colors cursor-pointer"
              >
                Preset Archetypes
              </button>
              <span>•</span>
              <button
                onClick={() => setIsDataModalOpen(true)}
                className="hover:text-[#1235ee] transition-colors cursor-pointer"
              >
                Export Database
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTx(null);
        }}
        type={txModalType}
        categories={categories}
        initialData={editingTx}
        currencySymbol={currencySymbol}
        onSaveIncome={handleSaveIncome}
        onSaveExpense={handleSaveExpense}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => {
          setIsBudgetModalOpen(false);
          setEditingBudgetCategory(undefined);
          setEditingBudgetLimit(undefined);
        }}
        categories={categories}
        initialCategory={editingBudgetCategory}
        initialLimit={editingBudgetLimit}
        onSaveBudget={handleSaveBudget}
      />

      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setEditingGoal(null);
        }}
        initialData={editingGoal}
        onSaveGoal={handleSaveGoal}
      />

      <ScenarioModal
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
        activeScenario={scenarioKey}
        onSelectScenario={handleSelectScenario}
      />

      <DataModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        onDataRestored={() => loadAllData(currentMonth)}
      />
    </div>
  );
}
