import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, Upload, Link2, FileText } from 'lucide-react';

export default function AddMaterialDialog({ open, onOpenChange, classData, user, schoolId }) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState('file');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setTitle('');
    setDescription('');
    setFile(null);
    setLinkUrl('');
    setError('');
    setMode('file');
  };

  const createMutation = useMutation({
    mutationFn: async (payload) => base44.entities.ClassMaterial.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-materials', classData.id] });
      reset();
      onOpenChange(false);
    },
  });

  const handleSubmit = async () => {
    setError('');
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    if (mode === 'file') {
      if (!file) {
        setError('Please choose a file to upload');
        return;
      }
      setUploading(true);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        await createMutation.mutateAsync({
          school_id: schoolId,
          class_id: classData.id,
          title: title.trim(),
          description: description.trim() || undefined,
          type: 'file',
          url: file_url,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by_id: user.id,
          uploaded_by_name: user.full_name,
        });
      } catch (e) {
        setError(e.message || 'Upload failed');
      } finally {
        setUploading(false);
      }
    } else {
      const trimmed = linkUrl.trim();
      if (!trimmed) {
        setError('Please enter a URL');
        return;
      }
      const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      await createMutation.mutateAsync({
        school_id: schoolId,
        class_id: classData.id,
        title: title.trim(),
        description: description.trim() || undefined,
        type: 'link',
        url: normalized,
        uploaded_by_id: user.id,
        uploaded_by_name: user.full_name,
      });
    }
  };

  const busy = uploading || createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!busy) { onOpenChange(v); if (!v) reset(); } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Class Material</DialogTitle>
        </DialogHeader>

        <Tabs value={mode} onValueChange={setMode} className="mt-2">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="file" className="gap-2"><FileText className="w-4 h-4" /> Upload File</TabsTrigger>
            <TabsTrigger value="link" className="gap-2"><Link2 className="w-4 h-4" /> Add Link</TabsTrigger>
          </TabsList>

          <div className="space-y-4 mt-4">
            <div>
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Unit 3 Reading Guide" />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>

            <TabsContent value="file" className="m-0">
              <Label>File</Label>
              <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              {file && <p className="text-xs text-slate-500 mt-1">{file.name} · {(file.size / 1024).toFixed(1)} KB</p>}
            </TabsContent>

            <TabsContent value="link" className="m-0">
              <Label>URL</Label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://docs.google.com/... or https://youtube.com/..."
              />
            </TabsContent>
          </div>
        </Tabs>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={busy} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Uploading…' : 'Add Material'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}