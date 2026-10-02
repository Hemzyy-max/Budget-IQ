import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  Calendar,
  CreditCard,
  Repeat,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { transactionsApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate, getCategoryStyles } from '../utils/formatters';
import TransactionModal from '../components/TransactionModal';

const CATEGORIES = ['All', 'Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Education', 'Health', 'Subscriptions', 'Salary', 'Other'];

export default function TransactionsPage({ onTransactionMutated }) {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('date_desc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const { addToast } = useToast();

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await transactionsApi.getAll({
        search: search || undefined,
        category: category !== 'All' ? category : undefined,
        transaction_type: typeFilter !== 'All' ? typeFilter : undefined,
        sort_by: sortBy,
      });
      setTransactions(res.data);
    } catch {
      addToast('Failed to load transactions.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [search, category, typeFilter, sortBy, addToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchTransactions]);

  const handleSaveTransaction = async (data) => {
    try {
      if (editingTransaction) {
        await transactionsApi.update(editingTransaction.id, data);
        addToast('Transaction updated successfully.', 'success');
      } else {
        await transactionsApi.create(data);
        addToast('Transaction added successfully.', 'success');
      }
      fetchTransactions();
      if (onTransactionMutated) onTransactionMutated();
    } catch {
      addToast('Unable to save transaction. Please try again.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    setDeletingId(id);
    try {
      await transactionsApi.delete(id);
      addToast('Transaction deleted.', 'info');
      fetchTransactions();
      if (onTransactionMutated) onTransactionMutated();
    } catch {
      addToast('Failed to delete transaction.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Transactions</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            View, filter, search, and audit your financial entries.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingTransaction(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-glow-indigo transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Record Transaction</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-iq-card border border-iq-border space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search description, category, or payment method..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  Category: {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div className="sm:col-span-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="All">Type: All</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
            </select>
          </div>

          {/* Sort */}
          <div className="sm:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="amount_asc">Lowest Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-hidden rounded-2xl bg-iq-card border border-iq-border shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/80 border-b border-iq-border text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4">Description</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Method</th>
              <th className="py-3.5 px-4 text-right">Amount</th>
              <th className="py-3.5 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-iq-border/50">
            {transactions.map((tx) => {
              const isIncome = tx.transaction_type === 'income';
              const catStyle = getCategoryStyles(tx.category);

              return (
                <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 text-slate-300 font-medium whitespace-nowrap">
                    {formatDate(tx.transaction_date)}
                  </td>
                  <td className="py-3 px-4 text-white font-medium">
                    <div className="flex items-center gap-1.5">
                      <span>{tx.description || tx.category}</span>
                      {tx.is_recurring && (
                        <span className="p-0.5 rounded bg-indigo-500/20 text-indigo-300" title="Recurring Commitment">
                          <Repeat className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${catStyle.bg} ${catStyle.text}`}>
                      {tx.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {tx.payment_method || 'UPI'}
                  </td>
                  <td className="py-3 px-4 text-right font-bold whitespace-nowrap">
                    <span className={isIncome ? 'text-emerald-400' : 'text-slate-100'}>
                      {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setEditingTransaction(tx);
                          setIsModalOpen(true);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        disabled={deletingId === tx.id}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {transactions.length === 0 && !isLoading && (
          <div className="p-12 text-center text-slate-400">
            No transactions match the selected criteria.
          </div>
        )}
      </div>

      {/* Mobile Stacked Cards */}
      <div className="md:hidden space-y-3">
        {transactions.map((tx) => {
          const isIncome = tx.transaction_type === 'income';
          const catStyle = getCategoryStyles(tx.category);

          return (
            <div
              key={tx.id}
              className="p-4 rounded-xl bg-iq-card border border-iq-border flex items-center justify-between gap-3 shadow-md"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${catStyle.bg} ${catStyle.text}`}>
                    {tx.category}
                  </span>
                  <span className="text-xs text-slate-400">{formatDate(tx.transaction_date)}</span>
                </div>
                <div className="text-xs font-bold text-white leading-snug">
                  {tx.description || tx.category}
                </div>
                <span className="text-[11px] text-slate-400 block">{tx.payment_method}</span>
              </div>

              <div className="text-right">
                <div className={`text-sm font-black ${isIncome ? 'text-emerald-400' : 'text-white'}`}>
                  {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                </div>
                <div className="flex items-center justify-end gap-2 mt-2">
                  <button
                    onClick={() => {
                      setEditingTransaction(tx);
                      setIsModalOpen(true);
                    }}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(tx.id)}
                    className="p-1 text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {transactions.length === 0 && !isLoading && (
          <div className="p-8 text-center text-slate-400 text-xs rounded-xl bg-iq-card border border-iq-border">
            No transactions found.
          </div>
        )}
      </div>

      {/* Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        initialData={editingTransaction}
      />
    </div>
  );
}
