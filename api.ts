import {
  FinanceOverview,
  Income,
  Expense,
  Budget,
  SavingsGoal,
  Category,
  AuditResult,
  ScenarioKey,
  SummaryData,
  AdviceData,
  UnifiedTransaction,
} from '../types/finance';

export const api = {
  // Health check
  async getHealth(): Promise<{ status: string }> {
    const res = await fetch('/health');
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  // Summary (matching Python Flask app)
  async getSummary(month?: string): Promise<SummaryData> {
    const query = month ? `?month=${month}` : '';
    const res = await fetch(`/api/summary${query}`);
    if (!res.ok) throw new Error('Failed to fetch summary');
    return res.json();
  },

  // Advisor advice (matching Python Flask app)
  async getAdvice(month?: string): Promise<AdviceData> {
    const query = month ? `?month=${month}` : '';
    const res = await fetch(`/api/advice${query}`);
    if (!res.ok) throw new Error('Failed to fetch advice');
    return res.json();
  },

  // Unified transactions (matching Python Flask app)
  async getTransactions(month?: string): Promise<UnifiedTransaction[]> {
    const query = month ? `?month=${month}` : '';
    const res = await fetch(`/api/transactions${query}`);
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return res.json();
  },

  async createUnifiedTransaction(data: {
    kind: 'income' | 'expense';
    category: string;
    amount: number;
    note?: string;
    date?: string;
    is_recurring?: boolean;
  }): Promise<{ ok: boolean; transaction: any }> {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save transaction');
    }
    return res.json();
  },

  // 1-Click Demo Flow Loader
  async loadDemoFlow(): Promise<{ success: boolean; scenario: string; overview: FinanceOverview }> {
    const res = await fetch('/api/demo/load', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to load demo flow');
    return res.json();
  },

  // Overview
  async getOverview(month?: string): Promise<FinanceOverview> {
    const query = month ? `?month=${month}` : '';
    const res = await fetch(`/api/finance/overview${query}`);
    if (!res.ok) throw new Error('Failed to fetch finance overview');
    return res.json();
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const res = await fetch('/api/categories');
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  // Income
  async getIncome(month?: string): Promise<Income[]> {
    const query = month ? `?month=${month}` : '';
    const res = await fetch(`/api/income${query}`);
    if (!res.ok) throw new Error('Failed to fetch income');
    return res.json();
  },

  async createIncome(data: Partial<Income>): Promise<Income> {
    const res = await fetch('/api/income', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create income');
    }
    return res.json();
  },

  async updateIncome(id: string, data: Partial<Income>): Promise<Income> {
    const res = await fetch(`/api/income/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update income');
    return res.json();
  },

  async deleteIncome(id: string): Promise<void> {
    const res = await fetch(`/api/income/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete income');
  },

  // Expenses
  async getExpenses(month?: string, category?: string): Promise<Expense[]> {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (category) params.append('category', category);
    const res = await fetch(`/api/expenses?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch expenses');
    return res.json();
  },

  async createExpense(data: Partial<Expense>): Promise<Expense> {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create expense');
    }
    return res.json();
  },

  async updateExpense(id: string, data: Partial<Expense>): Promise<Expense> {
    const res = await fetch(`/api/expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update expense');
    return res.json();
  },

  async deleteExpense(id: string): Promise<void> {
    const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete expense');
  },

  // Budgets
  async getBudgets(): Promise<Budget[]> {
    const res = await fetch('/api/budgets');
    if (!res.ok) throw new Error('Failed to fetch budgets');
    return res.json();
  },

  async setBudget(category: string, monthly_limit: number): Promise<Budget> {
    const res = await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, monthly_limit }),
    });
    if (!res.ok) throw new Error('Failed to save budget');
    return res.json();
  },

  async deleteBudget(id: string): Promise<void> {
    const res = await fetch(`/api/budgets/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete budget');
  },

  // Goals
  async getGoals(): Promise<SavingsGoal[]> {
    const res = await fetch('/api/goals');
    if (!res.ok) throw new Error('Failed to fetch goals');
    return res.json();
  },

  async createGoal(data: Partial<SavingsGoal>): Promise<SavingsGoal> {
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create goal');
    return res.json();
  },

  async updateGoal(id: string, data: Partial<SavingsGoal>): Promise<SavingsGoal> {
    const res = await fetch(`/api/goals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update goal');
    return res.json();
  },

  async contributeToGoal(id: string, amount: number): Promise<SavingsGoal> {
    const res = await fetch(`/api/goals/${id}/contribute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    if (!res.ok) throw new Error('Failed to contribute to goal');
    return res.json();
  },

  async deleteGoal(id: string): Promise<void> {
    const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete goal');
  },

  // Scenario
  async loadScenario(scenario: ScenarioKey) {
    const res = await fetch('/api/scenarios/load', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario }),
    });
    if (!res.ok) throw new Error('Failed to load scenario');
    return res.json();
  },

  // AI Chat
  async sendChatMessage(message: string, history: any[], month?: string, modelChoice?: string): Promise<{ reply: string; model: string }> {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, month, modelChoice }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to communicate with AI Advisor');
    }
    return res.json();
  },

  // AI Audit
  async runAudit(month?: string): Promise<AuditResult> {
    const res = await fetch('/api/ai/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to complete financial health audit');
    }
    return res.json();
  },

  // Export / Import
  async exportData(): Promise<any> {
    const res = await fetch('/api/export');
    if (!res.ok) throw new Error('Failed to export data');
    return res.json();
  },

  async importData(data: any): Promise<any> {
    const res = await fetch('/api/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to import data');
    return res.json();
  },
};
