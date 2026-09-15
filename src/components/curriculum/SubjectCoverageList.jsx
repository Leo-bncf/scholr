import React from 'react';
import { Group, Row, GroupEmpty } from '@/components/app/AppShell';
import Meter from '@/components/app/Meter';

/**
 * Pick a subject, and see at a glance how much of it has been taught.
 *
 * The bar was shadcn's Progress, which draws in its own primary colour rather
 * than the theme's, and the percentage was an outline Badge — a chip for a
 * number that is not a state. Meter draws against a 100% track, which is what
 * "62% covered" has to be read against.
 */
export default function SubjectCoverageList({ subjects = [], onSelectSubject, selectedSubjectId }) {
  return (
    <Group title="Subjects">
      {subjects.length === 0 ? (
        <GroupEmpty>No subjects have topics mapped yet.</GroupEmpty>
      ) : (
        subjects.map((subject) => (
          <Row
            key={subject.id}
            label={subject.name}
            detail={`${subject.coveredCount} of ${subject.totalCount} topics taught`}
            onClick={() => onSelectSubject(subject.id)}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '.6rem', minWidth: '7rem' }}>
              <span style={{ flex: 1 }}>
                <Meter
                  value={subject.coveragePercent}
                  tone={selectedSubjectId === subject.id ? 'accent' : 'mute'}
                  height={4}
                />
              </span>
              <span className="scholr-num" style={{ fontFamily: 'var(--font-mono)', fontSize: '.82rem' }}>
                {subject.coveragePercent}%
              </span>
            </span>
          </Row>
        ))
      )}
    </Group>
  );
}
