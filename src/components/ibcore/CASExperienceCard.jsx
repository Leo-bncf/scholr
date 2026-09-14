import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Palette, Heart, Users, Calendar, Clock, FileText } from 'lucide-react';

const strandIcons = {
  creativity: Palette,
  activity: Heart,
  service: Users
};

const strandColors = {
  creativity: 'scholr-accent-sf scholr-accent scholr-accent-rule',
  activity: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  service: 'bg-blue-100 text-blue-700 border-blue-200'
};

const statusColors = {
  planned: 'scholr-sunk scholr-body',
  ongoing: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  approved: 'scholr-accent-sf scholr-accent'
};

export default function CASExperienceCard({ experience, onEdit, onViewDetails }) {
  return (
    <div className="app-group p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold scholr-ink text-lg">{experience.title}</h3>
        <Badge className={statusColors[experience.status]}>{experience.status}</Badge>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {experience.cas_strands?.map(strand => {
          const Icon = strandIcons[strand];
          return (
            <Badge key={strand} variant="outline" className={strandColors[strand]}>
              <Icon className="w-3 h-3 mr-1" />
              {strand}
            </Badge>
          );
        })}
      </div>

      {experience.description && (
        <p className="text-sm scholr-muted mb-3 line-clamp-2">{experience.description}</p>
      )}

      <div className="flex items-center gap-4 text-xs scholr-muted mb-4">
        {experience.start_date && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(experience.start_date).toLocaleDateString()}
          </span>
        )}
        {experience.hours && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {experience.hours}h
          </span>
        )}
        {experience.reflection && (
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            Reflection added
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onViewDetails(experience)} className="flex-1">
          View Details
        </Button>
        {experience.status !== 'approved' && onEdit && (
          <Button variant="outline" size="sm" onClick={() => onEdit(experience)}>
            Edit
          </Button>
        )}
      </div>
    </div>
  );
}