import React, { useState } from 'react';
import { Shield, CheckCircle2, User, Key, X, LogIn } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from './AuthContext';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const { loginAsDevUser, loginWithGoogle, isLoading } = useAuth();
  const [googleTokenInput, setGoogleTokenInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDevLogin = async (email: string, name: string, role: 'owner' | 'editor' | 'viewer') => {
    setError(null);
    try {
      await loginAsDevUser(email, name, role);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  const handleGoogleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleTokenInput.trim()) return;
    setError(null);
    try {
      await loginWithGoogle(googleTokenInput.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google token validation failed on server.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-950 border border-teal-600/40 text-teal-400">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Sign In to MetalSense</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-rose-950/50 border border-rose-800 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Quick Staging & Test Personas */}
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Select Persona (RBAC Test Accounts)
          </span>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => handleDevLogin('dr.sharma@aquifer.org', 'Dr. V. Sharma', 'owner')}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 hover:border-teal-500/50 transition-all text-left"
            >
              <div>
                <div className="text-xs font-bold text-white">Dr. V. Sharma</div>
                <div className="text-[11px] text-slate-400">Principal Hydrologist</div>
              </div>
              <Badge variant="cyan" size="sm">OWNER</Badge>
            </button>

            <button
              type="button"
              onClick={() => handleDevLogin('analyst.patel@lab.org', 'P. Patel', 'editor')}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 hover:border-teal-500/50 transition-all text-left"
            >
              <div>
                <div className="text-xs font-bold text-white">P. Patel</div>
                <div className="text-[11px] text-slate-400">Laboratory Analyst</div>
              </div>
              <Badge variant="safe" size="sm">EDITOR</Badge>
            </button>

            <button
              type="button"
              onClick={() => handleDevLogin('auditor.nair@cpcb.gov.in', 'S. Nair', 'viewer')}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 hover:border-teal-500/50 transition-all text-left"
            >
              <div>
                <div className="text-xs font-bold text-white">S. Nair</div>
                <div className="text-[11px] text-slate-400">Compliance Auditor (Read-only)</div>
              </div>
              <Badge variant="unverified" size="sm">VIEWER</Badge>
            </button>
          </div>
        </div>

        {/* Google OAuth ID Token Input */}
        <div className="pt-2 border-t border-slate-800">
          <form onSubmit={handleGoogleTokenSubmit} className="space-y-2">
            <label className="block text-xs font-medium text-slate-300">
              Live Google OAuth ID Token (Backend Verified)
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Paste Google JWT id_token..."
                value={googleTokenInput}
                onChange={(e) => setGoogleTokenInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-mono"
              />
              <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
                Verify
              </Button>
            </div>
            <p className="text-[10px] text-slate-500">
              Tokens are verified server-side with <code className="text-slate-400">google-auth-library</code>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
