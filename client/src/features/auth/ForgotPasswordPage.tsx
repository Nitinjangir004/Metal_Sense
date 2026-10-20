import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setStatusMessage(data.message);
      if (data.resetToken) {
        setResetToken(data.resetToken);
      }
    } catch (err: any) {
      setError(err.message || 'Request failed.');
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
        <h1 className="text-3xl font-extrabold text-title tracking-tight">Reset your password</h1>
        <p className="mt-2 text-sm text-body">
          Enter your email to receive password reset instructions.
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

          {statusMessage && (
            <div className="mb-6 p-4 rounded-panel bg-status-safe-bg border border-status-safe-border flex items-start gap-3 text-sm text-status-safe">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p>{statusMessage}</p>
                {resetToken && (
                  <div className="mt-3 pt-3 border-t border-status-safe-border text-xs">
                    <p className="font-semibold text-forest-900">Development Reset Shortcut:</p>
                    <Link
                      to={`/reset-password/${resetToken}`}
                      className="underline font-mono text-forest-900 break-all block mt-1"
                    >
                      Click here to reset your password &rarr;
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-body mb-1.5 ml-1">
                Account Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@laboratory.org"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest-900 hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to sign in</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
