import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, Lock } from 'lucide-react';
import { requestPasswordReset } from '@/data/session';

/**
 * Password reset page
 * User arrives with reset token from email
 * Allows secure password recovery
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        {step === 'request' && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-center">
                <Lock className="w-5 h-5" />
                Reset Password
              </CardTitle>
              <p className="text-sm text-slate-600 text-center mt-2">
                Enter your email and we'll send you a reset link
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold mb-1 block">Email Address</Label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>

                {error && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <AlertDescription className="text-red-800 ml-3 text-sm">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Send Reset Email
                </Button>

                <p className="text-xs text-slate-600 text-center">
                  Remember your password?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="text-indigo-600 hover:text-indigo-700 font-semibold"
                  >
                    Back to Login
                  </button>
                </p>
              </form>
            </CardContent>
          </>
        )}

        {step === 'sent' && (
          <>
            <CardHeader>
              <CardTitle className="text-center">Check Your Email</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mx-auto">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-slate-700">
                  We've sent a password reset email to:
                </p>
                <p className="font-semibold text-slate-900">{email}</p>
                <p className="text-xs text-slate-600 mt-2">
                  Click the link in the email to reset your password. The link expires in 1 hour.
                </p>
              </div>

              <Alert className="bg-amber-50 border-amber-200">
                <AlertDescription className="text-amber-800 text-sm">
                  Don't see the email? Check your spam folder or request a new link.
                </AlertDescription>
              </Alert>

              <Button
                onClick={() => setStep('request')}
                variant="outline"
                className="w-full"
              >
                Send Another Email
              </Button>

              <p className="text-xs text-slate-600 text-center">
                <button
                  onClick={() => navigate('/')}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  Back to Login
                </button>
              </p>
            </CardContent>
          </>
        )}

        {step === 'reset' && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-center">
                <Lock className="w-5 h-5" />
                Create New Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold mb-1 block">New Password</Label>
                  <Input
                    type="password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-1 block">Confirm Password</Label>
                  <Input
                    type="password"
                    placeholder="Confirm password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>

                {error && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <AlertDescription className="text-red-800 ml-3 text-sm">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {isProcessing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Reset Password
                </Button>
              </form>
            </CardContent>
          </>
        )}

        {step === 'success' && (
          <>
            <CardHeader>
              <CardTitle className="text-center">Password Reset Complete</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mx-auto">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>

              <div className="text-center space-y-2">
                <p className="text-slate-900 font-semibold">Your password has been reset!</p>
                <p className="text-sm text-slate-600">
                  You can now log in with your new password.
                </p>
              </div>

              <Button
                onClick={() => navigate('/')}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                Back to Login
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}