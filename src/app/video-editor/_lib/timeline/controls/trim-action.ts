import { TransformActionHandler, controlsUtils } from 'fabric';
import { resolveOrigin, isTransformCentered } from './utils';
import { CENTER, LEFT, RIGHT } from './constants';
import { TIMELINE_CONSTANTS } from '../constants';

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

  if (
    resolveOrigin(transform.originX) === resolveOrigin(CENTER) ||
    (resolveOrigin(transform.originX) === resolveOrigin(RIGHT) &&
      localPoint.x < 0) ||
    (resolveOrigin(transform.originX) === resolveOrigin(LEFT) &&
      localPoint.x > 0)
  ) {
    const target: any = transform.target;

    const strokePadding =
      target.strokeWidth / (target.strokeUniform ? target.scaleX : 1);

    const multiplier = isTransformCentered(transform) ? 2 : 1;

    const oldWidth = target.width;

    let newWidth = Math.ceil(
      Math.abs((localPoint.x * multiplier) / target.scaleX) - strokePadding
    );

    const fromRight = transform.corner === 'mr';
    const fromLeft = transform.corner === 'ml';

    const zoom = target.timeScale || 1;
    const playbackRate = target.playbackRate || 1;
    const pixelsPerSecond = TIMELINE_CONSTANTS.PIXELS_PER_SECOND || 50;
    const microsecondsPerSecond = TIMELINE_CONSTANTS.MICROSECONDS_PER_SECOND;

    // Helper to convert pixels to microseconds for the content (respects playbackRate)
    const pixelsToContentUs = (pixels: number) => {
      return (
        (pixels / (pixelsPerSecond * zoom)) *
        microsecondsPerSecond *
        playbackRate
      );
    };

    if (newWidth < 1) return false;

    // Ensure target.trim is initialized
    if (!target.trim) {
      target.trim = { from: 0, to: 0 };
    }
    // Also might need sourceDuration
    if (typeof target.sourceDuration === 'undefined') {
      // Fallback or read from metadata if available on object
      // For now, assuming it exists or logic handles undefined
    }
    if (fromRight) {
      const diffSize = newWidth - oldWidth;
      const diffUs = pixelsToContentUs(diffSize);
      const sourceDuration = target.sourceDuration;

      const newTo = target.trim.to + diffUs;
      console.log(sourceDuration, newTo);

      if (newTo > sourceDuration) {
        console.log('trim.to exceeded sourceDuration');
        const maxDiffUs = sourceDuration - target.trim.to;
        const maxDiffSize =
          (maxDiffUs / microsecondsPerSecond / playbackRate) *
          pixelsPerSecond *
          zoom;
        newWidth = oldWidth + maxDiffSize;
        target.set('width', Math.max(newWidth, 0));
        target.trim.to = sourceDuration;
      } else {
        console.log('trim.to within bounds');
        target.set('width', Math.max(newWidth, 0));
        target.trim.to = newTo;
      }
      return true;
    }

    if (fromLeft) {
      const diffPos = oldWidth - newWidth;
      const nextLeft = target.left + diffPos;

      if (nextLeft < 0) {
        const maxDiffPos = -target.left;
        const permittedNewWidth = oldWidth - maxDiffPos;
        newWidth = permittedNewWidth;
      }

      const diffSize = newWidth - oldWidth;
      const diffUs = pixelsToContentUs(diffSize);
      const newFrom = target.trim.from - diffUs;

      if (newFrom < 0) {
        const maxDiffUs = target.trim.from;
        const maxDiffSize =
          (maxDiffUs / microsecondsPerSecond / playbackRate) *
          pixelsPerSecond *
          zoom;
        newWidth = oldWidth + maxDiffSize;
        const finalDiffPos = oldWidth - newWidth;
        target.set('width', Math.max(newWidth, 0));
        target.set('left', target.left + finalDiffPos);
        target.trim.from = 0;
      } else {
        const finalDiffPos = oldWidth - newWidth;
        target.set('width', Math.max(newWidth, 0));
        target.set('left', target.left + finalDiffPos);
        target.trim.from = newFrom;
      }
    }

    target.setCoords();

    if (target.onResize) {
      target.onResize();
    }

    // Calculate standard properties for the event
    const finalDuration = Math.round(
      (target.width / (pixelsPerSecond * zoom)) * microsecondsPerSecond
    );
    const finalDisplayFrom = Math.round(
      (target.left / (pixelsPerSecond * zoom)) * microsecondsPerSecond
    );

    // Notify modifying with full payload
    target.canvas?.fire('clip:modified', {
      clipId: target.clipId,
      trim: target.trim,
      duration: finalDuration,
      displayFrom: finalDisplayFrom,
    });

    return oldWidth !== target.width;
  }

  return false;
};

export const changeTrim = wrapWithFireEvent(
  'resizing',
  wrapWithFixedAnchor(changeObjectWidth)
);
