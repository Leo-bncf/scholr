import React from 'react';

const isImage = (mime = '', name = '') => mime.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp)$/i.test(name);
const isPdf = (mime = '', name = '') => mime === 'application/pdf' || /\.pdf$/i.test(name);
const isDocx = (mime = '', name = '') => mime.includes('wordprocessingml') || /\.docx$/i.test(name);

export default function FileInlinePreview({ document }) {
  if (!document?.url) return null;

  if (isImage(document.mime_type, document.name)) {
    return <img src={document.url} alt={document.name} className="w-full max-h-[28rem] object-contain rounded-lg border border-slate-200 bg-white" />;
  }

  if (isPdf(document.mime_type, document.name)) {
    return <iframe title={document.name} src={document.url} className="w-full h-[32rem] rounded-lg border border-slate-200 bg-white" />;
  }

  if (isDocx(document.mime_type, document.name)) {
    return <iframe title={document.name} src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(document.url)}`} className="w-full h-[32rem] rounded-lg border border-slate-200 bg-white" />;
  }

  return null;
}