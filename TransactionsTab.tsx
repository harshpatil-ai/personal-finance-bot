import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Edit2,
  Calendar,
  CreditCard,
  Tag,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Income, Expense, Category } from '../types/finance';

interface TransactionsTabProps {
  income: Income[];
  expenses: Expense[];
  categories: Category[];
  currencySymbol?: string;
  onOpenAddIncome: () => void;
  onOpenAddExpense: () => void;
  onEditIncome: (inc: Income) => void;
  onEditExpense: (exp: Expense) => void;
  onDeleteIncome: (id: string) => void;
  onDeleteExpense: (id: string) => void;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  income,
  expenses,
  categories,
  currencySymbol = '₹',
  onOpenAddIncome,
  onOpenAddExpense,
  onEditIncome,
  onEditExpense,
  onDeleteIncome,
  onDeleteExpense,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [recurringFilter, setRecurringFilter] = useState<'all' | 'recurring' | 'one-time'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  // Format currency
  const formatCurrency = (val: number) => {
    return `${currencySymbol}${val.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  // Combine & normalize items
  const combinedList = useMemo(() => {
    const list: Array<{
      id: string;
      itemType: 'income' | 'expense';
      title: string;
      amount: number;
      category: string;
      date: string;
      payment_method?: string;
      notes?: string;
      is_recurring?: number;
      original: Income | Expense;
    }> = [];

    if (filterType === 'all' || filterType === 'income') {
      income.forEach((inc) => {
        list.push({
          id: inc.id,
          itemType: 'income',
          title: inc.source,
          amount: inc.amount,
          category: inc.category,
          date: inc.date,
          notes: inc.notes,
          is_recurring: inc.is_recurring,
          original: inc,
        });
      });
    }

    if (filterType === 'all' || filterType === 'expense') {
      expenses.forEach((exp) => {
        list.push({
          id: exp.id,
          itemType: 'expense',
          title: exp.description,
          amount: exp.amount,
          category: exp.category,
          date: exp.date,
          payment_method: exp.payment_method,
          notes: exp.notes,
          is_recurring: exp.is_recurring,
          original: exp,
        });
      });
    }

    // Filter by Recurring status
    let filtered = list;
    if (recurringFilter === 'recurring') {
      filtered = filtered.filter((i) => Boolean(i.is_recurring));
    } else if (recurringFilter === 'one-time') {
      filtered = filtered.filter((i) => !i.is_recurring);
    }

    // Filter by Category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((i) => i.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          (i.notes && i.notes.toLowerCase().includes(q))
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      if (sortBy === 'date-desc') return b.date.localeCompare(a.date);
      if (sortBy === 'date-asc') return a.date.localeCompare(b.date);
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      return 0;
    });

    return filtered;
  }, [income, expenses, filterType, recurringFilter, selectedCategory, searchQuery, sortBy]);

  // Aggregate stats for filtered view
  const filteredIncomeTotal = combinedList
    .filter((i) => i.itemType === 'income')
    .reduce((acc, cur) => acc + cur.amount, 0);

  const filteredExpenseTotal = combinedList
    .filter((i) => i.itemType === 'expense')
    .reduce((acc, cur) => acc + cur.amount, 0);

  const filteredNet = filteredIncomeTotal - filteredExpenseTotal;

  return (
    <div className="space-y-6">
      {/* Top Controls Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Income & Expenses Ledger</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Record, categorize, filter, and track all inflows and outflows
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const headers = ['Type', 'Category', 'Amount', 'Date', 'Description', 'Recurring'];
                const rows = combinedList.map((i) => [
                  i.itemType,
                  `"${i.category}"`,
                  i.amount,
                  i.date,
                  `"${(i.title || '').replace(/"/g, '""')}"`,
                  i.is_recurring ? 'Yes' : 'No',
                ]);
                const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
                const encodedUri = encodeURI(csv);
                const link = document.createElement('a');
                link.setAttribute('href', encodedUri);
                link.setAttribute('download', `transactions_${new Date().toISOString().slice(0, 10)}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              title="Download CSV report"
            >
              Export CSV
            </button>
            <button
              onClick={onOpenAddIncome}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-md shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5"
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Record Income</span>
            </button>
            <button
              onClick={onOpenAddExpense}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-rose-500 hover:bg-rose-400 text-white transition-colors shadow-md shadow-rose-500/20 cursor-pointer flex items-center gap-1.5"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Record Expense</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search description, note..."
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Type Toggle */}
          <div className="flex rounded-xl bg-slate-800 p-1 border border-slate-700">
            <button
              onClick={() => setFilterType('all')}
              className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filterType === 'all' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filterType === 'expense' ? 'bg-rose-500/20 text-rose-300 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filterType === 'income' ? 'bg-emerald-500/20 text-emerald-300 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Income
            </button>
          </div>

          {/* Recurring Filter Toggle */}
          <div className="flex rounded-xl bg-slate-800 p-1 border border-slate-700">
            <button
              onClick={() => setRecurringFilter('all')}
              className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                recurringFilter === 'all' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Any
            </button>
            <button
              onClick={() => setRecurringFilter('recurring')}
              className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                recurringFilter === 'recurring' ? 'bg-blue-500/20 text-blue-300 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Recurring
            </button>
            <button
              onClick={() => setRecurringFilter('one-time')}
              className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                recurringFilter === 'one-time' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              One-Time
            </button>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              <option value="date-desc">Newest Date</option>
              <option value="date-asc">Oldest Date</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
          </div>
        </div>

        {/* Filtered Sub-Total Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span>
              Showing <strong className="text-white">{combinedList.length}</strong> transaction(s)
            </span>
            <span>•</span>
            <span className="text-emerald-400 font-medium">Inflows: +{formatCurrency(filteredIncomeTotal)}</span>
            <span>•</span>
            <span className="text-rose-400 font-medium">Outflows: -{formatCurrency(filteredExpenseTotal)}</span>
          </div>
          <div className="font-semibold">
            Filtered Balance:{' '}
            <span className={filteredNet >= 0 ? 'text-teal-400' : 'text-rose-400'}>
              {formatCurrency(filteredNet)}
            </span>
          </div>
        </div>
      </div>

      {/* Transactions Table / List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {combinedList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No transactions match the selected filters.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {combinedList.map((item) => {
              const isIncome = item.itemType === 'income';
              return (
                <div
                  key={`${item.itemType}-${item.id}`}
                  className="p-4 hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                        isIncome ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {isIncome ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-100 text-sm">{item.title}</span>
                        {item.is_recurring ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            Recurring
                          </span>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3 text-slate-500" />
                          {item.category}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {item.date}
                        </span>
                        {item.payment_method && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <CreditCard className="w-3 h-3 text-slate-500" />
                              {item.payment_method}
                            </span>
                          </>
                        )}
                        {item.notes && (
                          <>
                            <span>•</span>
                            <span className="italic text-slate-500 max-w-xs truncate">{item.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side: Amount & Action buttons */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 ml-13 sm:ml-0">
                    <div className="text-right">
                      <div
                        className={`text-base font-bold tracking-tight ${
                          isIncome ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {formatCurrency(item.amount)}
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">
                        {isIncome ? 'Income' : 'Expense'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          if (isIncome) onEditIncome(item.original as Income);
                          else onEditExpense(item.original as Expense);
                        }}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                        title="Edit record"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete this ${item.itemType} record?`)) {
                            if (isIncome) onDeleteIncome(item.id);
                            else onDeleteExpense(item.id);
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
