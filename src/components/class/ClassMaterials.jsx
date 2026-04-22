import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, FileText, Link2, FolderOpen, ExternalLink, Trash2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useUser } from '@/components/auth/UserContext';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import AddMaterialDialog from './AddMaterialDialog';

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ClassMaterials({ classData, isTeacher }) {
  const queryClient = useQueryClient();
  const { user, schoolId } = useUser();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['class-materials', classData.id],
    queryFn: async () => base44.entities.ClassMaterial.filter(
      { class_id: classData.id },
      '-created_date',
    ),
    enabled: !!classData?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => base44.entities.ClassMaterial.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-materials', classData.id] });
      setToDelete(null);
    },
  });

  const canManage = (m) => isTeacher && (m.uploaded_by_id === user?.id || ['school_admin', 'ib_coordinator'].includes(user?.role));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Class Materials</h2>
          <p className="text-sm text-slate-500">Files and links shared with this class</p>
        </div>
        {isTeacher && (
          <Button onClick={() => setDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
            <Upload className="w-4 h-4" /> Add Material
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-medium">No materials yet</p>
          {isTeacher && <p className="text-sm mt-1">Upload a file or add a link to get started</p>}
        </div>
      ) : (
        <div className="grid gap-3">
          {materials.map((m) => {
            const Icon = m.type === 'link' ? Link2 : FileText;
            return (
              <div key={m.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{m.title}</p>
                    {m.description && <p className="text-xs text-slate-500 truncate">{m.description}</p>}
                    <p className="text-xs text-slate-400 mt-0.5">
                      {m.type === 'file' ? (m.file_name || 'File') : 'Link'}
                      {m.file_size ? ` · ${formatSize(m.file_size)}` : ''}
                      {m.uploaded_by_name ? ` · ${m.uploaded_by_name}` : ''}
                      {m.created_date ? ` · ${format(new Date(m.created_date), 'dd MMM yyyy')}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" asChild>
                    <a href={m.url} target="_blank" rel="noopener noreferrer" title={m.type === 'file' ? 'Download' : 'Open'}>
                      {m.type === 'file' ? <Download className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                    </a>
                  </Button>
                  {canManage(m) && (
                    <Button variant="ghost" size="sm" onClick={() => setToDelete(m)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isTeacher && (
        <AddMaterialDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          classData={classData}
          user={user}
          schoolId={schoolId}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Delete material?"
        description={`"${toDelete?.title}" will be permanently removed from this class.`}
        confirmLabel="Delete"
        isDestructive
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && deleteMutation.mutate(toDelete.id)}
      />
    </div>
  );
}