import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { Shield, ArrowRight, AlertCircle, Check, Loader2 } from 'lucide-react';
import { LODHandlingStrategy } from '@metalsense/shared';

export function SignupPage() {
  const { signupWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next') || '/app';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [defaultStandard, setDefaultStandard] = useState('BIS_10500_2012');
  const [defaultLodStrategy, setDefaultLodStrategy] = useState<LODHandlingStrategy>('half_lod');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    let score = 0;
    if (password.length >= 10) score += 1;
    if (password.length >= 14) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score; // 0 to 5
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 10) {
      setError('Password must be at least 10 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      await signupWithEmail(
        name,
        email,
        password,
        workspaceName.trim() || undefined,
        defaultStandard,
        defaultLodStrategy
      );
      navigate(next, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Signup failed.');
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
      setError(err.message || 'Google signup failed.');
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
        <h1 className="text-3xl font-extrabold text-[#0F1F17] tracking-tight">Create your workspace</h1>
        <p className="mt-2 text-sm text-[#4B5F54]">
          Already have an account?{' '}
          <Link to={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-[#002F18] hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <div className="bg-[#ECF5EB] py-8 px-6 sm:px-10 shadow-[0_8px_30px_rgba(0,47,24,0.06)] rounded-[28px] border border-[#DFEADD]">
          {error && (
            <div className="mb-6 p-4 rounded-[20px] bg-[#FBE3E1] border border-[#F5C2BF] flex items-start gap-3 text-sm text-[#C2413B]">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-[#4B5F54] mb-1.5 ml-1">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Maya Sen"
                className="w-full px-5 py-3 rounded-full bg-[#F0FCEF] border border-[#DDEBDB] text-[#0F1F17] placeholder-[#7C8F84] text-sm focus:outline-none focus:ring-2 focus:ring-[#002F18] transition-all"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[#4B5F54] mb-1.5 ml-1">
                Work Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="maya@water-council.gov"
                className="w-full px-5 py-3 rounded-full bg-[#F0FCEF] border border-[#DDEBDB] text-[#0F1F17] placeholder-[#7C8F84] text-sm focus:outline-none focus:ring-2 focus:ring-[#002F18] transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-[#4B5F54] mb-1.5 ml-1">
                Password (min 10 characters)
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-5 py-3 rounded-full bg-[#F0FCEF] border border-[#DDEBDB] text-[#0F1F17] placeholder-[#7C8F84] text-sm focus:outline-none focus:ring-2 focus:ring-[#002F18] transition-all"
              />
              {password.length > 0 && (
                <div className="mt-2 px-1">
                  <div className="flex gap-1 h-1.5 w-full bg-[#DDEBDB] rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        passwordStrength <= 2
                          ? 'w-1/3 bg-[#C2413B]'
                          : passwordStrength <= 3
                          ? 'w-2/3 bg-[#B7791F]'
                          : 'w-full bg-[#1F8A5B]'
                      }`}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-[#7C8F84] mt-1">
                    <span>
                      {passwordStrength <= 2 ? 'Weak' : passwordStrength <= 3 ? 'Medium' : 'Strong'}
                    </span>
                    <span>{password.length}/10 chars minimum</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[#DFEADD]">
              <label htmlFor="workspaceName" className="block text-xs font-semibold uppercase tracking-wider text-[#4B5F54] mb-1.5 ml-1">
                Workspace Name (Optional)
              </label>
              <input
                id="workspaceName"
                name="workspaceName"
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="e.g. Northern Aquifer Monitoring Lab"
                className="w-full px-5 py-3 rounded-full bg-[#F0FCEF] border border-[#DDEBDB] text-[#0F1F17] placeholder-[#7C8F84] text-sm focus:outline-none focus:ring-2 focus:ring-[#002F18] transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B5F54] mb-1 ml-1">
                  Default Standard
                </label>
                <select
                  value={defaultStandard}
                  onChange={(e) => setDefaultStandard(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full bg-[#F0FCEF] border border-[#DDEBDB] text-[#0F1F17] text-xs focus:outline-none focus:ring-2 focus:ring-[#002F18]"
                >
                  <option value="BIS_10500_2012">IS 10500:2012 (India)</option>
                  <option value="WHO_GDWQ_4TH">WHO GDWQ 4th Ed.</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B5F54] mb-1 ml-1">
                  LOD Strategy
                </label>
                <select
                  value={defaultLodStrategy}
                  onChange={(e) => setDefaultLodStrategy(e.target.value as LODHandlingStrategy)}
                  className="w-full px-4 py-2.5 rounded-full bg-[#F0FCEF] border border-[#DDEBDB] text-[#0F1F17] text-xs focus:outline-none focus:ring-2 focus:ring-[#002F18]"
                >
                  <option value="half_lod">EPA 0.5 × LOD (Standard)</option>
                  <option value="zero">Zero Substitution</option>
                  <option value="full_lod">Conservative Full LOD</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 py-3.5 px-6 rounded-full bg-[#002F18] hover:bg-[#0B4A2C] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Create Account & Workspace</span>
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
                onError={() => setError('Google sign-up failed.')}
                shape="pill"
                theme="outline"
                text="signup_with"
                width="320"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
