import React from 'react';
import { Users, Briefcase, BarChart3, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

export const AdminPage: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow p-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-primary-100 text-primary-700">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-1 text-gray-600">Manage users, approvals, and platform activity from here.</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-700"><Users size={20} /></div>
              <div>
                <h2 className="font-semibold text-gray-900">User Management</h2>
                <p className="text-sm text-gray-600">Review entrepreneurs and investors.</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 text-green-700"><Briefcase size={20} /></div>
              <div>
                <h2 className="font-semibold text-gray-900">Deal Oversight</h2>
                <p className="text-sm text-gray-600">Approve or review pending opportunities.</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-700"><BarChart3 size={20} /></div>
              <div>
                <h2 className="font-semibold text-gray-900">System Insights</h2>
                <p className="text-sm text-gray-600">Monitor transactions and activity trends.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900">Quick overview</h3>
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium text-gray-500">Active users</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">124</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium text-gray-500">Pending deals</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">8</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
