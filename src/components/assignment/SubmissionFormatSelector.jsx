import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Presentation, Table, Upload, Link as LinkIcon, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const FORMAT_OPTIONS = [
  { value: 'google_doc', label: 'Google Doc', icon: FileText, description: 'Written work, essays, reports', color: 'text-blue-600' },
  { value: 'google_slides', label: 'Google Slides', icon: Presentation, description: 'Presentations, visual projects', color: 'text-amber-600' },
  { value: 'google_sheet', label: 'Google Sheet', icon: Table, description: 'Spreadsheets, data analysis', color: 'text-emerald-600' },
  { value: 'file_upload', label: 'File Upload', icon: Upload, description: 'PDFs, images, or other files', color: 'scholr-muted' },
  { value: 'link', label: 'Link', icon: LinkIcon, description: 'External website or resource', color: 'scholr-accent' },
];

export default function SubmissionFormatSelector({ primaryFormat, allowAlternatives, alternativeFormats, onChange }) {
  const handleSetPrimary = (format) => {
    onChange({
      primaryFormat: format,
      allowAlternatives,
      alternativeFormats: alternativeFormats.filter(f => f !== format),
    });
  };

  const handleToggleAlternatives = () => {
    onChange({
      primaryFormat,
      allowAlternatives: !allowAlternatives,
      alternativeFormats: allowAlternatives ? [] : alternativeFormats,
    });
  };

  const handleToggleAlternative = (format) => {
    if (format === primaryFormat) return;
    if (alternativeFormats.includes(format)) {
      onChange({
        primaryFormat,
        allowAlternatives,
        alternativeFormats: alternativeFormats.filter(f => f !== format),
      });
    } else {
      onChange({
        primaryFormat,
        allowAlternatives,
        alternativeFormats: [...alternativeFormats, format],
      });
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <Label className="text-sm font-semibold mb-2 block">Primary Expected Format</Label>
        <p className="text-xs scholr-muted mb-3">
          Choose the main format you expect students to use for this assignment.
        </p>
        <div className="grid grid-cols-1 gap-2">
          {FORMAT_OPTIONS.map(({ value, label, icon: Icon, description, color }) => (
            <div
              key={value}
              className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                primaryFormat === value
                  ? 'scholr-accent-rule scholr-accent-sf ring-2 scholr-accent-rule'
                  : 'scholr-rule hover:scholr-rule hover:scholr-sunk'
              }`}
              onClick={() => handleSetPrimary(value)}
            >
              <div className="mt-0.5">
                {primaryFormat === value ? (
                  <CheckCircle className="w-5 h-5 scholr-accent" />
                ) : (
                  <div className="w-5 h-5 border-2 scholr-rule rounded-full" />
                )}
              </div>
              <Icon className={`w-5 h-5 mt-0.5 ${primaryFormat === value ? 'scholr-accent' : color}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium scholr-ink">{label}</p>
                  {primaryFormat === value && (
                    <Badge className="scholr-accent-sf scholr-accent border-0 text-xs">Primary</Badge>
                  )}
                </div>
                <p className="text-xs scholr-muted">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {primaryFormat && (
        <div className="pt-4 border-t">
          <div className="flex items-start gap-3 mb-3">
            <Checkbox
              checked={allowAlternatives}
              onCheckedChange={handleToggleAlternatives}
              className="mt-0.5"
            />
            <div className="flex-1">
              <Label className="text-sm font-semibold cursor-pointer" onClick={handleToggleAlternatives}>
                Allow alternative submission formats
              </Label>
              <p className="text-xs scholr-muted mt-0.5">
                Students can submit using other formats in addition to your primary format
              </p>
            </div>
          </div>

          {allowAlternatives && (
            <div className="ml-8 mt-3 space-y-2">
              <p className="text-xs font-medium scholr-muted mb-2">Additional allowed formats:</p>
              {FORMAT_OPTIONS.filter(opt => opt.value !== primaryFormat).map(({ value, label, icon: Icon, color }) => (
                <div
                  key={value}
                  className={`flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer transition-colors ${
                    alternativeFormats.includes(value)
                      ? 'scholr-rule scholr-sunk'
                      : 'scholr-rule hover:scholr-rule'
                  }`}
                  onClick={() => handleToggleAlternative(value)}
                >
                  <Checkbox
                    checked={alternativeFormats.includes(value)}
                    onCheckedChange={() => handleToggleAlternative(value)}
                  />
                  <Icon className={`w-4 h-4 ${alternativeFormats.includes(value) ? 'scholr-body' : color}`} />
                  <span className="text-sm scholr-body">{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!primaryFormat && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">
            Please select a primary submission format to guide students on how to complete this assignment.
          </p>
        </div>
      )}
    </div>
  );
}