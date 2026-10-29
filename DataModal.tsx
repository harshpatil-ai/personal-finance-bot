import React, { useState } from 'react';
import { X, Download, Upload, Database, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface DataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRestored: () => void;
}

export const DataModal: React.FC<DataModalProps> = ({
  isOpen,
  onClose,
  onDataRestored,
}) => {
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  if (!isOpen) return null;

  // Export JSON
  const handleExportJSON = async () => {
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finance_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Failed to export data: ' + err.message);
    }
  };

  // Export CSV of transactions
  const handleExportCSV = async () => {
    try {
      const data = await api.exportData();
      let csv = 'Type,ID,Title/Source,Amount,Category,Date,PaymentMethod,Notes\n';

      // Income
      if (Array.isArray(data.income)) {
        for (const inc of data.income) {
          csv += `Income,"${inc.id}","${inc.source}",${inc.amount},"${inc.category}","${inc.date}","","${inc.notes || ''}"\n`;
        }
      }

      // Expenses
      if (Array.isArray(data.expenses)) {
        for (const exp of data.expenses) {
          csv += `Expense,"${exp.id}","${exp.description}",${exp.amount},"${exp.category}","${exp.date}","${exp.payment_method || ''}","${exp.notes || ''}"\n`;
        }
      }

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Failed to export CSV: ' + err.message);
    }
  };

  // Import JSON File
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccess(false);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setImporting(true);
        const parsed = JSON.parse(evt.target?.result as string);
        if (!parsed.income || !parsed.expenses) {
          throw new Error('Invalid JSON format: missing income or expenses arrays.');
        }
        await api.importData(parsed);
        setImportSuccess(true);
        onDataRestored();
      } catch (err: any) {
        setImportError(err.message || 'Failed to import JSON data.');
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Database Backup & Export</h3>
              <p className="text-xs text-slate-400">Manage SQLite records, backups, and exports</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 pt-0 space-y-4 text-xs">
          {importSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Database successfully restored from JSON backup!</span>
            </div>
          )}

          {importError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          {/* Export Options */}
          <div className="space-y-2">
            <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
              Export Data
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExportJSON}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition-colors cursor-pointer flex items-center gap-2.5 group"
              >
                <Download className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-bold text-white text-xs">Full JSON Dump</div>
                  <div className="text-[10px] text-slate-400">All SQLite tables</div>
                </div>
              </button>

              <button
                onClick={handleExportCSV}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition-colors cursor-pointer flex items-center gap-2.5 group"
              >
                <FileSpreadsheet className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-bold text-white text-xs">CSV Spreadsheet</div>
                  <div className="text-[10px] text-slate-400">Transactions table</div>
                </div>
              </button>
            </div>
          </div>

          {/* Import Backup */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
              Restore / Import Backup
            </span>
            <label className="block p-4 border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl bg-slate-800/40 text-center cursor-pointer transition-colors group">
              <Upload className="w-6 h-6 text-slate-400 group-hover:text-emerald-400 mx-auto mb-1 transition-colors" />
              <span className="font-semibold text-white block">
                {importing ? 'Restoring database...' : 'Click to select JSON backup file'}
              </span>
              <span className="text-[10px] text-slate-500">Restores income, expenses, budgets, and goals</span>
              <input
                type="file"
                accept=".json"
                disabled={importing}
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
