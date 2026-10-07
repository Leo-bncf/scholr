import React, { useState } from 'react';
import { Group } from '@/components/app/AppShell';
import { calculateCoreBonus } from '@/utils/ibDiplomaRules';

const GRADES = ['A', 'B', 'C', 'D', 'E'];

/**
 * IBCoreMatrix
 *
 * Visual distribution of candidate predictions across the official IBO TOK x EE 3-point matrix.
 */
export default function IBCoreMatrix({ studentPredictions = [] }) {
  const [selectedCell, setSelectedCell] = useState(null);

  // Group students by TOK x EE coordinates
  const matrixCounts = {};
  GRADES.forEach(tok => {
    matrixCounts[tok] = {};
    GRADES.forEach(ee => {
      matrixCounts[tok][ee] = [];
    });
  });

  studentPredictions.forEach(sp => {
    const tok = (sp.tokGrade || 'B').toUpperCase();
    const ee = (sp.eeGrade || 'B').toUpperCase();
    if (matrixCounts[tok]?.[ee]) {
      matrixCounts[tok][ee].push(sp);
    }
  });

  return (
    <Group
      title="TOK × EE Matrix (Bonus Points)"
      action={
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2xs)' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>EE Grade (columns) →</span>
        </div>
      }
    >
      <div style={{ padding: 'var(--space-md)', overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'center',
            fontSize: '0.85rem',
            minWidth: '380px',
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  padding: '0.5rem',
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--muted)',
                  borderBottom: '1px solid var(--rule)',
                  textAlign: 'left',
                }}
              >
                TOK ↓ \ EE →
              </th>
              {GRADES.map(ee => (
                <th
                  key={ee}
                  style={{
                    padding: '0.5rem',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    color: 'var(--ink)',
                    borderBottom: '1px solid var(--rule)',
                    width: '17%',
                  }}
                >
                  {ee}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GRADES.map(tok => (
              <tr key={tok}>
                <td
                  style={{
                    padding: '0.6rem 0.5rem',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    color: 'var(--ink)',
                    borderBottom: '1px solid var(--rule-soft)',
                    textAlign: 'left',
                  }}
                >
                  {tok}
                </td>

                {GRADES.map(ee => {
                  const bonus = calculateCoreBonus(tok, ee);
                  const isFailing = bonus.isFailingCondition;
                  const studentsInCell = matrixCounts[tok]?.[ee] || [];
                  const count = studentsInCell.length;
                  const isSelected = selectedCell?.tok === tok && selectedCell?.ee === ee;

                  return (
                    <td
                      key={ee}
                      onClick={() => count > 0 && setSelectedCell({ tok, ee, students: studentsInCell, bonus })}
                      style={{
                        padding: '0.5rem',
                        borderBottom: '1px solid var(--rule-soft)',
                        borderLeft: '1px solid var(--rule-soft)',
                        background: isSelected
                          ? 'var(--brand-sf)'
                          : isFailing
                            ? (count > 0 ? 'var(--crit-sf)' : 'rgba(239, 68, 68, 0.04)')
                            : (count > 0 ? 'rgba(74, 114, 255, 0.06)' : 'transparent'),
                        cursor: count > 0 ? 'pointer' : 'default',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: isFailing ? 'var(--crit)' : 'var(--muted)',
                          }}
                        >
                          {isFailing ? 'Fail' : `+${bonus.bonusPoints}`}
                        </span>

                        {count > 0 && (
                          <span
                            className="scholr-num"
                            style={{
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              padding: '0.1rem 0.4rem',
                              borderRadius: '4px',
                              background: isFailing ? 'var(--crit)' : 'var(--brand)',
                              color: '#ffffff',
                              lineHeight: 1.2,
                            }}
                          >
                            {count}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Selected cell inspector */}
        {selectedCell && (
          <div
            style={{
              marginTop: 'var(--space-md)',
              padding: 'var(--space-sm) var(--space-md)',
              borderRadius: '8px',
              background: 'var(--paper)',
              border: '1px solid var(--rule)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span className="scholr-label" style={{ color: 'var(--brand)', margin: 0 }}>
                TOK Grade {selectedCell.tok} × EE Grade {selectedCell.ee} ({selectedCell.bonus.isFailingCondition ? 'Failing Condition' : `+${selectedCell.bonus.bonusPoints} points`})
              </span>
              <button
                type="button"
                onClick={() => setSelectedCell(null)}
                style={{ background: 'none', border: 'none', fontSize: '0.75rem', color: 'var(--muted)', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
              {selectedCell.students.map((st, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: '0.8rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    background: selectedCell.bonus.isFailingCondition ? 'var(--crit-sf)' : 'var(--surface-sunk)',
                    color: selectedCell.bonus.isFailingCondition ? 'var(--crit)' : 'var(--ink)',
                  }}
                >
                  {st.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Group>
  );
}
