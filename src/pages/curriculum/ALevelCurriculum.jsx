import React from 'react';
import CurriculumPage from './CurriculumPage';
import { CURRICULA } from './data';

export default function ALevelCurriculum() {
  return <CurriculumPage curriculum={CURRICULA.alevel} />;
}
