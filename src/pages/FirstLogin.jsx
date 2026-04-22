import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, User, Lock, FileText } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

/**
 * First login onboarding experience
 * Guides user through profile completion, password setup, and welcomes them
 */
export default function FirstLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [accountState, setAccountState] = useState(null);
  const [currentStep, setCurrentStep] = useState('welcome');
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Profile form state
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  // Only refresh an EXISTING membership's display fields — never create one here.
  // Creating memberships is the responsibility of the invitation flow (acceptInvitation function).
  // Creating on first-login was causing blank "ghost" user rows to appear in the
  // school admin directory when a user landed here without a valid invitation.
  const ensureSchoolMembership = async (currentUser, state) => {
    if (!state?.school_id || !state?.role) return;
    if (!currentUser?.full_name || !currentUser?.email) return; // guard against blank rows

    const memberships = await base44.entities.SchoolMembership.filter({
      user_id: currentUser.id,
      school_id: state.school_id,
    });

    if (memberships.length === 0) return; // no membership = user was not properly invited; do nothing

    await base44.entities.SchoolMembership.update(memberships[0].id, {
      user_email: currentUser.email,
      user_name: currentUser.full_name,
      role: state.role,
      status: 'active',
    });

    if (currentUser.active_school_id !== state.school_id) {
      await base44.auth.updateMe({ active_school_id: state.school_id });
    }
  };

  useEffect(() => {
    const initializeFirstLogin = async () => {
      try {
        const authed = await base44.auth.isAuthenticated();
        if (!authed) {
          navigate('/');
          return;
        }

        const currentUser = await base44.auth.me();
        setUser(currentUser);

        // Get account state
        const states = await base44.entities.AccountState.filter({
          user_id: currentUser.id
        });

        if (states.length > 0) {
          setAccountState(states[0]);
          await ensureSchoolMembership(currentUser, states[0]);
          
          // Determine next step based on account state
          if (!states[0].password_set_at && states[0].account_status !== 'active') {
            setCurrentStep('set_password');
          } else if (!states[0].profile_completed) {
            setCurrentStep('complete_profile');
          } else {
            setCurrentStep('welcome');
          }
        } else {
          setCurrentStep('welcome');
        }

        setLoading(false);
      } catch (err) {
        console.error('Error initializing first login:', err);
        setError('Failed to load your account');
        setLoading(false);
      }
    };

    initializeFirstLogin();
  }, [navigate]);

  const handleSetPassword = async () => {
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
      await base44.auth.updateMe({ password });
      
      // Update account state
      if (accountState) {
        await base44.entities.AccountState.update(accountState.id, {
          password_set_at: new Date().toISOString(),
          account_status: 'active'
        });
      }

      setCurrentStep('complete_profile');
      setError(null);
    } catch (err) {
      console.error('Error setting password:', err);
      setError(err.message || 'Failed to set password');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteProfile = async () => {
    setIsProcessing(true);
    try {
      await base44.auth.updateMe({
        phone: phone || undefined,
        bio: bio || undefined
      });

      // Update account state
      if (accountState) {
        await base44.entities.AccountState.update(accountState.id, {
          profile_completed: true,
          onboarding_step: 'complete'
        });
      }

      setCurrentStep('complete');
      setError(null);
    } catch (err) {
      console.error('Error completing profile:', err);
      setError(err.message || 'Failed to save profile');
    } finally {
      setIsProcessing(false);
    }
  };

  const navigateToDashboard = () => {
    // Route based on user role from accountState
    if (!accountState) {
      navigate('/');
      return;
    }

    const routes = {
      school_admin: '/school-admin-dashboard',
      ib_coordinator: '/coordinator-dashboard',
      teacher: '/teacher-dashboard',
      student: '/student-dashboard',
      parent: '/parent-dashboard',
    };

    const targetRoute = routes[accountState.role] || '/';
    navigate(targetRoute);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-center font-semibold text-slate-900 mb-2">Error</p>
            <p className="text-center text-sm text-slate-600 mb-6">{error}</p>
            <Button onClick={() => navigate('/')} className="w-full">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Progress steps
  const steps = ['set_password', 'complete_profile', 'complete'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = currentStep === 'welcome' ? 0 : ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        {currentStep === 'welcome' && (
         <>
           <CardHeader>
             <CardTitle className="text-center">Welcome to the Platform</CardTitle>
           </CardHeader>
           <CardContent className="space-y-6">
             <div className="flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mx-auto">
               <CheckCircle className="w-8 h-8 text-indigo-600" />
             </div>

             <div className="text-center space-y-2">
               <p className="text-lg font-semibold text-slate-900">
                 Welcome, {user?.full_name}!
               </p>
               <p className="text-sm text-slate-600">
                 Your account has been created and is ready to use.
               </p>
             </div>

             {accountState && (
               <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
                 <div>
                   <p className="text-xs font-semibold text-slate-600 uppercase">School</p>
                   <p className="text-slate-900 mt-1">{accountState.school_name}</p>
                 </div>
                 <div>
                   <p className="text-xs font-semibold text-slate-600 uppercase">Your Role</p>
                   <p className="text-slate-900 mt-1 capitalize">
                     {accountState.role.replace(/_/g, ' ')}
                   </p>
                 </div>
               </div>
             )}

             <Button
               onClick={navigateToDashboard}
               className="w-full bg-indigo-600 hover:bg-indigo-700"
             >
               Go to Dashboard
             </Button>
           </CardContent>
         </>
        )}

        {currentStep === 'set_password' && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Secure Your Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-800 text-sm">
                  Please create a strong password to secure your account.
                </AlertDescription>
              </Alert>

              <div>
                <Label className="text-sm font-semibold mb-1 block">Password</Label>
                <Input
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="text-xs text-slate-600 mt-1">
                  Use a mix of uppercase, lowercase, numbers, and symbols for security.
                </p>
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
                onClick={handleSetPassword}
                disabled={isProcessing}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {isProcessing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Continue
              </Button>
            </CardContent>
          </>
        )}

        {currentStep === 'complete_profile' && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Complete Your Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-800 text-sm">
                  Help your school community know you better. Fields marked optional can be filled anytime.
                </AlertDescription>
              </Alert>

              <div>
                <Label className="text-sm font-semibold mb-1 block">Phone (Optional)</Label>
                <Input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div>
                <Label className="text-sm font-semibold mb-1 block">About You (Optional)</Label>
                <Textarea
                  placeholder="Tell us about yourself, your interests, or your role..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
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

              <div className="space-y-2">
                <Button
                  onClick={handleCompleteProfile}
                  disabled={isProcessing}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {isProcessing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Complete Setup
                </Button>
                <Button
                  onClick={() => setCurrentStep('complete')}
                  variant="outline"
                  className="w-full"
                >
                  Skip for Now
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {currentStep === 'complete' && (
          <>
            <CardHeader>
              <CardTitle className="text-center">All Set!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mx-auto">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>

              <div className="text-center space-y-2">
                <p className="text-lg font-semibold text-slate-900">You're Ready!</p>
                <p className="text-sm text-slate-600">
                  Your account is fully set up and ready to use. Welcome aboard!
                </p>
              </div>

              <Button
                onClick={navigateToDashboard}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </>
        )}

        {/* Progress bar */}
        {currentStep !== 'welcome' && (
          <div className="px-6 pb-4">
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}