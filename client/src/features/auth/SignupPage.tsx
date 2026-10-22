import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { Shield, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { LODHandlingStrategy } from '@metalsense/shared';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';

export function SignupPage() {
  const { signupWithEmail, loginWithGoogle, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next') || '/app';

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(next, { replace: true });
    }
  }, [isAuthenticated, navigate, next]);

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
    <div className="min-h-screen bg-page flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-forest-900 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-full bg-forest-900 flex items-center justify-center text-white shadow-sm">
            <Shield className="w-5 h-5 text-page" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-title">Metal Sense</span>
        </Link>
        <h1 className="text-3xl font-extrabold text-title tracking-tight">Create your workspace</h1>
        <p className="mt-2 text-sm text-body">
          Already have an account?{' '}
          <Link to={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-forest-900 hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <div className="bg-card py-8 px-6 sm:px-10 shadow-soft rounded-card border border-inset">
          {error && (
            <div className="mb-6 p-4 rounded-panel bg-status-critical-bg border border-status-critical-border flex items-start gap-3 text-sm text-status-critical">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-body mb-1.5 ml-1">
                Full Name
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Maya Sen"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-body mb-1.5 ml-1">
                Work Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="maya@water-council.gov"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-body mb-1.5 ml-1">
                Password (min 10 characters)
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
              />
              {password.length > 0 && (
                <div className="mt-2 px-1">
                  <div className="flex gap-1 h-1.5 w-full bg-pill-unselected rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        passwordStrength <= 2
                          ? 'w-1/3 bg-status-critical'
                          : passwordStrength <= 3
                          ? 'w-2/3 bg-status-warning'
                          : 'w-full bg-status-safe'
                      }`}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-caption mt-1">
                    <span>
                      {passwordStrength <= 2 ? 'Weak' : passwordStrength <= 3 ? 'Medium' : 'Strong'}
                    </span>
                    <span>{password.length}/10 chars minimum</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-inset">
              <label htmlFor="workspaceName" className="block text-xs font-semibold uppercase tracking-wider text-body mb-1.5 ml-1">
                Workspace Name (Optional)
              </label>
              <Input
                id="workspaceName"
                name="workspaceName"
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="e.g. Northern Aquifer Monitoring Lab"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-body mb-1 ml-1">
                  Default Standard
                </label>
                <Select
                  value={defaultStandard}
                  onChange={(e) => setDefaultStandard(e.target.value)}
                  className="text-xs"
                >
                  <option value="BIS_10500_2012">IS 10500:2012 (India)</option>
                  <option value="WHO_GDWQ_4TH">WHO GDWQ 4th Ed.</option>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-body mb-1 ml-1">
                  LOD Strategy
                </label>
                <Select
                  value={defaultLodStrategy}
                  onChange={(e) => setDefaultLodStrategy(e.target.value as LODHandlingStrategy)}
                  className="text-xs"
                >
                  <option value="half_lod">EPA 0.5 × LOD (Standard)</option>
                  <option value="zero">Zero Substitution</option>
                  <option value="full_lod">Conservative Full LOD</option>
                </Select>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 h-11"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Create Account & Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-inset" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-caption font-medium">Or continue with</span>
              </div>
            </div>

            <div className="mt-5 flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() =>
                  setError(
                    'Google sign-up could not be completed. If testing locally, ensure "http://localhost:5173" is added to Authorized JavaScript Origins in your Google Cloud Console OAuth 2.0 Client credentials.'
                  )
                }
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
