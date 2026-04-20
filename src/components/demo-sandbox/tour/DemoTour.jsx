import React, { forwardRef, useImperativeHandle } from 'react';
import useTourEngine from './useTourEngine';
import TourOverlay from './TourOverlay';

/**
 * Self-contained tour for a role. Parent can call `.replay()` via ref.
 */
const DemoTour = forwardRef(function DemoTour({ roleKey, steps }, ref) {
  const engine = useTourEngine({
    steps,
    storageKey: `scholr_demo_tour_${roleKey}`,
  });

  useImperativeHandle(ref, () => ({
    replay: () => engine.start(),
  }), [engine]);

  return (
    <TourOverlay
      active={engine.active}
      step={engine.step}
      stepIndex={engine.stepIndex}
      total={engine.total}
      rect={engine.rect}
      onNext={engine.next}
      onBack={engine.back}
      onDismiss={engine.dismiss}
    />
  );
});

export default DemoTour;