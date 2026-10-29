import React, { useState, useEffect } from 'react';
import { X, Target, Calendar, DollarSign } from 'lucide-react';
import { SavingsGoal } from '../types/finance';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: SavingsGoal | null;
  onSaveGoal: (data: Partial<SavingsGoal>) => Promise<void>;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSaveGoal,
}) => {
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('Emergency');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (initialData) {
        setTitle(initialData.title);
        setTargetAmount(String(initialData.target_amount));
        setCurrentAmount(String(initialData.current_amount));
        setTargetDate(initialData.target_date);
        setCategory(initialData.category || 'General');
        setNotes(initialData.notes || '');
      } else {
        setTitle('');
        setTargetAmount('');
        setCurrentAmount('0');
        // default 6 months from now
        const d = new Date();
        d.setMonth(d.getMonth() + 6);
        setTargetDate(d.toISOString().slice(0, 10));
        setCategory('Emergency');
        setNotes('');
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTarget = parseFloat(targetAmount);
    const parsedCurrent = parseFloat(currentAmount) || 0;

    if (!title.trim()) {
      setError('Please provide a goal title.');
      return;
    }
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      setError('Please provide a positive target amount.');
      return;
    }
    if (!targetDate) {
      setError('Please specify a target date.');
      return;
    }

    setSubmitting(true);
    try {
      await onSaveGoal({
        title: title.trim(),
        target_amount: parsedTarget,
        current_amount: parsedCurrent,
        target_date: targetDate,
        category,
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save goal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl space-y-4">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {initialData ? 'Edit Savings Goal' : 'Create Savings Goal'}
              </h3>
              <p className="text-xs text-slate-400">Track target amount and countdown deadline</p>
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
            <label className="block text-xs font-semibold text-slate-300 mb-1">Goal Name</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 6-Month Emergency Fund, Japan Trip, New Car..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Amount ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-sm font-bold">$</span>
                <input
                  type="number"
                  step="1"
                  min="1"
                  required
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="5000"
                  className="w-full pl-7 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Currently Saved ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-sm font-bold">$</span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Completion Date</label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="Emergency">Emergency Fund</option>
                <option value="Travel">Travel & Vacation</option>
                <option value="Education">Education & Tech</option>
                <option value="Home">Home & Renovation</option>
                <option value="Vehicle">Vehicle / Car</option>
                <option value="Retirement">Retirement & Investing</option>
                <option value="General">General Savings</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Notes / Motivation (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why this goal matters to you..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
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
              className="px-5 py-2 text-xs font-bold rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 transition-all shadow-md shadow-teal-500/20 cursor-pointer"
            >
              {submitting ? 'Saving...' : initialData ? 'Save Changes' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
