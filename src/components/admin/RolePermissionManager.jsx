/**
 * Role Permission Manager
 * UI for managing permissions and custom roles
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  RESOURCES,
  ACTIONS,
  DEFAULT_ROLES,
  getAllRoles,
} from '@/components/auth/PermissionsModule';
import { CheckCircle2, Shield, Plus } from 'lucide-react';

export default function RolePermissionManager() {
  const [selectedRole, setSelectedRole] = useState('teacher');
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState({});

  const roles = getAllRoles();
  const currentRole = DEFAULT_ROLES[selectedRole];

  const togglePermission = (resource, action) => {
    const key = `${resource}-${action}`;
    setSelectedPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getPermissionsForRole = (roleId) => {
    const role = DEFAULT_ROLES[roleId];
    if (!role) return [];

    const permissions = [];
    role.permissions.forEach((p) => {
      p.actions.forEach((action) => {
        permissions.push({ resource: p.resource, action });
      });
    });
    return permissions;
  };

  const currentPermissions = getPermissionsForRole(selectedRole);

  return (
    <div className="space-y-6">
      {/* Tabs for different views */}
      <Tabs defaultValue="roles">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="roles">Manage Roles</TabsTrigger>
          <TabsTrigger value="create">Create Custom Role</TabsTrigger>
        </TabsList>

        {/* Manage Roles Tab */}
        <TabsContent value="roles" className="space-y-6">
          {/* Role Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Select Role</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`p-4 border-2 rounded-lg text-left transition ${
                      selectedRole === role.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-slate-200 bg-white hover:border-indigo-300'
                    }`}
                  >
                    <p className="font-semibold text-slate-900">
                      {role.name}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      {role.description}
                    </p>
                    <div className="mt-3">
                      <Badge
                        className={
                          selectedRole === role.id
                            ? 'bg-indigo-600'
                            : 'bg-slate-200 text-slate-800'
                        }
                      >
                        {role.isCustom ? 'Custom' : 'Built-in'}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Role Details */}
          {currentRole && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{currentRole.name}</CardTitle>
                    <p className="text-sm text-slate-600 mt-2">
                      {currentRole.description}
                    </p>
                  </div>
                  <Shield className="w-8 h-8 text-indigo-600 flex-shrink-0" />
                </div>
              </CardHeader>
            </Card>
          )}

          {/* Permissions Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Permissions ({currentPermissions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.values(RESOURCES).map((resource) => {
                  const resourcePermissions = currentPermissions.filter(
                    (p) => p.resource === resource
                  );

                  return (
                    <div
                      key={resource}
                      className="p-4 border border-slate-200 rounded-lg bg-slate-50"
                    >
                      <p className="font-semibold text-slate-900 mb-3 capitalize">
                        {resource.replace(/_/g, ' ')}
                      </p>
                      <div className="space-y-2">
                        {resourcePermissions.length > 0 ? (
                          resourcePermissions.map((perm) => (
                            <div
                              key={`${perm.resource}-${perm.action}`}
                              className="flex items-center gap-2 text-sm"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              <span className="text-slate-700">
                                {perm.action}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500 italic">
                            No permissions
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Permission Legend */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <p className="text-sm text-blue-900 font-semibold mb-3">
                Available Actions:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(ACTIONS).map(([key, value]) => (
                  <div key={key} className="text-xs">
                    <Badge className="bg-blue-600">
                      {value.toUpperCase()}
                    </Badge>
                    <p className="text-blue-800 mt-1">
                      {value === ACTIONS.CREATE && 'Create new'}
                      {value === ACTIONS.READ && 'View/Read'}
                      {value === ACTIONS.UPDATE && 'Edit/Modify'}
                      {value === ACTIONS.DELETE && 'Remove'}
                      {value === ACTIONS.PUBLISH && 'Make public'}
                      {value === ACTIONS.APPROVE && 'Approve/Sign'}
                      {value === ACTIONS.EXPORT && 'Export data'}
                      {value === ACTIONS.SHARE && 'Share access'}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create Custom Role Tab */}
        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Custom Role</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Role Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-900">
                    Role Name
                  </label>
                  <input
                    type="text"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="e.g., Department Head"
                    className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-900">
                    Description
                  </label>
                  <textarea
                    value={newRoleDescription}
                    onChange={(e) =>
                      setNewRoleDescription(e.target.value)
                    }
                    placeholder="Describe the purpose of this role"
                    className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                  />
                </div>
              </div>

              {/* Permission Selection */}
              <div>
                <label className="text-sm font-semibold text-slate-900 mb-4 block">
                  Assign Permissions
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.values(RESOURCES).map((resource) => (
                    <div
                      key={resource}
                      className="p-4 border border-slate-200 rounded-lg"
                    >
                      <p className="font-semibold text-slate-900 mb-3 capitalize">
                        {resource.replace(/_/g, ' ')}
                      </p>
                      <div className="space-y-2">
                        {Object.values(ACTIONS).map((action) => {
                          const key = `${resource}-${action}`;
                          return (
                            <label
                              key={key}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={
                                  selectedPermissions[key] || false
                                }
                                onChange={() =>
                                  togglePermission(resource, action)
                                }
                                className="rounded"
                              />
                              <span className="text-sm text-slate-700 capitalize">
                                {action}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Permissions Summary */}
              {Object.keys(selectedPermissions).filter(
                (k) => selectedPermissions[k]
              ).length > 0 && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <p className="text-sm font-semibold text-indigo-900 mb-2">
                    Selected Permissions ({Object.keys(selectedPermissions).filter((k) => selectedPermissions[k]).length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedPermissions)
                      .filter(([, selected]) => selected)
                      .map(([key]) => {
                        const [resource, action] = key.split('-');
                        return (
                          <Badge
                            key={key}
                            className="bg-indigo-600"
                          >
                            {action} {resource}
                          </Badge>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Create Button */}
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2">
                <Plus className="w-4 h-4" />
                Create Custom Role
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}