/**
 * School Role Management Component
 * Allows school admins to view, configure, and create custom roles
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RolePermissionManager from './RolePermissionManager';
import { Shield, Plus } from 'lucide-react';

export default function SchoolRoleManagement() {
  const [activeTab, setActiveTab] = useState('builtin');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-600" />
          Role & Permission Management
        </h2>
        <p className="text-slate-600 mt-2">
          Configure granular permissions for roles in your school
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="builtin">Built-in Roles</TabsTrigger>
          <TabsTrigger value="custom">Custom Roles</TabsTrigger>
          <TabsTrigger value="guide">Permission Guide</TabsTrigger>
        </TabsList>

        {/* Built-in Roles Tab */}
        <TabsContent value="builtin">
          <RolePermissionManager />
        </TabsContent>

        {/* Custom Roles Tab */}
        <TabsContent value="custom" className="space-y-6">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <p className="text-sm text-blue-900">
                Custom roles allow you to create specialized permission sets
                tailored to your school's specific needs. Once created, you can
                assign these roles to users.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Your Custom Roles</CardTitle>
                <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                  <Plus className="w-4 h-4" />
                  Create Role
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 text-center py-8">
                No custom roles yet. Create one to get started.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permission Guide Tab */}
        <TabsContent value="guide" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Resources */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm space-y-2">
                  <div className="p-2 bg-slate-50 rounded">
                    <p className="font-semibold">School</p>
                    <p className="text-xs text-slate-600">
                      School data and settings
                    </p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded">
                    <p className="font-semibold">Class</p>
                    <p className="text-xs text-slate-600">
                      Classes and their management
                    </p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded">
                    <p className="font-semibold">User</p>
                    <p className="text-xs text-slate-600">
                      User accounts and profiles
                    </p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded">
                    <p className="font-semibold">Assignment</p>
                    <p className="text-xs text-slate-600">
                      Class assignments and tasks
                    </p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded">
                    <p className="font-semibold">Grade</p>
                    <p className="text-xs text-slate-600">
                      Student grades and marks
                    </p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded">
                    <p className="font-semibold">Report</p>
                    <p className="text-xs text-slate-600">
                      Academic reports and transcripts
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm space-y-2">
                  <div className="p-2 bg-indigo-50 rounded">
                    <p className="font-semibold text-indigo-900">Create</p>
                    <p className="text-xs text-indigo-800">
                      Create new resources
                    </p>
                  </div>
                  <div className="p-2 bg-indigo-50 rounded">
                    <p className="font-semibold text-indigo-900">Read</p>
                    <p className="text-xs text-indigo-800">
                      View and read resources
                    </p>
                  </div>
                  <div className="p-2 bg-indigo-50 rounded">
                    <p className="font-semibold text-indigo-900">Update</p>
                    <p className="text-xs text-indigo-800">
                      Edit and modify resources
                    </p>
                  </div>
                  <div className="p-2 bg-indigo-50 rounded">
                    <p className="font-semibold text-indigo-900">Delete</p>
                    <p className="text-xs text-indigo-800">
                      Remove resources
                    </p>
                  </div>
                  <div className="p-2 bg-indigo-50 rounded">
                    <p className="font-semibold text-indigo-900">Approve</p>
                    <p className="text-xs text-indigo-800">
                      Approve/sign off items
                    </p>
                  </div>
                  <div className="p-2 bg-indigo-50 rounded">
                    <p className="font-semibold text-indigo-900">Export</p>
                    <p className="text-xs text-indigo-800">
                      Export data out of system
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Use Cases */}
          <Card>
            <CardHeader>
              <CardTitle>Common Role Configurations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-l-4 border-emerald-600 pl-4">
                <p className="font-semibold text-slate-900">
                  Department Head
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Full access to classes and grades, can create assignments,
                  manage students, and create custom roles for their department
                </p>
              </div>

              <div className="border-l-4 border-blue-600 pl-4">
                <p className="font-semibold text-slate-900">
                  Grade Administrator
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Can create, read, update grades; read assignments and students;
                  export grade reports
                </p>
              </div>

              <div className="border-l-4 border-purple-600 pl-4">
                <p className="font-semibold text-slate-900">
                  Teaching Assistant
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Can read classes and assignments; create and read grades; create
                  and read submissions
                </p>
              </div>

              <div className="border-l-4 border-amber-600 pl-4">
                <p className="font-semibold text-slate-900">
                  Report Coordinator
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Can read and export reports; read grades and attendance; has full
                  access to report generation
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}