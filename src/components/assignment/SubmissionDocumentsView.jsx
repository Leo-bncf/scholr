import React from 'react';
import { FileText, Presentation, Table, FileIcon, Link as LinkIcon, ExternalLink, Trash2, AlertCircle } from 'lucide-react';
import FileInlinePreview from './FileInlinePreview';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DocumentAccessValidator from '@/components/google/DocumentAccessValidator';

const TYPE_CONFIGS = {
  google_doc: { icon: FileText, label: 'Google Doc', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  google_slides: { icon: Presentation, label: 'Google Slides', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  google_sheet: { icon: Table, label: 'Google Sheet', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  google_drive_file: { icon: FileIcon, label: 'Drive File', color: 'bg-slate-50 text-slate-700 border-slate-200' },
  uploaded_file: { icon: FileIcon, label: 'Uploaded File', color: 'bg-slate-50 text-slate-700 border-slate-200' },
  external_link: { icon: LinkIcon, label: 'Link', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
};

export default function SubmissionDocumentsView({ documents, onRemove = null, onOpen = null, compact = false, isTeacher = false }) {
  if (!documents || documents.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-${compact ? '2' : '3'}`}>
      {documents.map((doc) => {
        const config = TYPE_CONFIGS[doc.type] || TYPE_CONFIGS.external_link;
        const Icon = config.icon;
        const isGoogleDoc = doc.type?.includes('google');

        return (
          <div
            key={doc.id}
            className={`border rounded-lg p-3 ${config.color} transition-colors ${
              compact ? 'flex items-center justify-between' : 'space-y-2'
            }`}
          >
            <div className="flex items-start gap-3 flex-1">
              <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm truncate">{doc.name}</p>
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {config.label}
                  </Badge>
                </div>
                {doc.metadata?.owner_email && doc.type !== 'uploaded_file' && (
                  <p className="text-xs opacity-75 mt-0.5">
                    Owner: {doc.metadata.owner_email}
                  </p>
                )}
                {doc.file_type && (
                  <p className="text-xs opacity-75 mt-0.5 uppercase">{doc.file_type}</p>
                )}
                <div className="mt-3">
                  <FileInlinePreview document={doc} />
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              {isGoogleDoc && isTeacher ? (
                <DocumentAccessValidator 
                  document={doc}
                  onOpenDocument={onOpen}
                  isTeacher={true}
                />
              ) : doc.url ? (
                <Button
                  onClick={() => onOpen?.(doc)}
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  asChild
                >
                  <a href={doc.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3.5 h-3.5 mr-1" /> Open
                  </a>
                </Button>
              ) : null}
              {onRemove && (
                <Button
                  onClick={() => onRemove(doc.id)}
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}