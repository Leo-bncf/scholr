import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Smile, AlertTriangle, AlertCircle, FileText, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';

export default function BehaviorRecordsList({ records, showVisibilityIndicators = false }) {
  const getTypeIcon = (type) => {
    switch (type) {
      case 'positive': return <Smile className="w-5 h-5" style={{ color: 'var(--good)' }} />;
      case 'concern': return <AlertTriangle className="w-5 h-5" style={{ color: 'var(--warn)' }} />;
      case 'incident': return <AlertCircle className="w-5 h-5" style={{ color: 'var(--crit)' }} />;
      default: return <FileText className="w-5 h-5 scholr-muted" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'positive': return 'scholr-sunk scholr-body';
      case 'concern': return 'scholr-sunk scholr-body';
      case 'incident': return 'scholr-sunk scholr-body';
      default: return 'scholr-sunk scholr-rule scholr-body';
    }
  };

  const getSeverityBadge = (severity) => {
    const colors = {
      low: 'scholr-sunk scholr-body',
      medium: 'scholr-sunk scholr-body',
      high: 'scholr-sunk scholr-body',
    };
    return <Badge className={colors[severity]}>{severity} severity</Badge>;
  };

  if (records.length === 0) {
    return (
      <div className="text-center py-12 scholr-faint">
        <FileText className="w-12 h-12 mx-auto mb-3 scholr-faint" />
        <p>No behavior records found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map(record => (
        <div key={record.id} className={`rounded-xl border p-5 ${getTypeColor(record.type)}`}>
          <div className="flex items-start gap-4">
            <div className="mt-1">{getTypeIcon(record.type)}</div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold scholr-ink">{record.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs capitalize">{record.type}</Badge>
                    <Badge variant="outline" className="text-xs capitalize">{record.category}</Badge>
                    {record.severity && getSeverityBadge(record.severity)}
                  </div>
                </div>
                {showVisibilityIndicators && (
                  <div className="flex items-center gap-2">
                    {record.visible_to_student && (
                      <Eye className="w-4 h-4" style={{ color: 'var(--ink)' }} title="Visible to student" />
                    )}
                    {record.visible_to_parent && (
                      <Eye className="w-4 h-4" style={{ color: 'var(--good)' }} title="Visible to parent" />
                    )}
                    {!record.visible_to_student && !record.visible_to_parent && (
                      <EyeOff className="w-4 h-4 scholr-faint" title="Staff only" />
                    )}
                  </div>
                )}
              </div>
              
              {record.description && (
                <p className="text-sm scholr-body mt-2">{record.description}</p>
              )}

              {record.action_taken && (
                <div className="mt-3 pt-3 border-t border-current/10">
                  <p className="text-xs font-semibold scholr-body mb-1">Action Taken:</p>
                  <p className="text-sm scholr-muted">{record.action_taken}</p>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between text-xs scholr-muted">
                <span>Recorded by: {record.recorded_by_name}</span>
                <span>{record.date ? format(new Date(record.date), 'MMM d, yyyy') : ''}</span>
              </div>

              {record.follow_up_required && (
                <Badge className="bg-orange-50 border-orange-200 mt-2" style={{ color: 'var(--warn)' }}>
                  Follow-up required
                </Badge>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}