import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import * as userInvitationsData from '@/data/userInvitations';
import * as usersData from '@/data/users';
import * as fns from '@/data/functions';

/**
 * Invitation acceptance page
 * User arrives here from email link with invitation token
 * Shows school/role context and prompts to accept or create account
 */
export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invitation, setInvitation] = useState(null);
  const [step, setStep] = useState('review'); // review, accept, create_account
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const token = searchParams.get('token');

  // Fetch invitation details
  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        if (!token) {
          setError('Invalid invitation link. Missing token.');
          setLoading(false);
          return;
        }

        const invitations = await userInvitationsData.where({
          invitation_token: token
        });

        if (!invitations || invitations.length === 0) {
          setError('This invitation link is invalid or has expired.');
          setLoading(false);
          return;
        }

        const inv = invitations[0];

        if (inv.status !== 'pending') {
          setError(`This invitation has already been ${inv.status}.`);
          setLoading(false);
          return;
        }

        // Check expiration
        if (new Date(inv.expires_at) < new Date()) {
          setError('This invitation has expired. Please ask your school administrator to send a new one.');
          setLoading(false);
          return;
        }

        setInvitation(inv);
        setEmail(inv.email);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching invitation:', err);
        setError('An error occurred while processing your invitation.');
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      // Check if user already exists
      const existingUsers = await usersData.where({ email });
      
      if (existingUsers.length > 0) {
        // User exists - just accept invitation and update their account state
        await userInvitationsData.update(invitation.id, {
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          user_id: existingUsers[0].id
        });

        // Create/update account state
        await fns.invoke('acceptInvitation', {
          invitation_id: invitation.id,
          token
        });

        navigate('/first-login?step=profile');
      } else {
        // New user - move to account creation
        setStep('create_account');
      }
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError(err.message || 'Failed to accept invitation');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateAccount = async () => {
    // Validate
    if (!firstName || !lastName) {
      setError('Please enter your full name');
      return;
    }

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
      // Create account via backend function
      // `email` is deliberately not sent: the account is created with the
      // invitation's address, so a token can only ever create the account it
      // was issued for.
      const result = await fns.invoke('createAccountFromInvitation', {
        password,
        first_name: firstName,
        last_name: lastName,
        invitation_token: token
      });

      if (result.success) {
        navigate('/first-login?step=welcome');
      } else {
        setError(result.error || 'Failed to create account');
      }
    } catch (err) {
      console.error('Error creating account:', err);
      setError(err.message || 'Failed to create account');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-center font-semibold text-slate-900 mb-2">Invitation Error</p>
            <p className="text-center text-sm text-slate-600 mb-6">{error}</p>
            <Button onClick={() => navigate('/')} className="w-full">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        {step === 'review' && (
          <>
            <CardHeader>
              <CardTitle className="text-center">You're Invited</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 mx-auto">
                <CheckCircle className="w-6 h-6 text-indigo-600" />
              </div>

              <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase">School</p>
                  <p className="text-lg font-semibold text-slate-900 mt-1">{invitation?.metadata?.school_name || 'School'}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase">Your Role</p>
                  <p className="text-lg font-semibold text-slate-900 mt-1 capitalize">
                    {invitation?.role.replace(/_/g, ' ')}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase">Email</p>
                  <p className="text-slate-900 mt-1">{email}</p>
                </div>
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
                onClick={handleAccept}
                disabled={isProcessing}
                className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2"
              >
                {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                Accept Invitation
              </Button>

              <p className="text-xs text-slate-600 text-center">
                By accepting, you agree to join {invitation?.metadata?.school_name}
              </p>
            </CardContent>
          </>
        )}

        {step === 'create_account' && (
          <>
            <CardHeader>
              <CardTitle>Create Your Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-800 text-sm">
                  Welcome to {invitation?.metadata?.school_name || 'your school'}. Please create your account to proceed.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-semibold mb-1 block">First Name</Label>
                  <Input
                    placeholder="First"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-1 block">Last Name</Label>
                  <Input
                    placeholder="Last"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold mb-1 block">Email</Label>
                <Input disabled value={email} className="bg-slate-100" />
              </div>

              <div>
                <Label className="text-sm font-semibold mb-1 block">Password</Label>
                <Input
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div>
                <Label className="text-sm font-semibold mb-1 block">Confirm Password</Label>
                <Input
                  type="password"
                  placeholder="Confirm password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
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
                onClick={handleCreateAccount}
                disabled={isProcessing}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {isProcessing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Create Account & Continue
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}