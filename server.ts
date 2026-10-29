import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { db, loadScenario, SCENARIOS } from './src/server/db.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper: Calculate Overview for a specific month (YYYY-MM or current)
function calculateOverview(selectedMonth?: string) {
  const currentMonth = selectedMonth || new Date().toISOString().slice(0, 7);

  // Income for month
  const incomeList = db.prepare(`
    SELECT * FROM income
    WHERE strftime('%Y-%m', date) = ?
    ORDER BY date DESC
  `).all(currentMonth) as any[];

  // Expenses for month
  const expenseList = db.prepare(`
    SELECT * FROM expenses
    WHERE strftime('%Y-%m', date) = ?
    ORDER BY date DESC
  `).all(currentMonth) as any[];

  // Budgets
  const budgetList = db.prepare('SELECT * FROM budgets').all() as any[];

  // Savings Goals
  const goalsList = db.prepare('SELECT * FROM savings_goals').all() as any[];

  const totalIncome = incomeList.reduce((acc, cur) => acc + (cur.amount || 0), 0);
  const totalExpenses = expenseList.reduce((acc, cur) => acc + (cur.amount || 0), 0);
  const recurringIncome = incomeList.filter((i) => i.is_recurring).reduce((acc, cur) => acc + (cur.amount || 0), 0);
  const recurringExpenses = expenseList.filter((e) => e.is_recurring).reduce((acc, cur) => acc + (cur.amount || 0), 0);
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // Category breakdown
  const categoryMap: { [cat: string]: number } = {};
  for (const exp of expenseList) {
    categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount;
  }

  const categoryBreakdown = Object.keys(categoryMap).map((cat) => {
    const spent = categoryMap[cat];
    const budgetObj = budgetList.find((b) => b.category.toLowerCase() === cat.toLowerCase());
    const limit = budgetObj ? budgetObj.monthly_limit : 0;
    const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
    let status: 'ok' | 'warning' | 'exceeded' = 'ok';
    if (limit > 0) {
      if (percentage >= 100) status = 'exceeded';
      else if (percentage >= 80) status = 'warning';
    }
    return {
      category: cat,
      spent,
      limit,
      percentage,
      status,
      remaining: limit > 0 ? limit - spent : 0,
    };
  });

  // Sort by spent descending
  categoryBreakdown.sort((a, b) => b.spent - a.spent);

  // Check overall budget limit
  const totalBudgetLimit = budgetList.reduce((acc, b) => acc + b.monthly_limit, 0);
  const budgetUtilization = totalBudgetLimit > 0 ? Math.round((totalExpenses / totalBudgetLimit) * 100) : 0;

  // Alerts
  const alerts: { type: 'danger' | 'warning' | 'info' | 'success'; message: string; category?: string }[] = [];
  categoryBreakdown.forEach((cb) => {
    if (cb.status === 'exceeded') {
      alerts.push({
        type: 'danger',
        message: `Exceeded budget in "${cb.category}" by $${Math.abs(cb.remaining).toFixed(2)} (${cb.percentage}% used)`,
        category: cb.category,
      });
    } else if (cb.status === 'warning') {
      alerts.push({
        type: 'warning',
        message: `Approaching limit in "${cb.category}" (${cb.percentage}% used, $${cb.remaining.toFixed(2)} left)`,
        category: cb.category,
      });
    }
  });

  if (savingsRate < 10 && totalIncome > 0) {
    alerts.push({
      type: 'info',
      message: `Your savings rate is ${savingsRate}%. Financial advisors recommend saving at least 20% of net income.`,
    });
  } else if (savingsRate >= 20) {
    alerts.push({
      type: 'success',
      message: `Great job! Your savings rate is ${savingsRate}%, which meets recommended wealth-building benchmarks.`,
    });
  }

  return {
    month: currentMonth,
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate,
    totalBudgetLimit,
    budgetUtilization,
    categoryBreakdown,
    alerts,
    transactionCount: incomeList.length + expenseList.length,
    goalsCount: goalsList.length,
    recurringIncome,
    recurringExpenses,
  };
}

// ---------------- REST API ROUTES ----------------

// Health check (matching Python Flask app)
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'Personal Finance Advisor Bot is running' });
});

