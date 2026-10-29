import React, { useState, useEffect } from 'react';
import { X, Scale, DollarSign } from 'lucide-react';
import { Category } from '../types/finance';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  initialCategory?: string;
  initialLimit?: number;
  onSaveBudget: (category: string, monthly_limit: number) => Promise<void>;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  categories,
  initialCategory,
  initialLimit,
  onSaveBudget,
}) => {
  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const [selectedCat, setSelectedCat] = useState(initialCategory || expenseCategories[0]?.name || '');
  const [limit, setLimit] = useState(initialLimit ? String(initialLimit) : '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSelectedCat(initialCategory || expenseCategories[0]?.name || '');
      setLimit(initialLimit ? String(initialLimit) : '');
    }
  }, [isOpen, initialCategory, initialLimit, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedLimit = parseFloat(limit);
    if (!selectedCat) {
      setError('Please choose a category.');
      return;
    }
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      setError('Please provide a positive monthly limit.');
      return;
    }

    setSubmitting(true);
    try {
      await onSaveBudget(selectedCat, parsedLimit);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save budget');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl space-y-4">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Category Budget Limit</h3>
              <p className="text-xs text-slate-400">Set maximum spending cap per month</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 pt-0 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Expense Category</label>
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Monthly Planned Cap ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 text-sm font-bold">$</span>
              <input
                type="number"
                step="1"
                min="1"
                required
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="e.g. 500"
                className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

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
              className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              {submitting ? 'Saving...' : 'Set Budget Limit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
