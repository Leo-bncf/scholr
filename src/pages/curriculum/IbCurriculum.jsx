import React from 'react';
import CurriculumPage from './CurriculumPage';
import { CURRICULA } from './data';

export default function IbCurriculum() {
  return <CurriculumPage curriculum={CURRICULA.ib} />;
}
