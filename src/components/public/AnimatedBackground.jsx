import React, { useEffect, useRef } from 'react';

export default function AnimatedBackground() {
  const blob1 = useRef(null);
  const blob2 = useRef(null);

  useEffect(() => {
    let x1 = 30, y1 = 30, vx1 = 0.06, vy1 = 0.04;
    let x2 = 65, y2 = 55, vx2 = -0.045, vy2 = 0.055;
    let raf;

    const animate = () => {
      x1 += vx1; y1 += vy1;
      x2 += vx2; y2 += vy2;

      if (x1 < 10 || x1 > 80) vx1 *= -1;
      if (y1 < 10 || y1 > 80) vy1 *= -1;
      if (x2 < 20 || x2 > 90) vx2 *= -1;
      if (y2 < 10 || y2 > 80) vy2 *= -1;

      if (blob1.current) {
        blob1.current.style.left = `${x1}%`;
        blob1.current.style.top = `${y1}%`;
      }
      if (blob2.current) {
        blob2.current.style.left = `${x2}%`;
        blob2.current.style.top = `${y2}%`;
      }

      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Primary large bloom */}
      <div
        ref={blob1}
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{
          width: '850px',
          height: '850px',
          background: 'radial-gradient(circle, rgba(59,130,246,0.60) 0%, rgba(99,102,241,0.35) 40%, transparent 68%)',
          filter: 'blur(65px)',
          transition: 'left 0.1s linear, top 0.1s linear',
        }}
      />
      {/* Secondary bloom */}
      <div
        ref={blob2}
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{
          width: '650px',
          height: '650px',
          background: 'radial-gradient(circle, rgba(14,165,233,0.55) 0%, rgba(59,130,246,0.28) 45%, transparent 70%)',
          filter: 'blur(55px)',
          transition: 'left 0.1s linear, top 0.1s linear',
        }}
      />
    </div>
  );
}