import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  MessageSquare,
  Activity,
  Zap,
  Info,
  DollarSign,
  PieChart,
} from 'lucide-react';
import { ChatMessage, AuditResult, FinanceOverview } from '../types/finance';
import { api } from '../services/api';

interface AiAdvisorTabProps {
  overview: FinanceOverview | null;
  currentMonth: string;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
}

export const AiAdvisorTab: React.FC<AiAdvisorTabProps> = ({
  overview,
  currentMonth,
  initialPrompt,
  onClearInitialPrompt,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'audit'>('chat');
  const [modelChoice, setModelChoice] = useState<'gemini-3.8-flash' | 'gemini-3.1-flash-lite'>('gemini-3.8-flash');

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Hello! I'm your **Personal Finance Advisor Bot** powered by Google Gemini.

I have direct, real-time access to your monthly financial records:
• **Monthly Income:** $${overview?.totalIncome.toLocaleString() || '0'}
• **Total Expenses:** $${overview?.totalExpenses.toLocaleString() || '0'}
• **Net Savings:** $${overview?.netSavings.toLocaleString() || '0'} (${overview?.savingsRate || 0}%)
• **Active Budgets:** ${overview?.categoryBreakdown.length || 0} categories tracked

How can I help you optimize your money today? You can ask me about affordability, budget adjustments, or saving strategies!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Audit State
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [runningAudit, setRunningAudit] = useState<boolean>(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // Handle initial prompt from other tabs
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      setActiveSubTab('chat');
      sendMessage(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt]);

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || sending) return;

    const userMsg: ChatMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setSending(true);

    try {
      // Build history for multi-turn chat
      const historyForApi = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await api.sendChatMessage(textToSend, historyForApi, currentMonth, modelChoice);

      const botMsg: ChatMessage = {
        id: 'bot_' + Date.now(),
        role: 'model',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: res.model,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: 'err_' + Date.now(),
        role: 'model',
        text: `⚠️ **Advisory Error:** ${err.message || 'Unable to connect to Gemini API. Please check network and try again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  const handleRunAudit = async () => {
    setRunningAudit(true);
    setAuditError(null);
    try {
      const data = await api.runAudit(currentMonth);
      setAuditResult(data);
    } catch (err: any) {
      setAuditError(err.message || 'Failed to complete audit.');
    } finally {
      setRunningAudit(false);
    }
  };

  // Quick Starter Prompts
  const quickPrompts = [
    'Can I afford a $350 impulse purchase this weekend?',
    'Audit my spending categories and spot my 3 biggest leaks',
    'How can I get my savings rate up to 25%?',
    'Give me a weekly spending limit for Groceries and Dining Out',
    'How do I compare against the 50/30/20 rule?',
  ];

  // Helper to render markdown-like content cleanly (bold, lists, tables)
  const renderFormattedText = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 leading-relaxed text-xs sm:text-sm">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return <h4 key={idx} className="font-bold text-white text-sm mt-2">{line.replace('### ', '')}</h4>;
          }
          if (line.startsWith('## ')) {
            return <h3 key={idx} className="font-bold text-emerald-400 text-base mt-3">{line.replace('## ', '')}</h3>;
          }
          if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
            const raw = line.replace(/^[•\-\*]\s*/, '');
            return (
              <div key={idx} className="flex items-start gap-2 ml-1">
                <span className="text-emerald-400 font-bold">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(raw) }} />
              </div>
            );
          }
          if (line.trim() === '') {
            return <div key={idx} className="h-1" />;
          }
          return (
            <p key={idx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }} />
          );
        })}
      </div>
    );
  };

  const formatInlineMarkdown = (text: string) => {
    // Bold
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
    // Italic
    formatted = formatted.replace(/\*(.*?)\*/g, '<em class="text-slate-300 italic">$1</em>');
    // Code
    formatted = formatted.replace(/`(.*?)`/g, '<code class="bg-slate-800 text-emerald-300 px-1 py-0.5 rounded text-[11px] font-mono">$1</code>');
    return formatted;
  };

  return (
    <div className="space-y-6">
      {/* Top Advisory Switcher & Context Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-slate-950 shadow-md shadow-emerald-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Gemini AI Financial Intelligence</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider">
                Active Grounding
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Grounded in {overview?.transactionCount || 0} live transactions and {overview?.categoryBreakdown.length || 0} category budgets
            </p>
          </div>
        </div>

        {/* Sub-tab pills & Model selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-xl bg-slate-800 p-1 border border-slate-700">
            <button
              onClick={() => setActiveSubTab('chat')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'chat'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Advisor Chatbot</span>
            </button>
            <button
              onClick={() => {
                setActiveSubTab('audit');
                if (!auditResult && !runningAudit) handleRunAudit();
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'audit'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Financial Health Audit</span>
            </button>
          </div>

          {activeSubTab === 'chat' && (
            <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-xl border border-slate-700 text-xs">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <select
                value={modelChoice}
                onChange={(e) => setModelChoice(e.target.value as any)}
                className="bg-transparent text-slate-300 font-medium focus:outline-none cursor-pointer"
              >
                <option value="gemini-3.8-flash">gemini-3.8-flash (Recommended)</option>
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast)</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* SUB-TAB 1: MULTI-TURN CONVERSATIONAL CHATBOT */}
      {activeSubTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Chat Thread (3 Cols) */}
          <div className="lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col h-[650px] shadow-xl overflow-hidden">
            {/* Chat Messages List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {messages.map((msg) => {
                const isModel = msg.role === 'model';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isModel ? 'justify-start' : 'justify-end'}`}
                  >
                    {isModel && (
                      <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shrink-0 mt-0.5 shadow-md">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm ${
                        isModel
                          ? 'bg-slate-800/80 border border-slate-700 text-slate-200 rounded-tl-sm'
                          : 'bg-emerald-500 text-slate-950 font-medium rounded-tr-sm shadow-md'
                      }`}
                    >
                      {isModel ? (
                        <div>{renderFormattedText(msg.text)}</div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      )}

                      <div
                        className={`text-[10px] mt-2 flex items-center justify-between ${
                          isModel ? 'text-slate-500' : 'text-slate-800'
                        }`}
                      >
                        <span>{msg.timestamp}</span>
                        {msg.modelUsed && (
                          <span className="font-mono text-[9px] opacity-75">via {msg.modelUsed}</span>
                        )}
                      </div>
                    </div>

                    {!isModel && (
                      <div className="h-8 w-8 rounded-xl bg-slate-700 flex items-center justify-center text-white shrink-0 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}

              {sending && (
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0 animate-pulse">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-slate-400 flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" />
                    </div>
                    <span>Analyzing your live budgets & calculating recommendation...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Prompt Input Form */}
            <div className="p-4 bg-slate-950/60 border-t border-slate-800">
              <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask your finance advisor anything (e.g. 'Can I afford to dine out tonight?')..."
                  disabled={sending}
                  className="flex-1 py-2.5 px-4 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={sending || !inputText.trim()}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs font-semibold">Send</span>
                </button>
              </form>
            </div>
          </div>

          {/* Quick Starter Prompts & Financial Context Snapshot (1 Col) */}
          <div className="space-y-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Suggested Questions</span>
              </div>
              <div className="space-y-2">
                {quickPrompts.map((qp, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(qp)}
                    disabled={sending}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/40 text-xs text-slate-300 transition-all cursor-pointer group flex items-start justify-between gap-2"
                  >
                    <span>{qp}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 shrink-0 mt-0.5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Context Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3 text-xs text-slate-400">
              <div className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>Live Grounding Status</span>
              </div>
              <p>
                The advisor automatically receives your real SQLite data whenever you ask a question. No generic advice—every number aligns with your active finances.
              </p>
              <div className="pt-2 border-t border-slate-800 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Net Savings:</span>
                  <span className="text-white font-semibold">${overview?.netSavings || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Savings Rate:</span>
                  <span className="text-emerald-400 font-semibold">{overview?.savingsRate || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Limits:</span>
                  <span className="text-white font-semibold">${overview?.totalBudgetLimit || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: ONE-CLICK FINANCIAL HEALTH AUDIT */}
      {activeSubTab === 'audit' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Deep-dive diagnostic analysis computed across your recorded income, expenses, and budget limits
            </p>
            <button
              onClick={handleRunAudit}
              disabled={runningAudit}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 transition-colors shadow-md shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${runningAudit ? 'animate-spin' : ''}`} />
              <span>{runningAudit ? 'Auditing Finances...' : 'Re-Run Financial Audit'}</span>
            </button>
          </div>

          {auditError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              Error generating audit: {auditError}
            </div>
          )}

          {runningAudit ? (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-16 text-center space-y-4 shadow-xl">
              <div className="inline-block p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 animate-spin">
                <RefreshCw className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">Gemini is auditing your monthly financial health...</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Synthesizing budget adherence, identifying subtle spending anomalies, and computing high-impact wealth-building adjustments.
              </p>
            </div>
          ) : auditResult ? (
            <div className="space-y-6">
              {/* Score & Summary Card */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                <div className="flex flex-col items-center justify-center p-6 bg-slate-800/60 rounded-xl border border-slate-700/60 text-center">
                  <div className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-1">Health Score</div>
                  <div className="text-5xl font-black text-emerald-400 tracking-tight">
                    {auditResult.healthScore}
                    <span className="text-xl text-slate-500 font-normal">/100</span>
                  </div>
                  <div className="mt-2 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
                    Grade: {auditResult.scoreGrade}
                  </div>
                </div>

                <div className="md:col-span-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base font-bold text-white">Executive Financial Audit Summary</h3>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{auditResult.summary}</p>

                  <div className="pt-2 flex flex-wrap gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-400" />
                      Needs: {auditResult.recommended503020Split.needsPercentage}%
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-400" />
                      Wants: {auditResult.recommended503020Split.wantsPercentage}%
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Savings: {auditResult.recommended503020Split.savingsPercentage}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Strengths & Risks Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Identified Financial Strengths</span>
                  </div>
                  <div className="space-y-2">
                    {auditResult.keyStrengths.map((str, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-xs text-slate-200 flex items-start gap-2.5">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{str}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risks */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Critical Risks & Spending Leaks</span>
                  </div>
                  <div className="space-y-2">
                    {auditResult.criticalRisks.map((risk, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/15 text-xs text-slate-200 flex items-start gap-2.5">
                        <span className="text-rose-400 font-bold">⚠️</span>
                        <span>{risk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actionable High-Impact Saving Tips */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-base font-bold text-white">Top 3 High-Impact Action Steps</h3>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Estimated Monthly Surplus Potential</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {auditResult.actionableTips.map((tip, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{tip.title}</span>
                        {tip.estimatedMonthlySavings > 0 && (
                          <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                            +${tip.estimatedMonthlySavings}/mo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{tip.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category-by-category Diagnostic insights */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                <h3 className="text-base font-bold text-white">Category Deep-Dive Diagnostics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {auditResult.categoryInsights.map((ci, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200">{ci.category}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            ci.status.toLowerCase().includes('over')
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : ci.status.toLowerCase().includes('warn')
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {ci.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{ci.insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <Activity className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-white">No Audit Generated Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Click below to run a full diagnostic audit using Gemini on your current income, expenses, and budgets.
              </p>
              <button
                onClick={handleRunAudit}
                className="mt-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                Run Financial Audit Now
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
