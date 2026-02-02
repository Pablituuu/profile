import { ModifiedEvent, TMat2D, TPointerEvent } from 'fabric';
import { TimelineCanvas } from '../canvas';
import { limitViewport } from '../scrollbar/util';

const SHOULD_SCROLL_RANGE_X = 100;
const SHOULD_SCROLL_RANGE_Y = 40;
const MIN_SCROLL_SPEED = 3;
const MAX_SCROLL_SPEED = 25;
const SCROLL_SPEED_Y = 10;

interface ScrollState {
  scrollInterval: any | null;
}

const state: ScrollState = {
  scrollInterval: null,
};

function calculateScrollSpeed(distance: number): number {
  const speedRange = MAX_SCROLL_SPEED - MIN_SCROLL_SPEED;
  const speedFactor =
    (SHOULD_SCROLL_RANGE_X - distance) / SHOULD_SCROLL_RANGE_X;
  return MIN_SCROLL_SPEED + speedRange * Math.max(0, Math.min(1, speedFactor));
}

function startAutoScroll(
  timeline: TimelineCanvas,
  e: ModifiedEvent<TPointerEvent>
) {
  if (state.scrollInterval) {
    clearInterval(state.scrollInterval);
    state.scrollInterval = null;
  }

  const target = e.target;
  if (!target) return;

  state.scrollInterval = setInterval(() => {
    const vpt = [...(timeline.viewportTransform as TMat2D)] as TMat2D;
    const pointer = timeline.getViewportPoint(e.e!);

    let changed = false;
    let deltaX = 0;
    let deltaY = 0;

    // 1. Scroll right (Infinite as per requirement)
    if (pointer.x > timeline.width - SHOULD_SCROLL_RANGE_X) {
      const scrollSpeed = calculateScrollSpeed(timeline.width - pointer.x);
      deltaX = -scrollSpeed;
      changed = true;
    }

    // 2. Scroll left (Limited by scrollbar and origin)
    else if (pointer.x < SHOULD_SCROLL_RANGE_X) {
      if (vpt[4] < 0) {
        // Solo si hay scroll disponible hacia la izquierda
        const scrollSpeed = calculateScrollSpeed(pointer.x);
        deltaX = scrollSpeed;
        changed = true;
      }
    }

    // 3. Scroll down (Limited by scrollbar)
    if (pointer.y > timeline.height - SHOULD_SCROLL_RANGE_Y) {
      deltaY = -SCROLL_SPEED_Y;
      changed = true;
    }

    // 4. Scroll up (Limited by scrollbar and origin)
    else if (pointer.y < SHOULD_SCROLL_RANGE_Y) {
      if (vpt[5] < 0) {
        // Solo si hay scroll disponible hacia arriba
        deltaY = SCROLL_SPEED_Y;
        changed = true;
      }
    }

    if (changed) {
      const vpt_potential = [...vpt] as TMat2D;
      vpt_potential[4] += deltaX;
      vpt_potential[5] += deltaY;

      const isScrollingRight = deltaX < 0;

      const extraMarginX = timeline.scrollbars.extraMarginX;

      const limitedVpt = limitViewport(
        timeline,
        vpt_potential,
        timeline.scrollbars.offsetX,
        timeline.scrollbars.offsetY,
        extraMarginX,
        timeline.scrollbars.extraMarginY
      );

      const actualScrollX = limitedVpt[4] - vpt[4];
      const actualScrollY = limitedVpt[5] - vpt[5];

      if (actualScrollX !== 0 || actualScrollY !== 0) {
        const zoom = timeline.getZoom();

        // Adjust target position on canvas so it stays under mouse in viewport
        target.set({
          left: target.left - actualScrollX / zoom,
          top: target.top - actualScrollY / zoom,
        });

        timeline.setViewportTransform(limitedVpt);
        target.setCoords();
        timeline.requestRenderAll();
      }
    }
  }, 16);
}

function stopAutoScroll() {
  if (state.scrollInterval) {
    clearInterval(state.scrollInterval);
    state.scrollInterval = null;
  }
}

export function onMouseUpForScroll() {
  stopAutoScroll();
}

export function scrollOnMovingForScroll(
  this: TimelineCanvas,
  e: ModifiedEvent<TPointerEvent>
) {
  const target = e.target;
  if (target) {
    // RESTRICCIÓN: Clavamos a 0 si la posición es menor o igual a 0
    if (target.left <= 0) target.left = 0;
    if (target.top <= 0) target.top = 0;
  }
  startAutoScroll(this, e);
}

export function addScrollEvents(timeline: TimelineCanvas) {
  timeline.on('mouse:up', onMouseUpForScroll);
  timeline.on('object:moving', scrollOnMovingForScroll.bind(timeline));
}

export function removeScrollEvents(timeline: TimelineCanvas) {
  timeline.off('mouse:up', onMouseUpForScroll);
  timeline.off('object:moving', scrollOnMovingForScroll.bind(timeline));
}
