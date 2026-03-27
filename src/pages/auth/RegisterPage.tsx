import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, CircleDollarSign, Building2, AlertCircle } from 'lucide-react';
import zxcvbn from 'zxcvbn';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { UserRole } from '../../types';

const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
const strengthColors = ['bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-blue-500', 'bg-green-500'];
const strengthTextColors = ['text-red-600', 'text-orange-500', 'text-yellow-600', 'text-blue-600', 'text-green-600'];

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('entrepreneur');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const strength = password ? zxcvbn(password) : null;
  const score = strength?.score ?? -1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (score < 2) { setError('Please choose a stronger password'); return; }
    setIsLoading(true);
    try {
      await register(name, email, password, role);
      navigate(role === 'entrepreneur' ? '/dashboard/entrepreneur' : '/dashboard/investor');
    } catch (err) {
      setError((err as Error).message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-primary-600 rounded-md flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-white">
              <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 21V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your account</h2>
        <p className="mt-2 text-center text-sm text-gray-600">Join Business Nexus to connect with partners</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-error-50 border border-error-500 text-error-700 px-4 py-3 rounded-md flex items-start">
              <AlertCircle size={18} className="mr-2 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">I am registering as a</label>
              <div className="grid grid-cols-2 gap-3">
                {(['entrepreneur', 'investor'] as UserRole[]).map(r => (
                  <button key={r} type="button"
                    className={`py-3 px-4 border rounded-md flex items-center justify-center transition-colors capitalize ${role === r ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    onClick={() => setRole(r)}>
                    {r === 'entrepreneur' ? <Building2 size={18} className="mr-2" /> : <CircleDollarSign size={18} className="mr-2" />}
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <Input label="Full name" type="text" value={name} onChange={e => setName(e.target.value)} required fullWidth startAdornment={<User size={18} />} />
            <Input label="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} required fullWidth startAdornment={<Mail size={18} />} />

            <div>
              <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required fullWidth startAdornment={<Lock size={18} />} />
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[0, 1, 2, 3, 4].map(i => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= score ? strengthColors[score] : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-medium ${strengthTextColors[score]}`}>{strengthLabels[score]}</span>
                    {strength?.feedback.suggestions[0] && (
                      <span className="text-xs text-gray-400">{strength.feedback.suggestions[0]}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Input label="Confirm password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required fullWidth startAdornment={<Lock size={18} />}
              error={confirmPassword && confirmPassword !== password ? 'Passwords do not match' : undefined} />

            <div className="flex items-center">
              <input id="terms" type="checkbox" required className="h-4 w-4 text-primary-600 border-gray-300 rounded" />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                I agree to the <a href="#" className="font-medium text-primary-600 hover:text-primary-500">Terms</a> and <a href="#" className="font-medium text-primary-600 hover:text-primary-500">Privacy Policy</a>
              </label>
            </div>

            <Button type="submit" fullWidth isLoading={isLoading}>Create account</Button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account? <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
