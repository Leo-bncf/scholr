/**
 * Role Selector Component
 * Simplified role selection UI for user management
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getAllRoles } from '@/components/auth/PermissionsModule';
import { Shield } from 'lucide-react';

export default function RoleSelector({ value, onChange, disabled = false }) {
  const roles = getAllRoles();

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-slate-900">
        User Role
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => !disabled && onChange(role.id)}
            disabled={disabled}
            className={`p-4 border-2 rounded-lg text-left transition ${
              value === role.id
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-slate-200 bg-white hover:border-indigo-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-slate-900">
                  {role.name}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  {role.description}
                </p>
              </div>
              {value === role.id && (
                <Shield className="w-5 h-5 text-indigo-600 flex-shrink-0" />
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Badge
                className={
                  value === role.id
                    ? 'bg-indigo-600'
                    : 'bg-slate-200 text-slate-800'
                }
              >
                {role.permissionCount} permissions
              </Badge>
              {role.isCustom && (
                <Badge variant="outline">Custom</Badge>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}