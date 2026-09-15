import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { AuthCard, AuthField, AuthError, AuthNote, AuthSubmit } from '@/components/public/AuthCard';
import { requestPasswordReset } from '@/data/session';

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
  const [token] = useState(searchParams.get('token'));
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // If token is present, skip to reset step
    if (token) {
      setStep('reset');
    }
  }, [token]);

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
      await setPassword(password);
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
            If <strong style={{ color: 'var(--ink)' }}>{email}</strong> has an account, a reset link is
            on its way. It expires in an hour.
          </p>
          <AuthNote>
            Nothing arrived? Check spam, then send another — links are single-use, so an old one in
            your inbox will not work.
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
          <button
            type="button"
            onClick={() => navigate('/Login')}
            className="pub-btn pub-btn-primary scholr-focus w-full justify-center"
          >
            Sign in
          </button>
        </div>
      )}
    </AuthCard>
  );
}
