import React, { useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUser } from '@/components/auth/UserContext';
import { redirectToLogin } from '@/data/session';
import * as fns from '@/data/functions';

const errorMessages = {
  token_expired: {
    title: 'Connection Expired',
    message: 'Your Google connection has expired. Please reconnect to continue.',
    action: 'Reconnect Google'
  },
  access_denied: {
    title: 'Access Denied',
    message: 'You denied access to Google Drive. Please reconnect and allow access.',
    action: 'Reconnect Google'
  },
  invalid_grant: {
    title: 'Connection Invalid',
    message: 'Your Google connection is no longer valid. Please reconnect.',
    action: 'Reconnect Google'
  },
  revoked: {
    title: 'Access Revoked',
    message: 'You have revoked access to Google Drive. Please reconnect.',
    action: 'Reconnect Google'
  },
  scope_mismatch: {
    title: 'Insufficient Permissions',
    message: 'Your Google connection does not have the required permissions. Please reconnect.',
    action: 'Reconnect Google'
  },
  network_error: {
    title: 'Connection Error',
    message: 'Unable to reach Google. Please check your internet connection and try again.',
    action: 'Retry'
  },
  unknown: {
    title: 'Connection Issue',
    message: 'An error occurred while connecting to Google. Please try again.',
    action: 'Retry'
  }
};

export default function GoogleActionGuard({ 
  schoolId, 
  actionType, 
  children, 
  onConnectionRequired,
  onError,
  fallbackUI 
}) {
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    checkConnection();
  }, [schoolId]);

  const checkConnection = async () => {
    try {
      const response = await fns.invoke('verifyGoogleConnection', {
        schoolId,
        userId: user?.id
      });
      setConnectionStatus(response);

      if (response.requiresReconnection || response.requiresConnection) {
        setShowDialog(true);
        onConnectionRequired?.(response);
      }
    } catch (error) {
      console.error('Connection check failed:', error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReconnect = async () => {
    try {
      setLoading(true);
      await redirectToLogin();
    } catch (error) {
      console.error('Reconnection failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (connectionStatus?.requiresReconnection || connectionStatus?.requiresConnection) {
    const errorConfig = errorMessages[connectionStatus.errorCode] || errorMessages.unknown;

    return (
      <>
        <Alert className="bg-amber-50 border-amber-200 mb-4">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <AlertDescription className="text-amber-800 ml-3">
            <div className="font-semibold">{errorConfig.title}</div>
            <div className="text-sm text-amber-700 mt-1">{errorConfig.message}</div>
          </AlertDescription>
        </Alert>

        {fallbackUI ? (
          fallbackUI
        ) : (
          <Button 
            onClick={handleReconnect} 
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {errorConfig.action}
          </Button>
        )}

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{errorConfig.title}</DialogTitle>
              <DialogDescription>
                {errorConfig.message}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleReconnect}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {errorConfig.action}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (connectionStatus?.status !== 'connected') {
    return (
      fallbackUI || (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-800 ml-3">
            <p className="font-semibold">Google Connection Required</p>
            <p className="text-sm text-blue-700 mt-2">
              Connect your Google account to {actionType || 'use this feature'}.
            </p>
          </AlertDescription>
        </Alert>
      )
    );
  }

  return children;
}