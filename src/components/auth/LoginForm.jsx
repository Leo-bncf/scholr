import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { redirectToLogin } from '@/data/session';

/**
 * Login form with account state handling
 * Tracks login attempts and provides clear feedback
 */
export default function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Attempt login via Base44 auth
      await redirectToLogin(`${window.location.origin}/first-login`);
      
      // If we get here, login was successful
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      
      // Provide user-friendly error messages
      if (err.message?.includes('account not found') || err.message?.includes('invalid')) {
        setError('Email or password is incorrect. Please try again.');
      } else if (err.message?.includes('suspended')) {
        setError('Your account has been suspended. Please contact your administrator.');
        navigate('/account-state?issue=suspended');
      } else if (err.message?.includes('locked')) {
        setError('Your account is temporarily locked. Please reset your password.');
        navigate('/password-reset');
      } else {
        setError('An error occurred while logging in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <Label className="text-sm font-semibold mb-1 block">Email</Label>
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>

      <div>
        <Label className="text-sm font-semibold mb-1 block">Password</Label>
        <Input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          required
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
        disabled={isLoading}
        className="w-full bg-indigo-600 hover:bg-indigo-700"
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        {isLoading ? 'Signing In...' : 'Sign In'}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => navigate('/password-reset')}
          className="text-indigo-600 hover:text-indigo-700 font-semibold"
        >
          Forgot password?
        </button>
      </div>
    </form>
  );
}