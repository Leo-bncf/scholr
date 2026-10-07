import React, { useState } from 'react';
import StatusChip from '@/components/app/StatusChip';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle2, ShieldCheck, Award } from 'lucide-react';
import { evaluateDiplomaConditions } from '@/utils/ibDiplomaRules';

/**
 * DiplomaProgress
 *
 * Tracks 45-point IB Diploma Programme requirements and passing rules.
 */
export default function DiplomaProgress({
  classes = [],
  grades = [],
  predictedGrades = [],
  tokGrade = 'B',
  eeGrade = 'B',
  casFulfilled = true,
}) {
  const [showConditions, setShowConditions] = useState(false);

  if (!classes || classes.length === 0) {
    return (
      <div
        className="scholr-focus"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--rule)',
          borderRadius: 'var(--radius-surface, 16px)',
          padding: 'var(--space-lg)',
          boxShadow: 'var(--lift-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2xs)', marginBottom: '0.2rem' }}>
          <Award style={{ width: '1rem', height: '1rem', color: 'var(--brand)' }} />
          <span className="scholr-label" style={{ color: 'var(--brand)', margin: 0 }}>IB Diploma</span>
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--ink)', margin: '0 0 var(--space-xs) 0' }}>
          Diploma Progress
        </h2>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.5 }}>
          No enrolled IB DP subjects detected. Once you are enrolled in your Higher Level and Standard Level courses, your diploma points and passing requirements will be tracked here in real time.
        </p>
      </div>
    );
  }

  // Map enrolled classes to diploma courses with resolved grades
  const courses = classes.map(c => {
    const isHl = c.subject?.level === 'HL' || c.name?.includes('HL');
    const pred = predictedGrades.find(p => p.class_id === c.id || p.subject_id === c.subject_id);
    const classGrades = grades.filter(g => g.class_id === c.id && g.ib_grade);
    const avgGrade = classGrades.length > 0
      ? Math.round(classGrades.reduce((s, g) => s + g.ib_grade, 0) / classGrades.length)
      : null;

    const hasRealGrade = pred?.predicted_ib_grade != null || avgGrade != null;
    const resolvedGrade = pred?.predicted_ib_grade ?? avgGrade ?? 5;

    return {
      id: c.id,
      name: c.subject?.name || c.name,
      level: isHl ? 'HL' : 'SL',
      grade: resolvedGrade,
      isPredicted: !!pred,
      isUnrecorded: !hasRealGrade,
    };
  });

  const evaluation = evaluateDiplomaConditions({
    courses,
    tokGrade,
    eeGrade,
    casFulfilled,
  });

  return (
    <div
      className="scholr-focus"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--rule)',
        borderRadius: 'var(--radius-surface, 16px)',
        padding: 'var(--space-lg)',
        boxShadow: 'var(--lift-sm)',
        transition: 'box-shadow 0.2s ease',
      }}
    >
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2xs)', marginBottom: '0.2rem' }}>
            <Award style={{ width: '1rem', height: '1rem', color: 'var(--brand)' }} />
            <span className="scholr-label" style={{ color: 'var(--brand)', margin: 0 }}>IB Diploma</span>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
            Diploma Requirements
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
          <StatusChip tone={evaluation.status}>
            {evaluation.statusLabel}
          </StatusChip>
        </div>
      </div>

      {/* Main Score Breakdown */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 'var(--space-md)',
          padding: 'var(--space-lg) 0 var(--space-md)',
          borderBottom: '1px solid var(--rule-soft)',
        }}
      >
        <div>
          <span className="scholr-label" style={{ color: 'var(--muted)', display: 'block', marginBottom: '0.2rem' }}>Total Points</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
            <span className="scholr-num" style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>
              {evaluation.totalPoints}
            </span>
            <span style={{ fontSize: '1rem', color: 'var(--muted)' }}>/ 45</span>
          </div>
          <span style={{ fontSize: '0.78rem', color: evaluation.totalPoints >= 24 ? 'var(--good)' : 'var(--crit)' }}>
            {evaluation.totalPoints >= 24 ? 'Pass mark met (≥ 24)' : `${24 - evaluation.totalPoints} pts to pass`}
          </span>
        </div>

        <div>
          <span className="scholr-label" style={{ color: 'var(--muted)', display: 'block', marginBottom: '0.2rem' }}>Higher Level (HL)</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
            <span className="scholr-num" style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>
              {evaluation.hlPoints}
            </span>
            <span style={{ fontSize: '1rem', color: 'var(--muted)' }}>/ {evaluation.isFourHl ? '14' : '12'}</span>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
            {evaluation.isFourHl ? '4 HL subjects' : '3 HL subjects'}
          </span>
        </div>

        <div>
          <span className="scholr-label" style={{ color: 'var(--muted)', display: 'block', marginBottom: '0.2rem' }}>Standard Level (SL)</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
            <span className="scholr-num" style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>
              {evaluation.slPoints}
            </span>
            <span style={{ fontSize: '1rem', color: 'var(--muted)' }}>/ {evaluation.isFourHl ? '5' : '9'}</span>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
            {evaluation.isFourHl ? '2 SL subjects' : '3 SL subjects'}
          </span>
        </div>

        <div>
          <span className="scholr-label" style={{ color: 'var(--muted)', display: 'block', marginBottom: '0.2rem' }}>Core Points (TOK & EE)</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
            <span className="scholr-num" style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--brand)', lineHeight: 1 }}>
              +{evaluation.coreBonus}
            </span>
            <span style={{ fontSize: '1rem', color: 'var(--muted)' }}>/ 3</span>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
            TOK {tokGrade} · EE {eeGrade}
          </span>
        </div>
      </div>

      {/* Course Grade Badges Strip */}
      <div style={{ paddingTop: 'var(--space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
          <span className="scholr-label" style={{ color: 'var(--muted)', margin: 0 }}>Contributing Subjects</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--faint)' }}>{courses.length} registered</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-xs)' }}>
          {courses.map(course => (
            <div
              key={course.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                background: 'var(--paper)',
                border: '1px solid var(--rule)',
              }}
            >
              <div style={{ minWidth: 0, paddingRight: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span
                    style={{
                      fontSize: '0.62rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      padding: '0.08rem 0.28rem',
                      borderRadius: '3px',
                      background: course.level === 'HL' ? 'var(--brand-sf)' : 'var(--surface-sunk)',
                      color: course.level === 'HL' ? 'var(--brand)' : 'var(--muted)',
                    }}
                  >
                    {course.level}
                  </span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {course.name}
                  </span>
                </div>
              </div>

              <span
                className="scholr-num"
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: course.grade <= 3 ? 'var(--warn)' : 'var(--ink)',
                }}
              >
                {course.grade}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actionable Recommendations if at risk */}
      {evaluation.recommendations.length > 0 && (
        <div
          style={{
            marginTop: 'var(--space-md)',
            padding: 'var(--space-sm) var(--space-md)',
            borderRadius: '8px',
            background: 'var(--warn-sf)',
            border: '1px solid var(--warn)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-xs)',
          }}
        >
          <AlertCircle style={{ width: '1.1rem', height: '1.1rem', color: 'var(--warn)', flexShrink: 0, marginTop: '0.1rem' }} />
          <div style={{ fontSize: '0.82rem', color: 'var(--ink)' }}>
            <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.15rem' }}>Notes for Diploma Award:</span>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', lineHeight: 1.4 }}>
              {evaluation.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Passing Rules Checklist Expander */}
      <div style={{ marginTop: 'var(--space-md)', borderTop: '1px solid var(--rule-soft)', paddingTop: 'var(--space-sm)' }}>
        <button
          type="button"
          onClick={() => setShowConditions(!showConditions)}
          className="scholr-focus"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            background: 'transparent',
            border: 'none',
            padding: '0.4rem 0',
            cursor: 'pointer',
            color: 'var(--muted)',
            fontSize: '0.82rem',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500 }}>
            <ShieldCheck style={{ width: '0.95rem', height: '0.95rem', color: evaluation.failedConditions.length === 0 ? 'var(--good)' : 'var(--warn)' }} />
            Official IBO Passing Criteria ({evaluation.conditions.length - evaluation.failedConditions.length}/{evaluation.conditions.length} satisfied)
          </span>
          {showConditions ? <ChevronUp style={{ width: '0.9rem', height: '0.9rem' }} /> : <ChevronDown style={{ width: '0.9rem', height: '0.9rem' }} />}
        </button>

        {showConditions && (
          <div style={{ marginTop: 'var(--space-xs)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {evaluation.conditions.map(cond => (
              <div
                key={cond.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.45rem 0.65rem',
                  borderRadius: '6px',
                  background: cond.passed ? 'var(--surface-sunk)' : 'var(--crit-sf)',
                  fontSize: '0.8rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {cond.passed ? (
                    <CheckCircle2 style={{ width: '0.9rem', height: '0.9rem', color: 'var(--good)', flexShrink: 0 }} />
                  ) : (
                    <AlertCircle style={{ width: '0.9rem', height: '0.9rem', color: 'var(--crit)', flexShrink: 0 }} />
                  )}
                  <div>
                    <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{cond.label}</span>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--muted)' }}>{cond.description}</span>
                  </div>
                </div>

                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: cond.passed ? 'var(--muted)' : 'var(--crit)',
                  }}
                >
                  {cond.current}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
