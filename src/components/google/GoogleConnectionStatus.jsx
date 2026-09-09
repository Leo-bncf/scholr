import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, LinkIcon, Clock, LogOut } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useUser } from '@/components/auth/UserContext';
import * as fns from '@/data/functions';

export default function GoogleConnectionStatus({ schoolId, userId, onReconnect, compact = false }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    verifyConnection();
  }, [schoolId, userId]);

  const verifyConnection = async () => {
    try {
      const response = await fns.invoke('verifyGoogleConnection', {
        schoolId,
        userId: userId || user?.id
      });
      setStatus(response);
    } catch (error) {
      console.error('Failed to verify Google connection:', error);
      setStatus({ status: 'error', message: 'Unable to check connection status' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;
  if (!status) return null;

  const isConnected = status.status === 'connected';
  const isExpired = status.status === 'expired';
  const requiresAction = status.requiresReconnection || status.requiresConnection;

  if (compact) {
    if (isConnected) {
      return (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span>Google connected</span>
        </div>
      );
    }
    if (requiresAction) {
      return (
        <div className="flex items-center gap-2 text-sm text-amber-600">
          <AlertCircle className="w-4 h-4" />
          <span>Google connection needed</span>
        </div>
      );
    }
    return null;
  }

  if (isConnected) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle className="w-4 h-4 text-green-600" />
        <AlertDescription className="text-green-800 ml-3">
          <div className="font-semibold">Google Connected</div>
          <div className="text-sm text-green-700 mt-1">
            {status.googleEmail} • Last verified {new Date(status.lastVerified).toLocaleDateString()}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (isExpired) {
    return (
      <Alert className="bg-amber-50 border-amber-200">
        <Clock className="w-4 h-4 text-amber-600" />
        <AlertDescription className="text-amber-800 ml-3">
          <div className="font-semibold">Google Connection Expired</div>
          <div className="text-sm text-amber-700 mt-1 mb-3">
            Your access to Google Drive has expired. Reconnect to continue using Google features.
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="bg-white border-amber-300 hover:bg-amber-50"
            onClick={() => onReconnect?.()}
          >
            <LinkIcon className="w-4 h-4 mr-2" />
            Reconnect Google
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (status.status === 'disconnected' || status.requiresConnection) {
    return (
      <Alert className="bg-blue-50 border-blue-200">
        <LinkIcon className="w-4 h-4 text-blue-600" />
        <AlertDescription className="text-blue-800 ml-3">
          <div className="font-semibold">Connect Your Google Account</div>
          <div className="text-sm text-blue-700 mt-1 mb-3">
            Connect Google Drive to create and submit documents directly in assignments.
          </div>
          <Button 
            size="sm" 
            variant="outline"
            className="bg-white border-blue-300 hover:bg-blue-50"
            onClick={() => onReconnect?.()}
          >
            <LinkIcon className="w-4 h-4 mr-2" />
            Connect Google
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (status.status === 'permission_denied' || status.status === 'revoked') {
    return (
      <Alert className="bg-red-50 border-red-200">
        <AlertCircle className="w-4 h-4 text-red-600" />
        <AlertDescription className="text-red-800 ml-3">
          <div className="font-semibold">Google Access Denied</div>
          <div className="text-sm text-red-700 mt-1 mb-3">
            {status.errorMessage || 'You have revoked access to Google Drive.'}
          </div>
          <Button 
            size="sm" 
            variant="outline"
            className="bg-white border-red-300 hover:bg-red-50"
            onClick={() => onReconnect?.()}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Reconnect
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}