import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Shield, ArrowRight, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

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
      setError('Password must be at least 10 characters long.');
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
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Password reset failed.');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Password reset failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-page flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-forest-900 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-full bg-forest-900 flex items-center justify-center text-white shadow-sm">
            <Shield className="w-5 h-5 text-page" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-title">Metal Sense</span>
        </Link>
        <h1 className="text-3xl font-extrabold text-title tracking-tight">Set a new password</h1>
        <p className="mt-2 text-sm text-body">
          Choose a secure password of at least 10 characters.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-card py-8 px-6 sm:px-10 shadow-soft rounded-card border border-inset">
          {error && (
            <div className="mb-6 p-4 rounded-panel bg-status-critical-bg border border-status-critical-border flex items-start gap-3 text-sm text-status-critical">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-panel bg-status-safe-bg border border-status-safe-border flex items-start gap-3 text-sm text-status-safe">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <span>Password successfully reset! Redirecting to sign in...</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-body mb-1.5 ml-1">
                New Password (min 10 characters)
              </label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-body mb-1.5 ml-1">
                Confirm New Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || success}
              className="w-full mt-4 h-11"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Update Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
