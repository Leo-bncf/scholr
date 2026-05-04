import React from 'react';
import { FileText, ExternalLink, Sheet, Presentation, File, Link2, Download, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const documentTypeConfig = {
  google_doc: {
    icon: FileText,
    label: 'Google Doc',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    iconColor: 'text-blue-600'
  },
  google_sheet: {
    icon: Sheet,
    label: 'Google Sheet',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconColor: 'text-emerald-600'
  },
  google_slide: {
    icon: Presentation,
    label: 'Google Slides',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    iconColor: 'text-amber-600'
  },
  google_drive_file: {
    icon: File,
    label: 'Drive File',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    iconColor: 'text-indigo-600'
  },
  uploaded_file: {
    icon: File,
    label: 'Uploaded File',
    color: 'bg-slate-50 text-slate-700 border-slate-200',
    iconColor: 'text-slate-600'
  },
  external_link: {
    icon: Link2,
    label: 'Link',
    color: 'bg-violet-50 text-violet-700 border-violet-200',
    iconColor: 'text-violet-600'
  }
};

export default function DocumentCard({ document, onRemove, onOpen, compact = false }) {
  const config = documentTypeConfig[document.type] || documentTypeConfig.uploaded_file;
  const Icon = config.icon;

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-3 p-3 rounded-lg border ${config.color} transition-all hover:shadow-sm`}>
        <div className={`w-10 h-10 rounded-lg bg-white/50 flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${config.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{document.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge className="bg-white/50 border-0 text-xs px-2 py-0">
              {config.label}
            </Badge>
            {document.size_bytes && (
              <span className="text-xs opacity-70">{formatFileSize(document.size_bytes)}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onOpen && (
            <button
              onClick={() => onOpen(document)}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              title="Open document"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
          {onRemove && (
            <button
              onClick={() => onRemove(document)}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors text-red-600"
              title="Remove document"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border ${config.color} overflow-hidden transition-all hover:shadow-md`}>
      {document.thumbnail_url ? (
        <div className="aspect-video w-full bg-slate-100 overflow-hidden">
          <img 
            src={document.thumbnail_url} 
            alt={document.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-video w-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
          <Icon className={`w-16 h-16 ${config.iconColor} opacity-50`} />
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate">{document.name}</h4>
            <Badge className="bg-white/50 border-0 text-xs mt-1">
              {config.label}
            </Badge>
          </div>
          <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0`} />
        </div>
        
        {(document.size_bytes || document.file_type) && (
          <p className="text-xs opacity-70 mb-3">{[formatFileSize(document.size_bytes), document.file_type?.toUpperCase()].filter(Boolean).join(' • ')}</p>
        )}

        <div className="flex items-center gap-2">
          {onOpen && (
            <button
              onClick={() => onOpen(document)}
              className="flex-1 px-3 py-2 bg-white/50 hover:bg-white/80 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open
            </button>
          )}
          {onRemove && (
            <button
              onClick={() => onRemove(document)}
              className="px-3 py-2 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium text-red-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}