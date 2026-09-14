import React from 'react';
import CurriculumPage from './CurriculumPage';
import { CURRICULA } from './data';

export default function IgcseCurriculum() {
  return <CurriculumPage curriculum={CURRICULA.igcse} />;
}
