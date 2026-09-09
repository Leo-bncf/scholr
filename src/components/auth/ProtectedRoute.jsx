import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import AccountStateRouter from './AccountStateRouter';

/**
 * Protected route wrapper that ensures user is authenticated
 * and account is in proper state before allowing access
 */
export default function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authed = await isAuthenticated();
        setIsAuthenticated(authed);
        
        if (!authed) {
          navigate('/');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
        navigate('/');
      }
    };

    checkAuth();
  }, [navigate]);

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AccountStateRouter redirectOnIssue={true}>
      {children}
    </AccountStateRouter>
  );
}