// Summary endpoint (matching Python Flask app)
app.get('/api/summary', (req: Request, res: Response) => {
  try {
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
    const incRows = db.prepare("SELECT * FROM income WHERE strftime('%Y-%m', date) = ?").all(month) as any[];
    const expRows = db.prepare("SELECT * FROM expenses WHERE strftime('%Y-%m', date) = ?").all(month) as any[];

    const income = incRows.reduce((acc, cur) => acc + (cur.amount || 0), 0);
    const expense = expRows.reduce((acc, cur) => acc + (cur.amount || 0), 0);
    const balance = income - expense;

    const byCat: Record<string, number> = {};
    for (const exp of expRows) {
      byCat[exp.category] = (byCat[exp.category] || 0) + exp.amount;
    }
    const top = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

    const recurring_income = incRows.filter((i) => i.is_recurring).reduce((acc, cur) => acc + (cur.amount || 0), 0);
    const recurring_expense = expRows.filter((e) => e.is_recurring).reduce((acc, cur) => acc + (cur.amount || 0), 0);
    const savings_rate = income > 0 ? Math.round((balance / income) * 100) : 0;

    res.json({
      income,
      expense,
      balance,
      categories: Object.fromEntries(top),
      top_category: top.length > 0 ? top[0][0] : '—',
      recurring_income,
      recurring_expense,
      savings_rate,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Advisor insight endpoint (matching Python Flask app + intelligent logic)
app.get('/api/advice', (req: Request, res: Response) => {
  try {
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
    const incRows = db.prepare("SELECT * FROM income WHERE strftime('%Y-%m', date) = ?").all(month) as any[];
    const expRows = db.prepare("SELECT * FROM expenses WHERE strftime('%Y-%m', date) = ?").all(month) as any[];

    const income = incRows.reduce((acc, cur) => acc + (cur.amount || 0), 0);
    const expense = expRows.reduce((acc, cur) => acc + (cur.amount || 0), 0);

    const byCat: Record<string, number> = {};
    for (const exp of expRows) {
      byCat[exp.category] = (byCat[exp.category] || 0) + exp.amount;
    }
    const top = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    const topCatName = top.length > 0 ? top[0][0] : '';
    const topCatSpent = top.length > 0 ? top[0][1] : 0;

    if (income === 0) {
      return res.json({
        title: 'Start with your income',
        text: 'Add your monthly income and a few expenses. The advisor will then generate a personalized budget suggestion.',
        tip: 'Try recording your salary or allowance first to establish a spending baseline.',
      });
    }

    const ratio = expense / income;
    let title = 'AI-style financial insight';
    let text = '';
    let tip = '';

    if (ratio > 0.8) {
      text = 'Your expenses are above 80% of income. Try reducing discretionary spending and aim to keep an emergency-saving amount aside.';
      tip = topCatName ? `Highest spending detected in "${topCatName}" ($${topCatSpent.toLocaleString()}). Look for quick substitution opportunities.` : 'Prioritize essentials and defer luxury purchases.';
    } else if (ratio > 0.6) {
      text = 'Your spending is moderate. Review your highest category and consider moving 10–20% of income toward savings.';
      tip = topCatName ? `Trimming 10% from "${topCatName}" will unlock extra capital for your savings goals.` : 'Maintain regular tracking each week.';
    } else {
      text = 'Great control so far. Keep essential spending stable and consider building an emergency fund with part of your remaining balance.';
      tip = 'You have healthy cash flow! Allocate surplus toward high-yield savings or investment goals.';
    }

    res.json({ title, text, tip });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Unified transactions endpoint (matching Python Flask app)
app.get('/api/transactions', (req: Request, res: Response) => {
  try {
    const month = req.query.month as string;
    let incSql = 'SELECT id, source AS note, amount, category, date, notes, is_recurring, created_at, "income" AS kind FROM income';
    let expSql = 'SELECT id, description AS note, amount, category, date, notes, is_recurring, created_at, "expense" AS kind FROM expenses';
    const params: any[] = [];
    if (month) {
      incSql += " WHERE strftime('%Y-%m', date) = ?";
      expSql += " WHERE strftime('%Y-%m', date) = ?";
      params.push(month);
    }
    const incRows = db.prepare(incSql).all(...params) as any[];
    const expRows = db.prepare(expSql).all(...params) as any[];
    const all = [...incRows, ...expRows].sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.created_at || '').localeCompare(a.created_at || ''));
    res.json(all);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/transactions', (req: Request, res: Response) => {
  try {
    const { kind, category, amount, note, date, is_recurring } = req.body;
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount || '0');
    if (isNaN(numAmount) || numAmount <= 0 || !category || !['income', 'expense'].includes(kind)) {
      return res.status(400).json({ error: 'Please enter valid transaction details (kind, category, positive amount).' });
    }
    const txDate = date || new Date().toISOString().slice(0, 10);
    const txNote = note || '';
    const recurringVal = is_recurring ? 1 : 0;

    if (kind === 'income') {
      const id = 'inc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      db.prepare(`
        INSERT INTO income (id, source, amount, category, date, notes, is_recurring)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, txNote || category, numAmount, category, txDate, txNote, recurringVal);
      const row = db.prepare('SELECT * FROM income WHERE id = ?').get(id);
      return res.status(201).json({ ok: true, transaction: row });
    } else {
      const id = 'exp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      db.prepare(`
        INSERT INTO expenses (id, category, amount, description, date, payment_method, notes, is_recurring)
        VALUES (?, ?, ?, ?, ?, 'Card', ?, ?)
      `).run(id, category, numAmount, txNote || category, txDate, txNote, recurringVal);
      const row = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
      return res.status(201).json({ ok: true, transaction: row });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 1. Overview
app.get('/api/finance/overview', (req: Request, res: Response) => {
  try {
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
    const data = calculateOverview(month);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Categories
app.get('/api/categories', (_req: Request, res: Response) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY type ASC, name ASC').all();
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Income CRUD
app.get('/api/income', (req: Request, res: Response) => {
  try {
    const month = req.query.month as string;
    let query = 'SELECT * FROM income';
    const params: any[] = [];
    if (month) {
      query += " WHERE strftime('%Y-%m', date) = ?";
      params.push(month);
    }
    query += ' ORDER BY date DESC, created_at DESC';
    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/income', (req: Request, res: Response) => {
  try {
    const { source, amount, category, date, notes, is_recurring } = req.body;
    if (!source || typeof amount !== 'number' || amount <= 0 || !date || !category) {
      return res.status(400).json({ error: 'Valid source, positive amount, category, and date are required.' });
    }
    const id = 'inc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const stmt = db.prepare(`
      INSERT INTO income (id, source, amount, category, date, notes, is_recurring)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, source, amount, category, date, notes || '', is_recurring ? 1 : 0);
    const record = db.prepare('SELECT * FROM income WHERE id = ?').get(id);
    res.status(201).json(record);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/income/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { source, amount, category, date, notes, is_recurring } = req.body;
    const stmt = db.prepare(`
      UPDATE income
      SET source = ?, amount = ?, category = ?, date = ?, notes = ?, is_recurring = ?
      WHERE id = ?
    `);
    const result = stmt.run(source, amount, category, date, notes || '', is_recurring ? 1 : 0, id);
    if (result.changes === 0) return res.status(404).json({ error: 'Record not found' });
    const record = db.prepare('SELECT * FROM income WHERE id = ?').get(id);
    res.json(record);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/income/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM income WHERE id = ?').run(id);
    res.json({ success: true, id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Expenses CRUD
app.get('/api/expenses', (req: Request, res: Response) => {
  try {
    const month = req.query.month as string;
    const category = req.query.category as string;
    let query = 'SELECT * FROM expenses WHERE 1=1';
    const params: any[] = [];
    if (month) {
      query += " AND strftime('%Y-%m', date) = ?";
      params.push(month);
    }
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    query += ' ORDER BY date DESC, created_at DESC';
    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/expenses', (req: Request, res: Response) => {
  try {
    const { category, amount, description, date, payment_method, notes, is_recurring } = req.body;
    if (!description || typeof amount !== 'number' || amount <= 0 || !date || !category) {
      return res.status(400).json({ error: 'Valid description, positive amount, category, and date are required.' });
    }
    const id = 'exp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const stmt = db.prepare(`
      INSERT INTO expenses (id, category, amount, description, date, payment_method, notes, is_recurring)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, category, amount, description, date, payment_method || 'Card', notes || '', is_recurring ? 1 : 0);
    const record = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
    res.status(201).json(record);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/expenses/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { category, amount, description, date, payment_method, notes, is_recurring } = req.body;
    const stmt = db.prepare(`
      UPDATE expenses
      SET category = ?, amount = ?, description = ?, date = ?, payment_method = ?, notes = ?, is_recurring = ?
      WHERE id = ?
    `);
    const result = stmt.run(category, amount, description, date, payment_method || 'Card', notes || '', is_recurring ? 1 : 0, id);
    if (result.changes === 0) return res.status(404).json({ error: 'Record not found' });
    const record = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
    res.json(record);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/expenses/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
    res.json({ success: true, id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Budgets CRUD
app.get('/api/budgets', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare('SELECT * FROM budgets ORDER BY monthly_limit DESC').all();
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/budgets', (req: Request, res: Response) => {
  try {
    const { category, monthly_limit } = req.body;
    if (!category || typeof monthly_limit !== 'number' || monthly_limit <= 0) {
      return res.status(400).json({ error: 'Valid category and positive monthly limit are required.' });
    }
    const id = 'bgt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const stmt = db.prepare(`
      INSERT INTO budgets (id, category, monthly_limit, month)
      VALUES (?, ?, ?, 'all')
      ON CONFLICT(category) DO UPDATE SET monthly_limit = excluded.monthly_limit
    `);
    stmt.run(id, category, monthly_limit);
    const record = db.prepare('SELECT * FROM budgets WHERE category = ?').get(category);
    res.json(record);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/budgets/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM budgets WHERE id = ?').run(id);
    res.json({ success: true, id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Savings Goals CRUD
app.get('/api/goals', (_req: Request, res: Response) => {
  try {
    const rows = db.prepare('SELECT * FROM savings_goals ORDER BY target_date ASC').all();
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/goals', (req: Request, res: Response) => {
  try {
    const { title, target_amount, current_amount, target_date, category, notes } = req.body;
    if (!title || typeof target_amount !== 'number' || target_amount <= 0 || !target_date) {
      return res.status(400).json({ error: 'Title, positive target amount, and target date are required.' });
    }
    const id = 'goal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const stmt = db.prepare(`
      INSERT INTO savings_goals (id, title, target_amount, current_amount, target_date, category, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, title, target_amount, current_amount || 0, target_date, category || 'General', notes || '');
    const record = db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(id);
    res.status(201).json(record);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/goals/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, target_amount, current_amount, target_date, category, notes } = req.body;
    const stmt = db.prepare(`
      UPDATE savings_goals
      SET title = ?, target_amount = ?, current_amount = ?, target_date = ?, category = ?, notes = ?
      WHERE id = ?
    `);
    const result = stmt.run(title, target_amount, current_amount, target_date, category || 'General', notes || '', id);
    if (result.changes === 0) return res.status(404).json({ error: 'Goal not found' });
    const record = db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(id);
    res.json(record);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/goals/:id/contribute', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'A positive contribution amount is required.' });
    }
    const stmt = db.prepare(`
      UPDATE savings_goals
      SET current_amount = current_amount + ?
      WHERE id = ?
    `);
    const result = stmt.run(amount, id);
    if (result.changes === 0) return res.status(404).json({ error: 'Goal not found' });
    const record = db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(id);
    res.json(record);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/goals/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM savings_goals WHERE id = ?').run(id);
    res.json({ success: true, id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Scenarios & Profiles
app.post('/api/scenarios/load', (req: Request, res: Response) => {
  try {
    const { scenario } = req.body;
    if (!['salaried', 'student', 'freelancer', 'household', 'demo', 'empty'].includes(scenario)) {
      return res.status(400).json({ error: 'Invalid scenario type.' });
    }
    loadScenario(scenario as any);
    const overview = calculateOverview();
    res.json({ success: true, scenario, overview });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Dedicated 1-Click Demo Flow loader (matching demo_data.txt)
app.post('/api/demo/load', (_req: Request, res: Response) => {
  try {
    loadScenario('demo');
    const overview = calculateOverview();
    res.json({
      success: true,
      scenario: 'demo',
      overview,
      message: 'Demo flow loaded: Income ₹25,000 + Food ₹4,500 + Transport ₹1,800 + Education ₹2,500',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/scenarios/list', (_req: Request, res: Response) => {
  res.json(
    Object.entries(SCENARIOS).map(([key, value]) => ({
      key,
      name: value.name,
      description: value.description,
    }))
  );
});

// 8. Data Export & Import
app.get('/api/export', (_req: Request, res: Response) => {
  try {
    const income = db.prepare('SELECT * FROM income').all();
    const expenses = db.prepare('SELECT * FROM expenses').all();
    const budgets = db.prepare('SELECT * FROM budgets').all();
    const goals = db.prepare('SELECT * FROM savings_goals').all();
    const categories = db.prepare('SELECT * FROM categories').all();

    res.json({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      income,
      expenses,
      budgets,
      goals,
      categories,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/import', (req: Request, res: Response) => {
  try {
    const { income, expenses, budgets, goals } = req.body;
    if (!Array.isArray(income) || !Array.isArray(expenses)) {
      return res.status(400).json({ error: 'Invalid import payload structure.' });
    }

    db.transaction(() => {
      db.prepare('DELETE FROM income').run();
      db.prepare('DELETE FROM expenses').run();
      db.prepare('DELETE FROM budgets').run();
      db.prepare('DELETE FROM savings_goals').run();

      const insInc = db.prepare('INSERT INTO income (id, source, amount, category, date, notes, is_recurring) VALUES (?, ?, ?, ?, ?, ?, ?)');
      for (const i of income) {
        insInc.run(i.id || 'inc_' + Math.random(), i.source, i.amount, i.category, i.date, i.notes || '', i.is_recurring ? 1 : 0);
      }

      const insExp = db.prepare('INSERT INTO expenses (id, category, amount, description, date, payment_method, notes) VALUES (?, ?, ?, ?, ?, ?, ?)');
      for (const e of expenses) {
        insExp.run(e.id || 'exp_' + Math.random(), e.category, e.amount, e.description, e.date, e.payment_method || 'Card', e.notes || '');
      }

      if (Array.isArray(budgets)) {
        const insBgt = db.prepare('INSERT INTO budgets (id, category, monthly_limit, month) VALUES (?, ?, ?, ?)');
        for (const b of budgets) {
          insBgt.run(b.id || 'bgt_' + Math.random(), b.category, b.monthly_limit, b.month || 'all');
        }
      }

      if (Array.isArray(goals)) {
        const insGoal = db.prepare('INSERT INTO savings_goals (id, title, target_amount, current_amount, target_date, category, notes) VALUES (?, ?, ?, ?, ?, ?, ?)');
        for (const g of goals) {
          insGoal.run(g.id || 'goal_' + Math.random(), g.title, g.target_amount, g.current_amount || 0, g.target_date, g.category || 'General', g.notes || '');
        }
      }
    })();

    res.json({ success: true, overview: calculateOverview() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------- GEMINI AI ROUTES ----------------

// Helper: Build live financial context string for grounding Gemini
function buildFinancialContext(month?: string) {
  const currentMonth = month || new Date().toISOString().slice(0, 7);
  const overview = calculateOverview(currentMonth);

  const recentExpenses = db.prepare(`
    SELECT category, amount, description, date, payment_method
    FROM expenses
    WHERE strftime('%Y-%m', date) = ?
    ORDER BY date DESC LIMIT 15
  `).all(currentMonth) as any[];

  const incomeItems = db.prepare(`
    SELECT source, amount, category, date
    FROM income
    WHERE strftime('%Y-%m', date) = ?
    ORDER BY date DESC
  `).all(currentMonth) as any[];

  const goals = db.prepare('SELECT title, target_amount, current_amount, target_date, category FROM savings_goals').all() as any[];

  return `
[LIVE USER FINANCIAL DATA FOR MONTH: ${currentMonth}]
- Total Monthly Income: $${overview.totalIncome.toFixed(2)}
- Total Monthly Expenses: $${overview.totalExpenses.toFixed(2)}
- Net Monthly Savings: $${overview.netSavings.toFixed(2)}
- Savings Rate: ${overview.savingsRate}%
- Total Budget Limit: $${overview.totalBudgetLimit.toFixed(2)}
- Budget Utilization: ${overview.budgetUtilization}%

Category Spend & Limits:
${overview.categoryBreakdown.map(c => `  * ${c.category}: Spent $${c.spent.toFixed(2)} / Budget $${c.limit.toFixed(2)} (${c.percentage}%, status: ${c.status.toUpperCase()}, remaining: $${c.remaining.toFixed(2)})`).join('\n')}

Active Savings Goals:
${goals.length > 0 ? goals.map(g => `  * ${g.title}: $${g.current_amount} / $${g.target_amount} (Target: ${g.target_date})`).join('\n') : '  * No active goals'}

Recent Recorded Expenses:
${recentExpenses.slice(0, 10).map(e => `  * [${e.date}] ${e.description} (${e.category}): $${e.amount.toFixed(2)} via ${e.payment_method}`).join('\n')}

Income Sources:
${incomeItems.map(i => `  * [${i.date}] ${i.source} (${i.category}): $${i.amount.toFixed(2)}`).join('\n')}
`;
}

// Local fallbacks based on real user financial calculations
function generateLocalChatReply(message: string, month?: string): string {
  const currentMonth = month || new Date().toISOString().slice(0, 7);
  const ov = calculateOverview(currentMonth);
  const q = message.toLowerCase();

  if (q.includes('afford') || q.includes('buy') || q.includes('purchase')) {
    const numbers = message.match(/\$?(\d+[\d,]*(\.\d+)?)/g);
    const amount = numbers ? parseFloat(numbers[0].replace(/[$,]/g, '')) : 0;
    const surplus = ov.netSavings;
    if (amount > 0) {
      if (surplus >= amount) {
        return `### Affordability Assessment\n\n**Yes, conditionally.**\n- Your projected net monthly savings for ${currentMonth} is **$${surplus.toLocaleString()}**.\n- A purchase of **$${amount.toLocaleString()}** leaves you with approximately **$${(surplus - amount).toLocaleString()}** in net monthly savings.\n\n**Recommendation:** Verify that this doesn't conflict with your active savings goals before proceeding.`;
      } else {
        return `### Affordability Assessment\n\n**Not recommended this month.**\n- Your current monthly net savings is **$${surplus.toLocaleString()}**, which is less than the requested outlay of **$${amount.toLocaleString()}**.\n- This purchase would create a monthly deficit of **$${(amount - surplus).toLocaleString()}**.\n\n**Recommendation:** Consider spacing this purchase across multiple months or adjusting discretionary spending categories.`;
      }
    }
  }

  const topCat = ov.categoryBreakdown[0];
  return `### Live Financial Analysis (${currentMonth})

Based on your current recorded finances:
• **Total Monthly Income:** $${ov.totalIncome.toLocaleString()}
• **Total Recorded Outflows:** $${ov.totalExpenses.toLocaleString()}
• **Net Monthly Savings:** $${ov.netSavings.toLocaleString()} (Savings rate: **${ov.savingsRate}%**)
${topCat ? `• **Highest Expense Category:** **${topCat.category}** ($${topCat.spent.toLocaleString()} spent)` : ''}

**Key Strategic Insights:**
1. **Savings Rate:** At **${ov.savingsRate}%**, your cash flow is ${ov.savingsRate >= 20 ? 'healthy and adheres to wealth-building benchmarks' : 'below the recommended 20% savings rule'}.
2. **Budget Discipline:** You have utilized **${ov.budgetUtilization}%** of your total monthly budget limits.
3. **Actionable Step:** ${topCat ? `Review discretionary items in **${topCat.category}** to free up capital for savings.` : 'Continue logging expenses to keep an accurate spending ledger.'}`;
}

function generateLocalAudit(month?: string) {
  const currentMonth = month || new Date().toISOString().slice(0, 7);
  const ov = calculateOverview(currentMonth);

  let healthScore = 55;
  if (ov.totalIncome > 0) {
    if (ov.savingsRate >= 25) healthScore += 30;
    else if (ov.savingsRate >= 15) healthScore += 20;
    else if (ov.savingsRate >= 5) healthScore += 10;
    else healthScore -= 15;

    if (ov.budgetUtilization > 0 && ov.budgetUtilization <= 85) healthScore += 12;
    else if (ov.budgetUtilization > 100) healthScore -= 18;

    const overspentCount = ov.categoryBreakdown.filter((c) => c.status === 'exceeded').length;
    healthScore -= overspentCount * 5;
  }
  healthScore = Math.max(15, Math.min(96, healthScore));

  const grade = healthScore >= 88 ? 'A' : healthScore >= 75 ? 'B' : healthScore >= 62 ? 'C' : 'D';

  const strengths: string[] = [];
  if (ov.savingsRate >= 20) strengths.push(`Strong savings rate of ${ov.savingsRate}%, exceeding the 20% benchmark.`);
  if (ov.netSavings > 0) strengths.push(`Retaining $${ov.netSavings.toLocaleString()} in net surplus this month.`);
  if (ov.totalBudgetLimit > 0 && ov.budgetUtilization <= 90) strengths.push(`Budget utilization is controlled at ${ov.budgetUtilization}%.`);
  if (strengths.length === 0) strengths.push('Active expense tracking provides financial clarity.');

  const risks: string[] = [];
  ov.categoryBreakdown.filter((c) => c.status === 'exceeded').forEach((c) => {
    risks.push(`Over budget in "${c.category}" by $${Math.abs(c.remaining).toLocaleString()} (${c.percentage}% used).`);
  });
  if (ov.savingsRate < 10 && ov.totalIncome > 0) risks.push(`Savings rate is ${ov.savingsRate}%, providing limited cushion for emergencies.`);
  if (risks.length === 0) risks.push('No severe spending alerts detected.');

  return {
    healthScore,
    scoreGrade: grade,
    summary: `Comprehensive financial audit reveals a grade ${grade} standing (${healthScore}/100) with $${ov.netSavings.toLocaleString()} in net monthly savings across ${ov.transactionCount} logged transactions.`,
    keyStrengths: strengths.slice(0, 3),
    criticalRisks: risks.slice(0, 3),
    categoryInsights: ov.categoryBreakdown.slice(0, 4).map((c) => ({
      category: c.category,
      status: c.status === 'exceeded' ? 'Overspent' : c.status === 'warning' ? 'Warning' : 'Healthy',
      insight: c.status === 'exceeded'
        ? `Exceeded budget limit by $${Math.abs(c.remaining).toLocaleString()}. Review discretionary items.`
        : `Well maintained at $${c.spent.toLocaleString()} (${c.percentage}% used).`,
    })),
    actionableTips: [
      {
        title: 'Optimize Top Spending Category',
        description: ov.categoryBreakdown[0] ? `Trim 10% from ${ov.categoryBreakdown[0].category} to boost monthly savings.` : 'Set monthly budget limits.',
        estimatedMonthlySavings: Math.round((ov.categoryBreakdown[0]?.spent || 100) * 0.1),
      },
      {
        title: 'Build Systematic Emergency Buffer',
        description: 'Automate transfers of monthly surplus into a dedicated savings goal.',
        estimatedMonthlySavings: Math.round(ov.totalIncome * 0.05),
      },
    ],
    recommended503020Split: {
      needsPercentage: 50,
      wantsPercentage: 30,
      savingsPercentage: 20,
      note: `Align your ${ov.savingsRate}% savings trajectory closer to the standard 50/30/20 benchmark.`,
    },
  };
}

// Helper: Call Gemini with graceful fallback if model experiences high demand (503) or latency
async function generateWithFallback(options: {
  preferredModel: string;
  contents: any;
  config?: any;
}) {
  const modelsToTry = [
    options.preferredModel,
    options.preferredModel !== 'gemini-3.1-flash-lite' ? 'gemini-3.1-flash-lite' : 'gemini-3.8-flash',
  ];

  let lastError: any = null;
  for (const model of modelsToTry) {
    try {
      const timeoutMs = model === options.preferredModel ? 10000 : 15000;
      const response = await Promise.race([
        ai.models.generateContent({
          model,
          contents: options.contents,
          config: options.config,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout requesting ${model}`)), timeoutMs)
        ),
      ]);
      return { response, modelUsed: model };
    } catch (err: any) {
      console.warn(`Model ${model} request failed/timed out:`, err.message || err);
      lastError = err;
    }
  }
  throw lastError;
}

// 9. Gemini Multi-Turn Conversational Chatbot
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  const { message, history, month, modelChoice } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required.' });
  }

  const preferredModel = modelChoice === 'gemini-3.1-flash-lite' ? 'gemini-3.1-flash-lite' : 'gemini-3.8-flash';
  const financialContext = buildFinancialContext(month);

  const systemInstruction = `You are the Personal Finance Advisor Bot, a certified, encouraging, and deeply practical financial intelligence assistant.
Your job is to help users manage their money with clarity and confidence. You analyze their monthly income, track expenses, identify spending leaks, recommend 50/30/20 budget adjustments, evaluate whether they can afford upcoming purchases, and help them hit their savings goals.

CRITICAL RULES:
1. Always base your calculations and advice on the user's REAL live financial data provided in the context below. Quote their actual numbers accurately (income, specific category spend, remaining budget, goals).
2. When answering affordability questions (e.g., "Can I buy a $300 jacket?"), check their remaining disposable income, category budget, and savings goal implications, and give a clear, reasoned YES/NO/CONDITIONAL recommendation.
3. Be realistic, respectful, and constructive. Never judge. Provide concrete next steps (e.g., "Trim dining by $45 this week to stay under budget").
4. Format your responses with clean Markdown: bullet points, bold key figures, and small tables when presenting multi-item comparisons.
5. If the user asks about investment or tax specifics, provide general educational guidance and note that they should consult a licensed CPA or fiduciary for individualized tax/legal decisions.

${financialContext}
`;

  // Format chat contents from history
  const contents: any[] = [];
  if (Array.isArray(history)) {
    for (const turn of history) {
      if (turn.role === 'user' || turn.role === 'model') {
        contents.push({
          role: turn.role,
          parts: [{ text: turn.text || turn.content || '' }],
        });
      }
    }
  }
  contents.push({
    role: 'user',
    parts: [{ text: message }],
  });

  try {
    const { response, modelUsed } = await generateWithFallback({
      preferredModel,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const replyText = response.text || "I've analyzed your finances. Could you please specify which area you'd like to look into further?";
    res.json({ reply: replyText, model: modelUsed });
  } catch (apiError: any) {
    console.warn('Gemini chat request failed, serving intelligent financial analysis fallback:', apiError.message);
    const fallbackReply = generateLocalChatReply(message, month);
    res.json({ reply: fallbackReply, model: 'local-advisor-engine' });
  }
});

// 10. Gemini Financial Health Audit & Insights
app.post('/api/ai/audit', async (req: Request, res: Response) => {
  const month = req.body?.month as string | undefined;
  try {
    const financialContext = buildFinancialContext(month);

    const prompt = `Analyze the following user financial data and perform a comprehensive Financial Health Audit.
Return a structured JSON response evaluating their spending efficiency, emergency cushion, budget adherence, and actionable wealth-building opportunities.

${financialContext}
`;

    const { response, modelUsed } = await generateWithFallback({
      preferredModel: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an elite quantitative personal finance auditor. Always respond with strict JSON adhering to the provided schema.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            healthScore: { type: Type.INTEGER, description: 'Score from 0 to 100 based on savings rate, budget discipline, and cash flow' },
            scoreGrade: { type: Type.STRING, description: 'Letter grade: A+, A, B, C, D, or F' },
            summary: { type: Type.STRING, description: 'Concise executive summary of current financial standing' },
            keyStrengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Top 2-3 positive financial habits detected in data',
            },
            criticalRisks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Top 1-3 risks, overspending categories, or cash flow concerns',
            },
            categoryInsights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  status: { type: Type.STRING, description: 'Healthy, Warning, or Overspent' },
                  insight: { type: Type.STRING, description: 'Specific observation and actionable recommendation for this category' },
                },
                required: ['category', 'status', 'insight'],
              },
            },
            actionableTips: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  estimatedMonthlySavings: { type: Type.NUMBER },
                },
                required: ['title', 'description', 'estimatedMonthlySavings'],
              },
              description: 'Top 3 high-impact specific tips to save money right now',
            },
            recommended503020Split: {
              type: Type.OBJECT,
              properties: {
                needsPercentage: { type: Type.NUMBER },
                wantsPercentage: { type: Type.NUMBER },
                savingsPercentage: { type: Type.NUMBER },
                note: { type: Type.STRING },
              },
              required: ['needsPercentage', 'wantsPercentage', 'savingsPercentage', 'note'],
            },
          },
          required: [
            'healthScore',
            'scoreGrade',
            'summary',
            'keyStrengths',
            'criticalRisks',
            'categoryInsights',
            'actionableTips',
            'recommended503020Split',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.warn('Gemini Audit API request failed/timed out, serving local quantitative audit fallback:', error.message);
    const localAudit = generateLocalAudit(month);
    res.json(localAudit);
  }
});

// Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
