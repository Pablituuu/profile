import { TransformActionHandler, controlsUtils } from 'fabric';
import { resolveOrigin, isTransformCentered } from './utils';
import { CENTER, LEFT, RIGHT, TIMELINE_CONSTANTS } from './constants';
import { useEditorStore } from '@/store/use-editor-store';

const { wrapWithFireEvent, getLocalPoint, wrapWithFixedAnchor } = controlsUtils;

/**
 * Action handler to change object's width
 * Needs to be wrapped with `wrapWithFixedAnchor` to be effective
 * @param {Event} eventData javascript event that is doing the transform
 * @param {Object} transform javascript object containing a series of information around the current transform
 * @param {number} x current mouse x position, canvas normalized
 * @param {number} y current mouse y position, canvas normalized
 * @return {Boolean} true if some change happened
 */
export const changeObjectWidth: TransformActionHandler = (
  _,
  transform,
  x,
  y
) => {
  const localPoint = getLocalPoint(
    transform,
    transform.originX,
    transform.originY,
    x,
    y
  );
  //  make sure the control changes width ONLY from it's side of target
  if (
    resolveOrigin(transform.originX) === resolveOrigin(CENTER) ||
    (resolveOrigin(transform.originX) === resolveOrigin(RIGHT) &&
      localPoint.x < 0) ||
    (resolveOrigin(transform.originX) === resolveOrigin(LEFT) &&
      localPoint.x > 0)
  ) {
    const { target } = transform,
      strokePadding =
        target.strokeWidth / (target.strokeUniform ? target.scaleX : 1),
      multiplier = isTransformCentered(transform) ? 2 : 1,
      oldWidth = target.width;

    let newWidth = Math.ceil(
      Math.abs((localPoint.x * multiplier) / target.scaleX) - strokePadding
    );

    const fromLeft = transform.corner === 'ml';
    if (target.left < 0) return false;

    if (fromLeft) {
      // check if the object is out of the canvas (left side)
      const diffPos = oldWidth - newWidth;
      const nextLeft = target.left + diffPos;

      // Prevent moving before start 0
      if (nextLeft < 0) {
        // adjust width to reach exactly 0.
        newWidth = oldWidth + target.left;
        const maxPossibleWidth = target.width + target.left;
        target.set('width', maxPossibleWidth);
        target.set('left', 0); // Correctly snap to 0
        return true;
      }
    }

    // Minimum width check (e.g. 0.5s or specific min pixels)
    const MIN_PIXELS = 10; // TIMELINE_CONSTANTS.ELEMENT_MIN_WIDTH is 80, but maybe too large for resizing?
    // Let's us a small functional minimum to prevent 0-width crashes.

    if (newWidth < MIN_PIXELS) return false;

    target.set('width', Math.max(newWidth, MIN_PIXELS));

    return oldWidth !== target.width; // Return true if changed
  }
  return false;
};

export const changeWidth = wrapWithFireEvent(
  'resizing',
  wrapWithFixedAnchor(changeObjectWidth)
);

/**
 * Action handler to change transition's width with constraints (0.5s - 3s)
 * grows/shrinks symmetrically from both sides.
 */
export const changeTransitionWidth: TransformActionHandler = (
  _,
  transform,
  x,
  y
) => {
  const { target } = transform;

  // 1. Calculate the project-relative coordinates (accounting for scroll/zoom)
  const canvas = target.canvas;
  if (!canvas) return false;

  const vpt = canvas.viewportTransform;
  // projectX = (canvasX - translateX) / zoom. This is the UNZOOMED pixel position.
  const projectX = (x - vpt[4]) / vpt[0];

  // We MUST use the same scaling logic as canvas.ts (PPS * timeScale)
  // to ensure that the microsecond calculation matches the visual coordinate.
  const timeScale = (target as any).timeScale || 1;
  const pixelsPerSecond = TIMELINE_CONSTANTS.PIXELS_PER_SECOND * timeScale;

  // 2. LAZY INITIALIZATION of the fixed join point (anchor)
  let anchorUs = (transform as any)._transitionJoinPointUs;
  if (anchorUs === undefined) {
    const original = transform.original as any;
    const currentLeft =
      original.left !== undefined ? original.left : target.left;
    const currentWidth =
      original.width !== undefined ? original.width : target.width;
    const currentScaleX =
      original.scaleX !== undefined ? original.scaleX : target.scaleX;

    const initialCenterPixels =
      currentLeft + (currentWidth * currentScaleX) / 2;
    anchorUs = (initialCenterPixels / pixelsPerSecond) * 1_000_000;
    (transform as any)._transitionJoinPointUs = anchorUs;
  }

  // 3. Current mouse position in microseconds (project-relative)
  const currentPointerUs = (projectX / pixelsPerSecond) * 1_000_000;

  // 4. New duration in microseconds (symmetrical around the join point)
  let newDurationUs = Math.abs(currentPointerUs - anchorUs) * 2;

  // 5. Duration constraints in microseconds
  const MIN_DURATION = 500_000; // 0.5s
  let MAX_DURATION = 3_000_000; // 3s

  // --- NEIGHBOR DURATION CLAMPING ---
  // A transition shouldn't be longer than the clips it bridges.
  // We fetch neighbor clips from the store to calculate the dynamic limit.
  try {
    const { fromClipId, toClipId } = target as any;
    if (fromClipId || toClipId) {
      const studio = useEditorStore.getState().studio;
      if (studio) {
        let minNeighborDuration = Infinity;
        // This is a guess on studio API based on common patterns
        // If it fails, catch will handle it.
        const clips = (studio as any).getClips?.() || [];

        if (fromClipId) {
          const fromClip = clips.find((c: any) => c.id === fromClipId);
          if (fromClip)
            minNeighborDuration = Math.min(
              minNeighborDuration,
              fromClip.duration
            );
        }
        if (toClipId) {
          const toClip = clips.find((c: any) => c.id === toClipId);
          if (toClip)
            minNeighborDuration = Math.min(
              minNeighborDuration,
              toClip.duration
            );
        }

        if (minNeighborDuration !== Infinity) {
          MAX_DURATION = Math.min(MAX_DURATION, minNeighborDuration * 2);
        }
      }
    }
  } catch (e) {
    // Fallback to default MAX_DURATION if store access fails
  }

  newDurationUs = Math.max(MIN_DURATION, Math.min(MAX_DURATION, newDurationUs));

  // 6. Boundary clamping: ensure it doesn't cross the 0s start of timeline
  if (anchorUs - newDurationUs / 2 < 0) {
    newDurationUs = anchorUs * 2;
  }

  // 7. Convert back to visual PIXELS for Fabric
  const finalDisplayFromUs = anchorUs - newDurationUs / 2;
  const finalWidthPixels = (newDurationUs / 1_000_000) * pixelsPerSecond;
  const finalLeftPixels = (finalDisplayFromUs / 1_000_000) * pixelsPerSecond;

  // 8. Update target - Preserve floats for visual smoothness
  const original = transform.original as any;
  target.set({
    scaleX: original.scaleX || 1,
    width: finalWidthPixels / (original.scaleX || 1),
    left: finalLeftPixels,
  });

  target.setCoords();
  return true;
};

export const resizeTransitionWidth = wrapWithFireEvent(
  'resizing',
  changeTransitionWidth
);
