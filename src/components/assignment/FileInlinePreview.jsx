import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { resolveUrl } from '@/data/storage';

const isImage = (mime = '', name = '') => mime.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp)$/i.test(name);
const isPdf = (mime = '', name = '') => mime === 'application/pdf' || /\.pdf$/i.test(name);
const isDocx = (mime = '', name = '') => mime.includes('wordprocessingml') || /\.docx$/i.test(name);

export default function FileInlinePreview({ document }) {
  const previewable = !!document?.url && (
    isImage(document.mime_type, document.name) || isPdf(document.mime_type, document.name) || isDocx(document.mime_type, document.name)
  );

  // Stored files are references (see storage.js); sign one for this view.
  // Kept for 50 minutes, inside the hour the signature is valid for.
  const { data: src } = useQuery({
    queryKey: ['stored-file-url', document?.url],
    queryFn: () => resolveUrl(document.url),
    enabled: previewable,
    staleTime: 50 * 60 * 1000,
  });

  if (!previewable || !src) return null;

  if (isImage(document.mime_type, document.name)) {
    return <img src={src} alt={document.name} className="w-full max-h-[28rem] object-contain rounded-lg border scholr-rule bg-white" />;
  }

  if (isPdf(document.mime_type, document.name)) {
    return <iframe title={document.name} src={src} className="w-full h-[32rem] rounded-lg border scholr-rule bg-white" />;
  }

  return <iframe title={document.name} src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(src)}`} className="w-full h-[32rem] rounded-lg border scholr-rule bg-white" />;
}
