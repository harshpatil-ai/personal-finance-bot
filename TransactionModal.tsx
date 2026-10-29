import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, ArrowUpRight, DollarSign, Calendar, Tag, CreditCard, AlignLeft, RefreshCw } from 'lucide-react';
import { Category, Income, Expense } from '../types/finance';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'income' | 'expense';
  categories: Category[];
  initialData?: Income | Expense | null;
  currencySymbol?: string;
  onSaveIncome: (data: Partial<Income>) => Promise<void>;
  onSaveExpense: (data: Partial<Expense>) => Promise<void>;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  type,
  categories,
  initialData,
  currencySymbol = '₹',
  onSaveIncome,
  onSaveExpense,
}) => {
  const [modalType, setModalType] = useState<'income' | 'expense'>(type);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when opening or editing
  useEffect(() => {
    if (isOpen) {
      setModalType(type);
      setError(null);
      if (initialData) {
        if ('source' in initialData) {
          // Income
          setModalType('income');
          setTitle(initialData.source);
          setAmount(String(initialData.amount));
          setCategory(initialData.category);
          setDate(initialData.date);
          setNotes(initialData.notes || '');
          setIsRecurring(Boolean(initialData.is_recurring));
        } else {
          // Expense
          setModalType('expense');
          setTitle(initialData.description);
          setAmount(String(initialData.amount));
          setCategory(initialData.category);
          setDate(initialData.date);
          setPaymentMethod(initialData.payment_method || 'Card');
          setNotes(initialData.notes || '');
          setIsRecurring(Boolean(initialData.is_recurring));
        }
      } else {
        // New record
        setTitle('');
        setAmount('');
        const relevantCats = categories.filter((c) => c.type === type);
        setCategory(relevantCats[0]?.name || '');
        setDate(new Date().toISOString().slice(0, 10));
        setPaymentMethod('Card');
        setNotes('');
        setIsRecurring(false);
      }
    }
  }, [isOpen, type, initialData, categories]);

  if (!isOpen) return null;

  const relevantCategories = categories.filter((c) => c.type === modalType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (!title.trim()) {
      setError(`Please enter a valid ${modalType === 'income' ? 'income source' : 'expense description'}.`);
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }
    if (!category) {
      setError('Please select a category.');
      return;
    }

    setSubmitting(true);
    try {
      if (modalType === 'income') {
        await onSaveIncome({
          source: title.trim(),
          amount: parsedAmount,
          category,
          date,
          notes: notes.trim(),
          is_recurring: isRecurring ? 1 : 0,
        });
      } else {
        await onSaveExpense({
          description: title.trim(),
          amount: parsedAmount,
          category,
          date,
          payment_method: paymentMethod,
          notes: notes.trim(),
          is_recurring: isRecurring ? 1 : 0,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save transaction');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl font-bold ${
                modalType === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              }`}
            >
              {modalType === 'income' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {initialData ? 'Edit Record' : modalType === 'income' ? 'Record Income' : 'Record Expense'}
              </h3>
              <p className="text-xs text-slate-400">
                {modalType === 'income' ? 'Log an inflow or salary receipt' : 'Track an outflow against your budgets'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 pt-0 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Type Toggle (only when creating new) */}
          {!initialData && (
            <div className="flex rounded-xl bg-slate-800 p-1 border border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setModalType('expense');
                  const firstCat = categories.find((c) => c.type === 'expense');
                  if (firstCat) setCategory(firstCat.name);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  modalType === 'expense'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Expense (Outflow)
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalType('income');
                  const firstCat = categories.find((c) => c.type === 'income');
                  if (firstCat) setCategory(firstCat.name);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  modalType === 'income'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Income (Inflow)
              </button>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Amount ({currencySymbol})</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">{currencySymbol}</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Description / Source */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {modalType === 'income' ? 'Source / Employer / Client' : 'Description / Vendor'}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={modalType === 'income' ? 'e.g. Monthly Salary, Freelance project...' : 'e.g. Trader Joe groceries, Electric bill...'}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              {relevantCategories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
              >
                <option value="Card">Debit / Credit Card</option>
                <option value="Bank Transfer">Bank Transfer / UPI</option>
                <option value="Cash">Cash</option>
                <option value="Mobile Wallet">Mobile / Digital Wallet</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Monthly Recurring Flag (for both Income & Expense) */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-200">Monthly Recurring</span>
                <p className="text-[10px] text-slate-400">
                  {modalType === 'income' ? 'Fixed monthly inflow (e.g. Salary, Allowance)' : 'Fixed recurring bill (e.g. Rent, Subscription, EMI)'}
                </p>
              </div>
            </div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900 cursor-pointer"
              />
            </label>
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add optional context or tags..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-5 py-2 text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer ${
                modalType === 'income'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                  : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
              }`}
            >
              {submitting ? 'Saving...' : initialData ? 'Save Changes' : `Save ${modalType === 'income' ? 'Income' : 'Expense'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
