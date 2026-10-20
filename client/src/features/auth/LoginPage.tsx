import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { Shield, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export function LoginPage() {
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next') || '/app';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await loginWithEmail(email, password);
      navigate(next, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;
    setError(null);
    setIsLoading(true);
    try {
      await loginWithGoogle(credentialResponse.credential);
      navigate(next, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed.');
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
        <h1 className="text-3xl font-extrabold text-[#0F1F17] tracking-tight">Sign in to your account</h1>
        <p className="mt-2 text-sm text-[#4B5F54]">
          Or{' '}
          <Link to={`/signup?next=${encodeURIComponent(next)}`} className="font-semibold text-[#002F18] hover:underline">
            create a new workspace for free
          </Link>
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

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[#4B5F54] mb-1.5 ml-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@laboratory.org"
                className="w-full px-5 py-3 rounded-full bg-[#F0FCEF] border border-[#DDEBDB] text-[#0F1F17] placeholder-[#7C8F84] text-sm focus:outline-none focus:ring-2 focus:ring-[#002F18] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 ml-1">
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-[#4B5F54]">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-[#002F18] hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-5 py-3 rounded-full bg-[#F0FCEF] border border-[#DDEBDB] text-[#0F1F17] placeholder-[#7C8F84] text-sm focus:outline-none focus:ring-2 focus:ring-[#002F18] focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-full bg-[#002F18] hover:bg-[#0B4A2C] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#DDEBDB]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#ECF5EB] px-3 text-[#7C8F84] font-medium">Or continue with</span>
              </div>
            </div>

            <div className="mt-5 flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() =>
                  setError(
                    'Google sign-in could not be completed. If testing locally, ensure "http://localhost:5173" is added to Authorized JavaScript Origins in your Google Cloud Console OAuth 2.0 Client credentials.'
                  )
                }
                shape="pill"
                theme="outline"
                text="continue_with"
                width="320"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
