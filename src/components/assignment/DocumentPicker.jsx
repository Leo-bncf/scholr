import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { base44 } from '@/api/base44Client';
import { FileText, Link2, Upload, Loader2, Plus, Sheet, Presentation, FolderOpen } from 'lucide-react';

export default function DocumentPicker({ open, onClose, onAddDocuments, trigger }) {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploading, setUploading] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const fileType = file.name.split('.').pop()?.toLowerCase() || file.type;
      const document = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: 'uploaded_file',
        url: file_url,
        mime_type: file.type,
        size_bytes: file.size,
        created_at: new Date().toISOString(),
        file_type: fileType,
      };
      
      onAddDocuments([document]);
      setActiveTab('upload');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleAddLink = () => {
    if (!linkUrl.trim()) return;
    
    const document = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: linkName.trim() || linkUrl,
      type: 'external_link',
      url: linkUrl,
      created_at: new Date().toISOString(),
    };
    
    onAddDocuments([document]);
    setLinkUrl('');
    setLinkName('');
  };

  const handleGoogleDocCreate = (docType) => {
    // Placeholder for future Google Docs integration
    alert(`Google ${docType} integration coming soon! This will allow you to create and attach Google Docs, Sheets, and Slides directly.`);
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => onClose(false)}>{trigger}</div>
      ) : (
        <Button onClick={() => onClose(false)} variant="outline" className="border-indigo-200 text-indigo-700">
          <Plus className="w-4 h-4 mr-2" /> Add Document
        </Button>
      )}

      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Documents</DialogTitle>
            <p className="text-sm text-slate-500 mt-1">
              Upload files, add links, or connect cloud documents
            </p>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="upload">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="link">
                <Link2 className="w-4 h-4 mr-2" />
                Link
              </TabsTrigger>
              <TabsTrigger value="google">
                <FolderOpen className="w-4 h-4 mr-2" />
                Google
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-sm text-slate-600 mb-4">
                  {uploading ? 'Uploading...' : 'Click to upload a file from your device'}
                </p>
                <label className="inline-block">
                  <Button disabled={uploading} variant="outline">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Choose File
                  </Button>
                  <input 
                    type="file" 
                    accept=".pdf,.docx,image/*"
                    className="hidden" 
                    onChange={handleFileUpload} 
                    disabled={uploading}
                  />
                </label>
              </div>
            </TabsContent>

            <TabsContent value="link" className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">Link URL *</Label>
                <Input
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Display Name (Optional)</Label>
                <Input
                  value={linkName}
                  onChange={e => setLinkName(e.target.value)}
                  placeholder="e.g. Research Article"
                  className="mt-1.5"
                />
              </div>
              <Button 
                onClick={handleAddLink} 
                disabled={!linkUrl.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                Add Link
              </Button>
            </TabsContent>

            <TabsContent value="google" className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-900">
                  <strong>Coming Soon:</strong> Direct Google Workspace integration. Create or link Google Docs, Sheets, and Slides directly in your submission.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => handleGoogleDocCreate('Doc')}
                  className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Google Docs</p>
                    <p className="text-xs text-slate-500">Create or attach a document</p>
                  </div>
                </button>

                <button
                  onClick={() => handleGoogleDocCreate('Sheet')}
                  className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-left"
                >
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Sheet className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Google Sheets</p>
                    <p className="text-xs text-slate-500">Create or attach a spreadsheet</p>
                  </div>
                </button>

                <button
                  onClick={() => handleGoogleDocCreate('Slides')}
                  className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl hover:border-amber-300 hover:bg-amber-50/50 transition-all text-left"
                >
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Presentation className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Google Slides</p>
                    <p className="text-xs text-slate-500">Create or attach a presentation</p>
                  </div>
                </button>

                <button
                  onClick={() => handleGoogleDocCreate('Drive')}
                  className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-left"
                >
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <FolderOpen className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Google Drive</p>
                    <p className="text-xs text-slate-500">Browse and attach from Drive</p>
                  </div>
                </button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}