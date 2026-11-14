'use client';

import { useEffect, useRef, useState } from 'react';
import { resetVirtualInput, setVirtualAxis } from '@/game/input/virtualInput';

const RADIUS = 44;

/** On-screen stick for walking on phones and tablets. */
export function TouchJoystick() {
  const baseRef = useRef<HTMLDivElement>(null);
  const pointerId = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const move = (clientX: number, clientY: number) => {
    const rect = baseRef.current?.getBoundingClientRect();
    if (!rect) return;
    let dx = clientX - (rect.left + rect.width / 2);
    let dy = clientY - (rect.top + rect.height / 2);
    const distance = Math.hypot(dx, dy);
    if (distance > RADIUS) {
      dx = (dx / distance) * RADIUS;
      dy = (dy / distance) * RADIUS;
    }
    setKnob({ x: dx, y: dy });
    setVirtualAxis(dx / RADIUS, dy / RADIUS);
  };

  const release = () => {
    pointerId.current = null;
    setKnob({ x: 0, y: 0 });
    resetVirtualInput();
  };

  // If the finger is lost some other way (a notification, an app switch, a
  // system gesture), stop walking rather than leaving the stick held down.
  useEffect(() => {
    const stop = () => release();
    const onVisibility = () => document.hidden && stop();
    window.addEventListener('blur', stop);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('blur', stop);
      document.removeEventListener('visibilitychange', onVisibility);
      resetVirtualInput();
    };
  }, []);

  return (
    <div
      ref={baseRef}
      aria-hidden
      className="frame absolute bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-[calc(1.5rem+env(safe-area-inset-left))] z-30 h-28 w-28 touch-none bg-plum/70"
      onPointerDown={(e) => {
        pointerId.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (e.pointerId === pointerId.current) move(e.clientX, e.clientY);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
    >
      <div
        className="frame absolute left-1/2 top-1/2 h-12 w-12 bg-paper"
        style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
      />
    </div>
  );
}
