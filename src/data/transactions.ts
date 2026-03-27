import { Transaction, WalletBalance } from '../types';

export const wallets: WalletBalance[] = [
  { userId: 'e1', balance: 125000, currency: 'USD' },
  { userId: 'e2', balance: 48500, currency: 'USD' },
  { userId: 'e3', balance: 32000, currency: 'USD' },
  { userId: 'e4', balance: 75000, currency: 'USD' },
  { userId: 'i1', balance: 2500000, currency: 'USD' },
  { userId: 'i2', balance: 4200000, currency: 'USD' },
  { userId: 'i3', balance: 1800000, currency: 'USD' },
];

export const transactions: Transaction[] = [
  { id: 't1', senderId: 'i1', receiverId: 'e1', amount: 250000, type: 'deal_funding', status: 'completed', description: 'Seed funding – TechWave AI', timestamp: '2026-03-10T10:00:00Z' },
  { id: 't2', senderId: 'i2', receiverId: 'e2', amount: 500000, type: 'deal_funding', status: 'completed', description: 'Series A – GreenLife Solutions', timestamp: '2026-03-12T14:30:00Z' },
  { id: 't3', senderId: 'e1', receiverId: 'e1', amount: 50000, type: 'deposit', status: 'completed', description: 'Bank deposit', timestamp: '2026-03-15T09:00:00Z' },
  { id: 't4', senderId: 'i1', receiverId: 'i1', amount: 100000, type: 'withdrawal', status: 'completed', description: 'Withdrawal to bank', timestamp: '2026-03-18T11:00:00Z' },
  { id: 't5', senderId: 'i3', receiverId: 'e3', amount: 150000, type: 'deal_funding', status: 'pending', description: 'Seed funding – HealthPulse', timestamp: '2026-03-25T16:00:00Z' },
];

export const getWallet = (userId: string): WalletBalance =>
  wallets.find(w => w.userId === userId) || { userId, balance: 0, currency: 'USD' };

export const getTransactionsForUser = (userId: string): Transaction[] =>
  transactions.filter(t => t.senderId === userId || t.receiverId === userId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

export const addTransaction = (tx: Omit<Transaction, 'id' | 'timestamp'>): Transaction => {
  const newTx: Transaction = { ...tx, id: `t${Date.now()}`, timestamp: new Date().toISOString() };
  transactions.push(newTx);
  // Update wallet balances
  if (tx.type === 'deposit') {
    const w = wallets.find(w => w.userId === tx.receiverId);
    if (w) w.balance += tx.amount;
  } else if (tx.type === 'withdrawal') {
    const w = wallets.find(w => w.userId === tx.senderId);
    if (w) w.balance -= tx.amount;
  } else if (tx.type === 'transfer' || tx.type === 'deal_funding') {
    const sender = wallets.find(w => w.userId === tx.senderId);
    const receiver = wallets.find(w => w.userId === tx.receiverId);
    if (sender) sender.balance -= tx.amount;
    if (receiver) receiver.balance += tx.amount;
  }
  return newTx;
};
