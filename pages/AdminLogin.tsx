
import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { Lock, Shield, User, Dumbbell, AlertTriangle } from 'lucide-react';
import { staffService } from '../lib/database';

interface LoginProps {
  onLogin: (role: UserRole, email: string) => void;
  logActivity: (action: string, details: string, category: 'access' | 'admin' | 'financial') => void;
}

const AdminLogin: React.FC<LoginProps> = ({ onLogin, logActivity }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Clear form fields on component mount (page refresh)
  useEffect(() => {
    setEmail('');
    setPassword('');
    setError('');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Check Supabase first for staff authentication
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        const staffMember = await staffService.authenticate(email, password);
        
        if (staffMember) {
          onLogin(staffMember.role, email);
          logActivity('Portal Login', `${staffMember.role === UserRole.SUPER_ADMIN ? 'Super Admin' : 'Staff Member'} (${email}) logged in successfully`, 'access');
          setIsLoading(false);
          return;
        }
      }

      // Fallback to hardcoded credentials for backward compatibility
      if (email === 'admin@goodlife.com' && password === 'admin123') {
        onLogin(UserRole.SUPER_ADMIN, email);
        logActivity('Portal Login', `Super Admin (${email}) logged in successfully`, 'access');
        setIsLoading(false);
        return;
      } else if (email === 'staff@goodlife.com' && password === 'staff123') {
        onLogin(UserRole.STAFF, email);
        logActivity('Portal Login', `Staff Member (${email}) logged in successfully`, 'access');
        setIsLoading(false);
        return;
      }

      setError('Invalid credentials. Please check your email and password.');
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-rose-600 text-white mb-6 shadow-xl transform -rotate-6">
            <Dumbbell size={32} />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Staff Portal</h2>
          <p className="text-slate-500 mt-2">Enter your credentials to manage the gym.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <form onSubmit={handleLogin} className="p-8 space-y-5">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex gap-3 text-rose-600 text-xs leading-relaxed animate-in fade-in slide-in-from-top-2">
                <AlertTriangle className="shrink-0" size={16} />
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Work Email</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white outline-none transition-all"
                  placeholder="name@goodlife.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing In...' : 'Sign In to Dashboard'}
            </button>
          </form>

          <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            <span className="flex items-center gap-1"><Shield size={12} /> Encrypted Access</span>
            <span className="hover:text-rose-600 cursor-pointer">Help Center</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
