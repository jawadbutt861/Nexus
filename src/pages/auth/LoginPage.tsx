import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, CircleDollarSign, Building2, LogIn, AlertCircle, Shield, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { UserRole } from '../../types';

const MOCK_OTP = '123456';

export const LoginPage: React.FC = () => {
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('entrepreneur');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    // Simulate credential check delay
    await new Promise(r => setTimeout(r, 800));
    setIsLoading(false);
    setStep('2fa');
  };

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const entered = otp.join('');
    if (entered !== MOCK_OTP) {
      setError('Invalid OTP. Use 123456 for demo.');
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password, role);
      navigate(role === 'admin' ? '/admin' : role === 'entrepreneur' ? '/dashboard/entrepreneur' : '/dashboard/investor');
    } catch (err) {
      setError((err as Error).message);
      setIsLoading(false);
    }
  };

  const fillDemo = (userRole: UserRole) => {
    setEmail(userRole === 'entrepreneur' ? 'sarah@techwave.io' : userRole === 'investor' ? 'michael@vcinnovate.com' : 'admin@businessnexus.com');
    setPassword('password123');
    setRole(userRole);
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
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to Business Nexus</h2>
        <p className="mt-2 text-center text-sm text-gray-600">Connect with investors and entrepreneurs</p>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className={`flex items-center gap-1.5 text-xs font-medium ${step === 'credentials' ? 'text-primary-600' : 'text-gray-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'credentials' ? 'bg-primary-600 text-white' : 'bg-green-500 text-white'}`}>
              {step === '2fa' ? '✓' : '1'}
            </span>
            Credentials
          </div>
          <ChevronRight size={14} className="text-gray-400" />
          <div className={`flex items-center gap-1.5 text-xs font-medium ${step === '2fa' ? 'text-primary-600' : 'text-gray-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === '2fa' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</span>
            2FA Verification
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-error-50 border border-error-500 text-error-700 px-4 py-3 rounded-md flex items-start">
              <AlertCircle size={18} className="mr-2 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'credentials' ? (
            <form className="space-y-6" onSubmit={handleCredentials}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">I am a</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['entrepreneur', 'investor', 'admin'] as UserRole[]).map(r => (
                    <button key={r} type="button"
                      className={`py-3 px-4 border rounded-md flex items-center justify-center transition-colors capitalize ${role === r ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                      onClick={() => setRole(r)}>
                      {r === 'entrepreneur' ? <Building2 size={18} className="mr-2" /> : r === 'investor' ? <CircleDollarSign size={18} className="mr-2" /> : <Shield size={18} className="mr-2" />}
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <Input label="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} required fullWidth startAdornment={<User size={18} />} />
              <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required fullWidth />

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-900">
                  <input type="checkbox" className="h-4 w-4 text-primary-600 border-gray-300 rounded" />
                  Remember me
                </label>
                <Link to="/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-500">Forgot password?</Link>
              </div>

              <Button type="submit" fullWidth isLoading={isLoading} leftIcon={<LogIn size={18} />}>
                Continue
              </Button>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleVerify2FA}>
              <div className="text-center">
                <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield size={28} className="text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-500 mt-1">Enter the 6-digit code sent to your device</p>
                <p className="text-xs text-gray-400 mt-1">(Demo: use <span className="font-mono font-semibold text-primary-600">123456</span>)</p>
              </div>

              <div className="flex justify-center gap-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => { otpRefs.current[idx] = el; }}
                    type="text" inputMode="numeric" maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(idx, e)}
                    className="w-11 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors"
                  />
                ))}
              </div>

              <Button type="submit" fullWidth isLoading={isLoading} leftIcon={<Shield size={18} />}>
                Verify & Sign In
              </Button>

              <button type="button" onClick={() => { setStep('credentials'); setOtp(['', '', '', '', '', '']); setError(null); }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 text-center">
                ← Back to credentials
              </button>
            </form>
          )}

          {step === 'credentials' && (
            <div className="mt-6">
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Demo Accounts</span></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => fillDemo('entrepreneur')} leftIcon={<Building2 size={16} />}>Entrepreneur</Button>
                <Button variant="outline" onClick={() => fillDemo('investor')} leftIcon={<CircleDollarSign size={16} />}>Investor</Button>
              </div>
              <p className="text-center text-sm text-gray-600 mt-4">
                No account? <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">Sign up</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
