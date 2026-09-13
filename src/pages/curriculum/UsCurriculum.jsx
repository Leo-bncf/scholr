import React from 'react';
import CurriculumPage from './CurriculumPage';
import { CURRICULA } from './data';

export default function UsCurriculum() {
  return <CurriculumPage curriculum={CURRICULA.us} />;
}
