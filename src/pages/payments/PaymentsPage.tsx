import React, { useState } from 'react';
import {
  Wallet, ArrowUpRight, ArrowDownLeft, ArrowLeftRight,
  TrendingUp, CheckCircle, Clock, XCircle, DollarSign
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { getWallet, getTransactionsForUser, addTransaction, wallets } from '../../data/transactions';
import { users } from '../../data/users';
import { Transaction } from '../../types';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

type ActionType = 'deposit' | 'withdrawal' | 'transfer' | 'deal_funding';

const txStatusConfig = {
  completed: { variant: 'success' as const, icon: <CheckCircle size={14} /> },
  pending: { variant: 'warning' as const, icon: <Clock size={14} /> },
  failed: { variant: 'error' as const, icon: <XCircle size={14} /> },
};

const txTypeIcon: Record<ActionType, React.ReactNode> = {
  deposit: <ArrowDownLeft size={16} className="text-green-600" />,
  withdrawal: <ArrowUpRight size={16} className="text-red-500" />,
  transfer: <ArrowLeftRight size={16} className="text-blue-500" />,
  deal_funding: <TrendingUp size={16} className="text-purple-600" />,
};

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [, forceUpdate] = useState(0);
  const [modal, setModal] = useState<ActionType | null>(null);
  const [form, setForm] = useState({ amount: '', receiverId: '', description: '' });

  if (!user) return null;

  const wallet = getWallet(user.id);
  const txs = getTransactionsForUser(user.id);
  const otherUsers = users.filter(u => u.id !== user.id);

  const handleAction = () => {
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return; }
    if ((modal === 'transfer' || modal === 'deal_funding') && !form.receiverId) {
      toast.error('Select a recipient'); return;
    }
    if (modal === 'withdrawal' && amount > wallet.balance) {
      toast.error('Insufficient balance'); return;
    }

    addTransaction({
      senderId: modal === 'deposit' ? user.id : user.id,
      receiverId: modal === 'deposit' ? user.id : (modal === 'withdrawal' ? user.id : form.receiverId),
      amount,
      type: modal!,
      status: 'completed',
      description: form.description || `${modal} transaction`,
    });

    toast.success(`${modal} of ${fmt(amount)} successful`);
    setModal(null);
    setForm({ amount: '', receiverId: '', description: '' });
    forceUpdate(n => n + 1);
  };

  const totalIn = txs.filter(t => t.receiverId === user.id && t.status === 'completed').reduce((s, t) => s + t.amount, 0);
  const totalOut = txs.filter(t => t.senderId === user.id && t.receiverId !== user.id && t.status === 'completed').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-600">Manage your wallet and transactions</p>
      </div>

      {/* Wallet card */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-primary-200 text-sm font-medium">Wallet Balance</p>
            <h2 className="text-4xl font-bold mt-1">{fmt(wallet.balance)}</h2>
            <p className="text-primary-200 text-sm mt-1">{user.name}</p>
          </div>
          <div className="p-3 bg-white bg-opacity-20 rounded-xl">
            <Wallet size={28} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-primary-500">
          <div>
            <p className="text-primary-200 text-xs">Total Received</p>
            <p className="text-lg font-semibold">{fmt(totalIn)}</p>
          </div>
          <div>
            <p className="text-primary-200 text-xs">Total Sent</p>
            <p className="text-lg font-semibold">{fmt(totalOut)}</p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {([
          { type: 'deposit' as ActionType, label: 'Deposit', icon: <ArrowDownLeft size={20} />, color: 'bg-green-50 text-green-700 hover:bg-green-100' },
          { type: 'withdrawal' as ActionType, label: 'Withdraw', icon: <ArrowUpRight size={20} />, color: 'bg-red-50 text-red-700 hover:bg-red-100' },
          { type: 'transfer' as ActionType, label: 'Transfer', icon: <ArrowLeftRight size={20} />, color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
          { type: 'deal_funding' as ActionType, label: 'Fund Deal', icon: <TrendingUp size={20} />, color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
        ]).map(action => (
          <button
            key={action.type}
            onClick={() => setModal(action.type)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl font-medium text-sm transition-colors ${action.color}`}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>

      {/* Transaction history */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Transaction History</h2>
        </CardHeader>
        <CardBody className="p-0">
          {txs.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <DollarSign size={40} className="mx-auto mb-3 text-gray-300" />
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {txs.map(tx => {
                const isIncoming = tx.receiverId === user.id && tx.type !== 'withdrawal';
                const counterparty = users.find(u => u.id === (isIncoming ? tx.senderId : tx.receiverId));
                return (
                  <div key={tx.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        {txTypeIcon[tx.type]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{tx.description}</p>
                        <p className="text-xs text-gray-500">
                          {counterparty ? (isIncoming ? `From ${counterparty.name}` : `To ${counterparty.name}`) : tx.type}
                          {' · '}{format(parseISO(tx.timestamp), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${isIncoming ? 'text-green-600' : 'text-red-500'}`}>
                        {isIncoming ? '+' : '-'}{fmt(tx.amount)}
                      </p>
                      <Badge variant={txStatusConfig[tx.status].variant} size="sm">
                        <span className="flex items-center gap-1">
                          {txStatusConfig[tx.status].icon}
                          {tx.status}
                        </span>
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Action modal */}
      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 capitalize">{modal.replace('_', ' ')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number" min="1" placeholder="0.00"
                    className="w-full border border-gray-300 rounded-md pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  />
                </div>
              </div>

              {(modal === 'transfer' || modal === 'deal_funding') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={form.receiverId}
                    onChange={e => setForm(f => ({ ...f, receiverId: e.target.value }))}
                  >
                    <option value="">Select recipient...</option>
                    {otherUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text" placeholder="Optional note..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>

              {modal === 'withdrawal' && (
                <p className="text-xs text-gray-500">Available: {fmt(wallet.balance)}</p>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <Button fullWidth onClick={handleAction}>Confirm</Button>
              <Button fullWidth variant="outline" onClick={() => setModal(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
