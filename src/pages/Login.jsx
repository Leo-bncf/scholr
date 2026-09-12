import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Lock } from 'lucide-react';
import { signInWithPassword, signInWithGoogle, isAuthenticated, getEnabledProviders } from '@/data/session';

/**
 * Sign in.
 *
 * base44 hosted its own login page and its SDK redirected there, so this app
 * never had one. After the migration `redirectToLogin()` pointed at
 * /FirstLogin, which is post-login onboarding and bounces anonymous visitors
 * back to `/` — an unbreakable loop with no way to authenticate. This is that
 * missing page.
 *
 * Signups are disabled (Scholr is invite-only), so there is deliberately no
 * "create an account" link — people arrive here from an invitation.
 */
/** Google's 'G'. Brand marks aren't in lucide, and their colours are fixed. */
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next') || '/AppHome';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  // Someone already signed in has no business on this page.
  useEffect(() => {
    isAuthenticated()
      .then((authed) => (authed ? navigate(next, { replace: true }) : setChecking(false)))
      .catch(() => setChecking(false));
  }, [navigate, next]);

  // Only offer Google if GoTrue actually has it configured — otherwise the
  // button would send people to an error page.
  useEffect(() => {
    getEnabledProviders().then((p) => setGoogleEnabled(!!p.google));
  }, []);

  const handleGoogle = async () => {
    setError(null);
    try {
      // Google returns to the app, which then resumes the intended route.
      await signInWithGoogle(`${window.location.origin}${next}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signInWithPassword(email.trim(), password);
      navigate(next, { replace: true });
    } catch (err) {
      // GoTrue says "Invalid login credentials" for both a wrong password and
      // an unknown address, deliberately — don't elaborate on which.
      setError(
        /invalid/i.test(err.message)
          ? 'That email and password combination is not recognised.'
          : err.message,
      );
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/brand/scholr-mark.png" alt="" className="w-12 h-12 mx-auto mb-4 rounded-xl" />
          <h1 className="text-2xl font-bold text-slate-900">Sign in to Scholr</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5"
              placeholder="you@school.org"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5"
            />
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={submitting} className="w-full h-11">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>

          {googleEnabled && (
            <>
              <div className="flex items-center gap-3 pt-1">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-xs uppercase tracking-wide text-slate-400">or</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogle}
                className="w-full h-11 gap-2"
              >
                <GoogleMark />
                Continue with Google
              </Button>
            </>
          )}

          <div className="text-center pt-1">
            <Link to="/PasswordReset" className="text-sm text-indigo-600 hover:underline">
              Forgot your password?
            </Link>
          </div>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Scholr is invite-only. Ask your school administrator for access.
        </p>
      </div>
    </div>
  );
}
