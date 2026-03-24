'use client';

import { useEffect } from 'react';
import { playCalmUiClick } from '../lib/uiClickSound';

function isInsideUnitySurface(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('#unity-iframe, #unity-canvas'));
}

function shouldPlayForClick(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (isInsideUnitySurface(target)) return false;
  if (target.closest('[data-no-ui-sound]')) return false;
  // Option pick is handled by `change` on `<select>` so we don’t double-play.
  if (target.closest('option')) return false;

  const el =
    target.closest<HTMLElement>(
      'button, a[href], select, textarea, summary, label, [role="button"], [role="tab"], [role="menuitem"]'
    ) ?? target.closest<HTMLInputElement>('input');

  if (!el) return false;

  if (el.tagName === 'INPUT') {
    const type = (el as HTMLInputElement).type;
    if (type === 'hidden') return false;
    // Dragging a range fires many events; skip for calmer feel
    if (type === 'range') return false;
  }

  return true;
}

/**
 * Delegated listeners: subtle click on most interactive UI (not Unity canvas/iframe).
 */
export default function UiClickSoundProvider() {
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (shouldPlayForClick(e.target)) {
        playCalmUiClick();
      }
    };

    const onChange = (e: Event) => {
      const t = e.target;
      if (!(t instanceof HTMLSelectElement)) return;
      if (isInsideUnitySurface(t)) return;
      playCalmUiClick();
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('change', onChange, true);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('change', onChange, true);
    };
  }, []);

  return null;
}
