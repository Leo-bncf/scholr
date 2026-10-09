import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Group, GroupEmpty } from '@/components/app/AppShell';
import { Loader2, Upload, FileText, Link2, ExternalLink, Trash2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useUser } from '@/components/auth/UserContext';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import AddMaterialDialog from './AddMaterialDialog';
import * as classMaterialsData from '@/data/classMaterials';
import StoredFileLink from '@/components/common/StoredFileLink';

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ClassMaterials({ classData, isTeacher }) {
  const queryClient = useQueryClient();
  const { user, schoolId, role } = useUser();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['class-materials', classData.id],
    queryFn: async () => classMaterialsData.where({ class_id: classData.id }, { order: 'created_at', ascending: false }),
    enabled: !!classData?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => classMaterialsData.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-materials', classData.id] });
      setToDelete(null);
    },
  });

  // Role from the school membership: the profile's `role` is rarely the one a
  // person holds in this school, so admins could never delete here.
  const canManage = (m) => isTeacher && (m.uploaded_by_id === user?.id || ['school_admin', 'ib_coordinator'].includes(role));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {isTeacher && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          <p style={{ margin: 0, fontSize: '.88rem', color: 'var(--muted)' }}>
            Files and links for this class. Students see everything here.
          </p>
          <button type="button" className="pub-btn pub-btn-line scholr-focus" onClick={() => setDialogOpen(true)} style={{ marginLeft: 'auto' }}>
            <Upload className="w-4 h-4" /> Add file or link
          </button>
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-xl) 0' }}>
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--brand)' }} />
        </div>
      ) : (
        <Group>
          {materials.length === 0 ? (
            <GroupEmpty>
              {isTeacher ? 'Nothing shared yet. Upload a file — a worksheet, a mark scheme, slides — or add a link.' : 'Your teacher hasn\'t shared anything here yet.'}
            </GroupEmpty>
          ) : materials.map((m) => {
            const Icon = m.type === 'link' ? Link2 : FileText;
            return (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.7rem .9rem' }}>
                <Icon className="w-4 h-4" style={{ color: 'var(--muted)', flex: 'none' }} aria-hidden="true" />
                <StoredFileLink
                  href={m.url}
                  className="scholr-focus"
                  style={{ minWidth: 0, flex: 1, textDecoration: 'none', color: 'inherit' }}
                  title={m.type === 'file' ? 'Open file' : 'Open link'}
                >
                  <span style={{ display: 'block', fontSize: '.92rem', color: 'var(--ink)', overflowWrap: 'anywhere' }}>{m.title}</span>
                  <span style={{ display: 'block', marginTop: '.1rem', fontSize: '.8rem', color: 'var(--muted)' }}>
                    {[
                      m.description,
                      m.type === 'file' ? (m.file_name || 'File') : 'Link',
                      m.file_size ? formatSize(m.file_size) : null,
                      m.uploaded_by_name,
                      m.created_at ? format(new Date(m.created_at), 'd MMM yyyy') : null,
                    ].filter(Boolean).join(' · ')}
                  </span>
                </StoredFileLink>
                {m.type === 'file' ? <Download className="w-4 h-4" style={{ color: 'var(--faint)', flex: 'none' }} aria-hidden="true" /> : <ExternalLink className="w-4 h-4" style={{ color: 'var(--faint)', flex: 'none' }} aria-hidden="true" />}
                {canManage(m) && (
                  <button
                    type="button"
                    onClick={() => setToDelete(m)}
                    className="scholr-focus"
                    aria-label={`Delete ${m.title}`}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '.25rem', color: 'var(--muted)', display: 'inline-flex' }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </Group>
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