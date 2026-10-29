import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'finance.db');
const db = new Database(dbPath);

// Enable WAL mode for high performance
db.pragma('journal_mode = WAL');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    is_default INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS income (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    notes TEXT,
    is_recurring INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT NOT NULL,
    date TEXT NOT NULL,
    payment_method TEXT DEFAULT 'Card',
    notes TEXT,
    is_recurring INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL UNIQUE,
    monthly_limit REAL NOT NULL,
    month TEXT DEFAULT 'all',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS savings_goals (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    target_amount REAL NOT NULL,
    current_amount REAL NOT NULL DEFAULT 0,
    target_date TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Ensure column exists in existing database
try {
  db.exec('ALTER TABLE expenses ADD COLUMN is_recurring INTEGER DEFAULT 0');
} catch {
  // column already exists
}

// Default categories
const defaultCategories = [
  // Expense categories
  { id: 'cat-housing', name: 'Housing & Rent', type: 'expense', icon: 'Home', color: '#6366f1' },
  { id: 'cat-groceries', name: 'Groceries & Food', type: 'expense', icon: 'Utensils', color: '#10b981' },
  { id: 'cat-transport', name: 'Transportation', type: 'expense', icon: 'Car', color: '#f59e0b' },
  { id: 'cat-utilities', name: 'Utilities & Bills', type: 'expense', icon: 'Zap', color: '#06b6d4' },
  { id: 'cat-entertainment', name: 'Entertainment & Leisure', type: 'expense', icon: 'Film', color: '#ec4899' },
  { id: 'cat-healthcare', name: 'Healthcare & Wellness', type: 'expense', icon: 'HeartPulse', color: '#ef4444' },
  { id: 'cat-shopping', name: 'Shopping & Personal', type: 'expense', icon: 'ShoppingBag', color: '#8b5cf6' },
  { id: 'cat-education', name: 'Education & Books', type: 'expense', icon: 'GraduationCap', color: '#14b8a6' },
  { id: 'cat-dining', name: 'Dining Out & Cafe', type: 'expense', icon: 'Coffee', color: '#f97316' },
  { id: 'cat-other-exp', name: 'Miscellaneous', type: 'expense', icon: 'MoreHorizontal', color: '#64748b' },

  // Income categories
  { id: 'cat-salary', name: 'Salary & Wages', type: 'income', icon: 'Briefcase', color: '#10b981' },
  { id: 'cat-freelance', name: 'Freelance & Contracting', type: 'income', icon: 'Laptop', color: '#3b82f6' },
  { id: 'cat-investments', name: 'Investments & Dividends', type: 'income', icon: 'TrendingUp', color: '#8b5cf6' },
  { id: 'cat-allowance', name: 'Allowance & Stipend', type: 'income', icon: 'Gift', color: '#f59e0b' },
  { id: 'cat-other-inc', name: 'Other Income', type: 'income', icon: 'PlusCircle', color: '#06b6d4' },
];

const insertCat = db.prepare(`
  INSERT OR IGNORE INTO categories (id, name, type, icon, color, is_default)
  VALUES (@id, @name, @type, @icon, @color, 1)
`);

db.transaction(() => {
  for (const cat of defaultCategories) {
    insertCat.run(cat);
  }
})();

// Scenario Data Definitions
export const SCENARIOS = {
  salaried: {
    name: 'Salaried Professional',
    description: 'Tech professional earning a stable monthly salary with planned rent, grocery, and dining budgets, aiming for an emergency fund and retirement.',
    income: [
      { id: 'sal-inc-1', source: 'Apex Tech Corp (Salary)', amount: 5200, category: 'Salary & Wages', date: '2026-10-01', notes: 'Monthly net salary after tax & 401k', is_recurring: 1 },
      { id: 'sal-inc-2', source: 'Index Fund Dividends', amount: 350, category: 'Investments & Dividends', date: '2026-10-15', notes: 'Quarterly dividend payout', is_recurring: 0 },
    ],
    expenses: [
      { id: 'sal-exp-1', category: 'Housing & Rent', amount: 1650, description: 'Downtown 1-Bed Apartment Rent', date: '2026-10-01', payment_method: 'Bank Transfer' },
      { id: 'sal-exp-2', category: 'Utilities & Bills', amount: 180, description: 'Electricity & High-speed Fiber', date: '2026-10-04', payment_method: 'Card' },
      { id: 'sal-exp-3', category: 'Groceries & Food', amount: 480, description: 'Trader Joe & Whole Foods Groceries', date: '2026-10-07', payment_method: 'Card' },
      { id: 'sal-exp-4', category: 'Transportation', amount: 140, description: 'Monthly Metro Pass & Fuel', date: '2026-10-08', payment_method: 'Card' },
      { id: 'sal-exp-5', category: 'Dining Out & Cafe', amount: 320, description: 'Weekend dinners & artisanal coffee', date: '2026-10-12', payment_method: 'Card' },
      { id: 'sal-exp-6', category: 'Entertainment & Leisure', amount: 95, description: 'Netflix, Spotify & Cinema ticket', date: '2026-10-14', payment_method: 'Card' },
      { id: 'sal-exp-7', category: 'Shopping & Personal', amount: 210, description: 'Fall wardrobe essentials', date: '2026-10-18', payment_method: 'Card' },
      { id: 'sal-exp-8', category: 'Healthcare & Wellness', amount: 80, description: 'Gym membership & supplements', date: '2026-10-20', payment_method: 'Card' },
    ],
    budgets: [
      { id: 'b-sal-1', category: 'Housing & Rent', monthly_limit: 1700 },
      { id: 'b-sal-2', category: 'Groceries & Food', monthly_limit: 550 },
      { id: 'b-sal-3', category: 'Dining Out & Cafe', monthly_limit: 350 },
      { id: 'b-sal-4', category: 'Transportation', monthly_limit: 200 },
      { id: 'b-sal-5', category: 'Utilities & Bills', monthly_limit: 220 },
      { id: 'b-sal-6', category: 'Entertainment & Leisure', monthly_limit: 150 },
      { id: 'b-sal-7', category: 'Shopping & Personal', monthly_limit: 250 },
    ],
    goals: [
      { id: 'g-sal-1', title: '6-Month Emergency Fund', target_amount: 15000, current_amount: 9800, target_date: '2027-04-01', category: 'Safety' },
      { id: 'g-sal-2', title: 'Japan Autumn Vacation', target_amount: 4000, current_amount: 2600, target_date: '2026-11-15', category: 'Travel' },
    ]
  },
  student: {
    name: 'College Student',
    description: 'Undergraduate student with family allowance and on-campus tutoring job, managing textbooks, shared rent, and campus dining.',
    income: [
      { id: 'stu-inc-1', source: 'Monthly Family Allowance', amount: 900, category: 'Allowance & Stipend', date: '2026-10-01', notes: 'Living stipend', is_recurring: 1 },
      { id: 'stu-inc-2', source: 'Campus Tutoring Center', amount: 450, category: 'Salary & Wages', date: '2026-10-15', notes: '15 hrs/week tutoring calculus', is_recurring: 1 },
    ],
    expenses: [
      { id: 'stu-exp-1', category: 'Housing & Rent', amount: 550, description: 'Shared 3-person campus apartment', date: '2026-10-01', payment_method: 'Bank Transfer' },
      { id: 'stu-exp-2', category: 'Groceries & Food', amount: 260, description: 'Discount groceries & pantry supplies', date: '2026-10-05', payment_method: 'Card' },
      { id: 'stu-exp-3', category: 'Education & Books', amount: 120, description: 'Algorithms textbook access code', date: '2026-10-08', payment_method: 'Card' },
      { id: 'stu-exp-4', category: 'Dining Out & Cafe', amount: 110, description: 'Campus cafe & midnight study snacks', date: '2026-10-14', payment_method: 'Cash' },
      { id: 'stu-exp-5', category: 'Transportation', amount: 45, description: 'Student transit pass reload', date: '2026-10-10', payment_method: 'Card' },
      { id: 'stu-exp-6', category: 'Entertainment & Leisure', amount: 35, description: 'Student movie tickets & campus games', date: '2026-10-22', payment_method: 'Card' },
    ],
    budgets: [
      { id: 'b-stu-1', category: 'Housing & Rent', monthly_limit: 550 },
      { id: 'b-stu-2', category: 'Groceries & Food', monthly_limit: 300 },
      { id: 'b-stu-3', category: 'Education & Books', monthly_limit: 150 },
      { id: 'b-stu-4', category: 'Dining Out & Cafe', monthly_limit: 120 },
      { id: 'b-stu-5', category: 'Transportation', monthly_limit: 60 },
    ],
    goals: [
      { id: 'g-stu-1', title: 'New Coding Laptop (M3 MacBook)', target_amount: 1400, current_amount: 850, target_date: '2027-01-10', category: 'Education' },
      { id: 'g-stu-2', title: 'Spring Break Road Trip', target_amount: 500, current_amount: 180, target_date: '2027-03-20', category: 'Travel' },
    ]
  },
  freelancer: {
    name: 'Freelancer / Consultant',
    description: 'Independent designer & developer with fluctuating client invoices, managing software tool subscriptions, quarterly tax reserves, and irregular cash flow.',
    income: [
      { id: 'fre-inc-1', source: 'FinTech App Redesign (Client A)', amount: 3200, category: 'Freelance & Contracting', date: '2026-10-03', notes: 'Milestone 2 payment', is_recurring: 0 },
      { id: 'fre-inc-2', source: 'Monthly Retainer (Brand Studio)', amount: 1600, category: 'Freelance & Contracting', date: '2026-10-10', notes: 'Ongoing UI maintenance contract', is_recurring: 1 },
      { id: 'fre-inc-3', source: 'UI Kit Digital Sales (Gumroad)', amount: 380, category: 'Other Income', date: '2026-10-20', notes: 'Passive digital product sales', is_recurring: 0 },
    ],
    expenses: [
      { id: 'fre-exp-1', category: 'Housing & Rent', amount: 1400, description: 'Home Office & Studio Apartment', date: '2026-10-01', payment_method: 'Bank Transfer' },
      { id: 'fre-exp-2', category: 'Utilities & Bills', amount: 240, description: 'Gigabit Internet, electricity & cloud phone', date: '2026-10-05', payment_method: 'Card' },
      { id: 'fre-exp-3', category: 'Shopping & Personal', amount: 260, description: 'Figma, Adobe CC, GitHub & Notion subscriptions', date: '2026-10-06', payment_method: 'Card' },
      { id: 'fre-exp-4', category: 'Groceries & Food', amount: 420, description: 'Weekly meal preps & groceries', date: '2026-10-11', payment_method: 'Card' },
      { id: 'fre-exp-5', category: 'Dining Out & Cafe', amount: 210, description: 'Client coffee meetings & coworking lunches', date: '2026-10-16', payment_method: 'Card' },
      { id: 'fre-exp-6', category: 'Transportation', amount: 90, description: 'Rideshare to client workshops', date: '2026-10-19', payment_method: 'Card' },
      { id: 'fre-exp-7', category: 'Healthcare & Wellness', amount: 310, description: 'Self-employed health insurance plan', date: '2026-10-15', payment_method: 'Card' },
    ],
    budgets: [
      { id: 'b-fre-1', category: 'Housing & Rent', monthly_limit: 1450 },
      { id: 'b-fre-2', category: 'Shopping & Personal', monthly_limit: 300 },
      { id: 'b-fre-3', category: 'Groceries & Food', monthly_limit: 450 },
      { id: 'b-fre-4', category: 'Dining Out & Cafe', monthly_limit: 250 },
      { id: 'b-fre-5', category: 'Utilities & Bills', monthly_limit: 260 },
      { id: 'b-fre-6', category: 'Healthcare & Wellness', monthly_limit: 350 },
    ],
    goals: [
      { id: 'g-fre-1', title: 'Quarterly Tax Buffer (IRS)', target_amount: 4500, current_amount: 3200, target_date: '2026-12-15', category: 'Tax' },
      { id: 'g-fre-2', title: 'Slow Season Cushion (3 Months)', target_amount: 10000, current_amount: 6400, target_date: '2027-02-01', category: 'Safety' },
    ]
  },
  household: {
    name: 'Household Family',
    description: 'Family managing dual incomes, mortgage, utility bills, weekly family groceries, healthcare, and children schooling expenses.',
    income: [
      { id: 'hou-inc-1', source: 'Primary Salary (Engineering)', amount: 4800, category: 'Salary & Wages', date: '2026-10-01', notes: 'Direct deposit', is_recurring: 1 },
      { id: 'hou-inc-2', source: 'Secondary Salary (Healthcare)', amount: 3400, category: 'Salary & Wages', date: '2026-10-05', notes: 'Direct deposit', is_recurring: 1 },
    ],
    expenses: [
      { id: 'hou-exp-1', category: 'Housing & Rent', amount: 2450, description: 'Family Home Mortgage & HOA', date: '2026-10-01', payment_method: 'Bank Transfer' },
      { id: 'hou-exp-2', category: 'Groceries & Food', amount: 890, description: 'Costco bulk supplies & weekly organic groceries', date: '2026-10-06', payment_method: 'Card' },
      { id: 'hou-exp-3', category: 'Utilities & Bills', amount: 340, description: 'Water, gas, electricity, trash & internet', date: '2026-10-08', payment_method: 'Bank Transfer' },
      { id: 'hou-exp-4', category: 'Education & Books', amount: 480, description: 'After-school STEM club & music lessons', date: '2026-10-12', payment_method: 'Card' },
      { id: 'hou-exp-5', category: 'Transportation', amount: 360, description: 'Minivan gas, toll passes & routine maintenance', date: '2026-10-14', payment_method: 'Card' },
      { id: 'hou-exp-6', category: 'Healthcare & Wellness', amount: 240, description: 'Family dental checkup copay & prescriptions', date: '2026-10-18', payment_method: 'Card' },
      { id: 'hou-exp-7', category: 'Entertainment & Leisure', amount: 160, description: 'Family zoo weekend passes & streaming bundles', date: '2026-10-21', payment_method: 'Card' },
    ],
    budgets: [
      { id: 'b-hou-1', category: 'Housing & Rent', monthly_limit: 2500 },
      { id: 'b-hou-2', category: 'Groceries & Food', monthly_limit: 950 },
      { id: 'b-hou-3', category: 'Utilities & Bills', monthly_limit: 380 },
      { id: 'b-hou-4', category: 'Education & Books', monthly_limit: 500 },
      { id: 'b-hou-5', category: 'Transportation', monthly_limit: 400 },
      { id: 'b-hou-6', category: 'Healthcare & Wellness', monthly_limit: 300 },
      { id: 'b-hou-7', category: 'Entertainment & Leisure', monthly_limit: 200 },
    ],
    goals: [
      { id: 'g-hou-1', title: 'College 529 Fund Contribution', target_amount: 12000, current_amount: 8400, target_date: '2027-08-01', category: 'Education' },
      { id: 'g-hou-2', title: 'Home Solar Panel Installation', target_amount: 8000, current_amount: 3500, target_date: '2027-05-01', category: 'Home' },
    ]
  },
  demo: {
    name: 'Demo Flow (Allowance & Essentials)',
    description: '1-Click Demo dataset: ₹25,000 monthly allowance, Food (₹4,500), Transport (₹1,800), and Education (₹2,500) from demo_data.txt.',
    income: [
      { id: 'demo-inc-1', source: 'Monthly allowance', amount: 25000, category: 'Allowance & Stipend', date: new Date().toISOString().slice(0, 10), notes: 'Monthly allowance from parents / stipend', is_recurring: 1 },
    ],
    expenses: [
      { id: 'demo-exp-1', category: 'Groceries & Food', amount: 4500, description: 'Food & Meals', date: new Date().toISOString().slice(0, 10), payment_method: 'Card', is_recurring: 0 },
      { id: 'demo-exp-2', category: 'Transportation', amount: 1800, description: 'Transport & Commute', date: new Date().toISOString().slice(0, 10), payment_method: 'Card', is_recurring: 0 },
      { id: 'demo-exp-3', category: 'Education & Books', amount: 2500, description: 'Education & Learning', date: new Date().toISOString().slice(0, 10), payment_method: 'Card', is_recurring: 0 },
    ],
    budgets: [
      { id: 'b-demo-1', category: 'Groceries & Food', monthly_limit: 6000 },
      { id: 'b-demo-2', category: 'Transportation', monthly_limit: 2500 },
      { id: 'b-demo-3', category: 'Education & Books', monthly_limit: 4000 },
    ],
    goals: [
      { id: 'g-demo-1', title: 'Emergency Cushion Fund', target_amount: 50000, current_amount: 16200, target_date: '2027-06-30', category: 'Safety' },
    ]
  }
};

export function loadScenario(scenarioKey: 'salaried' | 'student' | 'freelancer' | 'household' | 'demo' | 'empty') {
  db.transaction(() => {
    db.prepare('DELETE FROM income').run();
    db.prepare('DELETE FROM expenses').run();
    db.prepare('DELETE FROM budgets').run();
    db.prepare('DELETE FROM savings_goals').run();

    if (scenarioKey === 'empty') return;

    const s = SCENARIOS[scenarioKey as keyof typeof SCENARIOS];
    if (!s) return;

    const insInc = db.prepare(`
      INSERT INTO income (id, source, amount, category, date, notes, is_recurring)
      VALUES (@id, @source, @amount, @category, @date, @notes, @is_recurring)
    `);
    for (const inc of s.income) {
      insInc.run(inc);
    }

    const insExp = db.prepare(`
      INSERT INTO expenses (id, category, amount, description, date, payment_method, notes, is_recurring)
      VALUES (@id, @category, @amount, @description, @date, @payment_method, @notes, @is_recurring)
    `);
    for (const exp of s.expenses) {
      insExp.run({ ...exp, notes: '', is_recurring: (exp as any).is_recurring ? 1 : 0 });
    }

    const insBgt = db.prepare(`
      INSERT INTO budgets (id, category, monthly_limit, month)
      VALUES (@id, @category, @monthly_limit, 'all')
    `);
    for (const bgt of s.budgets) {
      insBgt.run(bgt);
    }

    const insGoal = db.prepare(`
      INSERT INTO savings_goals (id, title, target_amount, current_amount, target_date, category, notes)
      VALUES (@id, @title, @target_amount, @current_amount, @target_date, @category, @notes)
    `);
    for (const g of s.goals) {
      insGoal.run({ ...g, notes: '' });
    }
  })();
}

// Check if database has any records, if empty initialize with salaried scenario
const rowCount = db.prepare('SELECT COUNT(*) as count FROM expenses').get() as { count: number };
if (rowCount.count === 0) {
  loadScenario('salaried');
}

export { db };
