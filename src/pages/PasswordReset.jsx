import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { AuthCard, AuthField, AuthError, AuthNote, AuthSubmit } from '@/components/public/AuthCard';
import { requestPasswordReset, setPassword as updatePassword, onAuthChange } from '@/data/session';

/**
 * Password reset.
 *
 * Four steps in one component: ask for the address, confirm it was sent, take
 * the new password, confirm it changed. It sits in the same split shell as
 * sign-in — it is linked directly from there, and a user who follows "forgot
 * your password?" should not feel like they have left the product.
 */
export default function PasswordReset() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [step, setStep] = useState('request'); // request, reset, success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  /* Arriving from the emailed link.
   *
   * This looked for a base44-style `?token=`, which a Supabase link never
   * carries — it lands with `#…type=recovery` (or a `?code=` it exchanges),
   * and the client then announces PASSWORD_RECOVERY. So the link opened the
   * "enter your email" form again and a reset could never be finished. */
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    if (hash.get('error_description') || searchParams.get('error_description')) {
      setError('That reset link has expired or was already used. Send yourself a new one below.');
      return undefined;
    }
    if (hash.get('type') === 'recovery' || searchParams.get('type') === 'recovery') setStep('reset');
    return onAuthChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setStep('reset');
    });
  }, [searchParams]);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      // GoTrue sends the recovery email and owns the token; the link returns
      // the user here with a recovery session already established.
      await requestPasswordReset(email, `${window.location.origin}/PasswordReset`);
      setStep('sent');
      setError(null);
    } catch (err) {
      console.error('Error requesting reset:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== passwordConfirm) {
      setError('Passwords do not match');
      return;
    }

    setIsProcessing(true);
    try {
      // `updatePassword`, not `setPassword`: inside this component that name
      // is the state setter for the input, and calling it "saved" nothing —
      // the page said "password changed" while the old one still worked.
      await updatePassword(password);
      setStep('success');
      setError(null);
    } catch (err) {
      console.error('Error resetting password:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const TITLES = {
    request: 'Reset your password',
    sent: 'Check your email',
    reset: 'Choose a new password',
    success: 'Password changed',
  };
  const SUBTITLES = {
    request: "Enter the address you sign in with and we'll send you a link.",
    sent: null,
    reset: 'At least eight characters. Pick something you have not used elsewhere.',
    success: null,
  };

  return (
    <AuthCard title={TITLES[step]} subtitle={SUBTITLES[step]}>
      {step === 'request' && (
        <form onSubmit={handleRequestReset} className="flex flex-col gap-4">
          <AuthField id="reset-email" label="Email">
            <input
              id="reset-email"
              type="email"
              autoComplete="username"
              placeholder="you@school.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </AuthField>

          {error && <AuthError>{error}</AuthError>}

          <AuthSubmit busy={loading}>Send the link</AuthSubmit>

          <p className="m-0 text-center text-sm">
            <button
              type="button"
              onClick={() => navigate('/Login')}
              className="scholr-focus"
              style={{ background: 'none', border: 'none', font: 'inherit', color: 'var(--brand)', cursor: 'pointer' }}
            >
              Back to sign in
            </button>
          </p>
        </form>
      )}

      {step === 'sent' && (
        <div className="flex flex-col gap-4">
          <p className="m-0 text-sm" style={{ color: 'var(--body)', lineHeight: 'var(--lh-body)' }}>
            If an account uses <strong style={{ color: 'var(--ink)' }}>{email}</strong>, a reset link is
            on its way from noreply@scholr.pro. It works once and expires in an hour.
          </p>
          <ol className="m-0 text-sm" style={{ color: 'var(--body)', lineHeight: 'var(--lh-body)', paddingLeft: '1.1rem' }}>
            <li>Open the email and select <strong style={{ color: 'var(--ink)' }}>Reset password</strong>.</li>
            <li>Choose a new password on the page it opens.</li>
            <li>You're signed in — use the new password from then on.</li>
          </ol>
          <AuthNote>
            Nothing within a few minutes? Check spam, and make sure this is the address you sign in
            with. If you sign in with Google, use “Continue with Google” instead — there is no Scholr
            password to reset. Scholr accounts are created by your school, so if you were never
            invited, ask your school's administrator.
          </AuthNote>
          <button
            type="button"
            onClick={() => setStep('request')}
            className="pub-btn pub-btn-line scholr-focus w-full justify-center"
          >
            Send another
          </button>
          <p className="m-0 text-center text-sm">
            <button
              type="button"
              onClick={() => navigate('/Login')}
              className="scholr-focus"
              style={{ background: 'none', border: 'none', font: 'inherit', color: 'var(--brand)', cursor: 'pointer' }}
            >
              Back to sign in
            </button>
          </p>
        </div>
      )}

      {step === 'reset' && (
        <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
          <AuthField id="new-password" label="New password">
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isProcessing}
            />
          </AuthField>

          <AuthField id="confirm-password" label="Confirm it">
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              disabled={isProcessing}
            />
          </AuthField>

          {error && <AuthError>{error}</AuthError>}

          <AuthSubmit busy={isProcessing}>Change my password</AuthSubmit>
        </form>
      )}

      {step === 'success' && (
        <div className="flex flex-col gap-4">
          <p className="m-0 flex items-center gap-2 text-sm" style={{ color: 'var(--good)' }}>
            <CheckCircle className="w-4 h-4" />
            Done — your password has been changed.
          </p>
          {/* The recovery link already signed them in; send them in, not back
              to a sign-in form. */}
          <button
            type="button"
            onClick={() => navigate('/AppHome')}
            className="pub-btn pub-btn-primary scholr-focus w-full justify-center"
          >
            Continue to Scholr
          </button>
        </div>
      )}
    </AuthCard>
  );
}
