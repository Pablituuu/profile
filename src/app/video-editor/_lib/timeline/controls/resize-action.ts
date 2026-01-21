import { TransformActionHandler, controlsUtils } from 'fabric';
import { resolveOrigin, isTransformCentered } from './utils';
import { CENTER, LEFT, RIGHT } from './constants';

const { wrapWithFireEvent, getLocalPoint, wrapWithFixedAnchor } = controlsUtils;

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
    const MIN_PIXELS = 10;

    if (newWidth < MIN_PIXELS) return false;

    target.set('width', Math.max(newWidth, MIN_PIXELS));

    // Fire modification event if supported/needed
    // target.canvas?.fire("clip:modified", { clipId: (target as any).clipId });

    return oldWidth !== target.width; // Return true if changed
  }
  return false;
};

export const changeWidth = wrapWithFireEvent(
  'resizing',
  wrapWithFixedAnchor(changeObjectWidth)
);
