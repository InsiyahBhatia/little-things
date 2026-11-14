'use client';

import { ReactNode, useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

interface PanelProps {
  title: string;
  /** Short line under the title. */
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** Tailwind max-width class. */
  width?: string;
}

/**
 * A modal parchment panel. Traps focus while open and gives focus back to
 * whatever had it before, so keyboard players never lose their place.
 * Escape is handled globally by the keyboard shortcuts hook.
 */
export function Panel({ title, subtitle, onClose, children, width = 'max-w-lg' }: PanelProps) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const first = node?.querySelector<HTMLElement>('[data-autofocus]') ?? node;
    first?.focus({ preventScroll: true });

    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !node) return;
      const focusable = Array.from(
        node.querySelectorAll<HTMLElement>('button:not(:disabled), input, [tabindex]:not([tabindex="-1"])')
      );
      if (focusable.length === 0) return;
      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener('keydown', trap);
    return () => {
      document.removeEventListener('keydown', trap);
      previous?.focus?.({ preventScroll: true });
    };
  }, []);

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-night/60 p-4 pt-[max(1rem,env(safe-area-inset-top))]"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`panel panel-in flex max-h-[min(88dvh,640px)] w-full ${width} flex-col outline-none`}
      >
        <header className="flex items-start justify-between gap-4 border-b-[3px] border-ink px-5 pb-3 pt-4">
          <div>
            <h2 id={titleId} className="font-display text-xl">
              {title}
            </h2>
            {subtitle && <p className="mt-0.5 text-sm text-ink/75">{subtitle}</p>}
          </div>
          <button className="btn btn-sm btn-icon shrink-0" onClick={onClose} aria-label={`Close ${title.toLowerCase()}`}>
            <X className="h-4 w-4" strokeWidth={3} aria-hidden />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
