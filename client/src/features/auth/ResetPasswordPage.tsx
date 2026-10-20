import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 10) {
      setError('New password must be at least 10 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Password reset failed.');
      }
      setSuccess(true);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Password reset failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E9F4EA] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-[#002F18] selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#002F18] flex items-center justify-center text-white shadow-sm">
            <Shield className="w-5 h-5 text-[#E9F4EA]" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-[#0F1F17]">MetalSense</span>
        </Link>
        <h1 className="text-3xl font-extrabold text-[#0F1F17] tracking-tight">Set a new password</h1>
        <p className="mt-2 text-sm text-[#4B5F54]">
          Choose a secure password of at least 10 characters.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-[#ECF5EB] py-8 px-6 sm:px-10 shadow-[0_8px_30px_rgba(0,47,24,0.06)] rounded-[28px] border border-[#DFEADD]">
          {error && (
            <div className="mb-6 p-4 rounded-[20px] bg-[#FBE3E1] border border-[#F5C2BF] flex items-start gap-3 text-sm text-[#C2413B]">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-[20px] bg-[#DDF3E6] border border-[#BCE8CD] flex items-start gap-3 text-sm text-[#1F8A5B]">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <span>Password successfully reset! Redirecting to sign in...</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-[#4B5F54] mb-1.5 ml-1">
                New Password (min 10 characters)
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-5 py-3 rounded-full bg-[#F0FCEF] border border-[#DDEBDB] text-[#0F1F17] placeholder-[#7C8F84] text-sm focus:outline-none focus:ring-2 focus:ring-[#002F18] transition-all"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-[#4B5F54] mb-1.5 ml-1">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-5 py-3 rounded-full bg-[#F0FCEF] border border-[#DDEBDB] text-[#0F1F17] placeholder-[#7C8F84] text-sm focus:outline-none focus:ring-2 focus:ring-[#002F18] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || success}
              className="w-full mt-4 py-3.5 px-6 rounded-full bg-[#002F18] hover:bg-[#0B4A2C] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Update Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
