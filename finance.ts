export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  is_default: number;
}

export interface Income {
  id: string;
  source: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  is_recurring: number;
  created_at?: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  payment_method: string;
  notes?: string;
  is_recurring?: number;
  created_at?: string;
}

export interface Budget {
  id: string;
  category: string;
  monthly_limit: number;
  month?: string;
  created_at?: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  category?: string;
  notes?: string;
  created_at?: string;
}

export interface CategoryBreakdown {
  category: string;
  spent: number;
  limit: number;
  percentage: number;
  status: 'ok' | 'warning' | 'exceeded';
  remaining: number;
}

export interface FinancialAlert {
  type: 'danger' | 'warning' | 'info' | 'success';
  message: string;
  category?: string;
}

export interface FinanceOverview {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  totalBudgetLimit: number;
  budgetUtilization: number;
  categoryBreakdown: CategoryBreakdown[];
  alerts: FinancialAlert[];
  transactionCount: number;
  goalsCount: number;
  recurringIncome?: number;
  recurringExpenses?: number;
}

export interface AuditResult {
  healthScore: number;
  scoreGrade: string;
  summary: string;
  keyStrengths: string[];
  criticalRisks: string[];
  categoryInsights: {
    category: string;
    status: string;
    insight: string;
  }[];
  actionableTips: {
    title: string;
    description: string;
    estimatedMonthlySavings: number;
  }[];
  recommended503020Split: {
    needsPercentage: number;
    wantsPercentage: number;
    savingsPercentage: number;
    note: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: string;
}

export type ScenarioKey = 'salaried' | 'student' | 'freelancer' | 'household' | 'demo' | 'empty';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

export interface SummaryData {
  income: number;
  expense: number;
  balance: number;
  categories: Record<string, number>;
  top_category: string;
  recurring_income: number;
  recurring_expense: number;
  savings_rate: number;
}

export interface AdviceData {
  title: string;
  text: string;
  tip?: string;
}

export interface UnifiedTransaction {
  id: string;
  kind: 'income' | 'expense';
  category: string;
  amount: number;
  note: string;
  created_at: string;
  date: string;
  is_recurring: number;
}

