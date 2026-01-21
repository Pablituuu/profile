import {
  CENTER,
  LEFT,
  RIGHT,
  TOP,
  BOTTOM,
  TOriginX,
  TOriginY,
} from './constants';
import { Transform } from 'fabric';

export const resolveOrigin = (origin: TOriginX | TOriginY): number | string => {
  if (typeof origin === 'string') {
    switch (origin) {
      case LEFT:
      case TOP:
        return 0;
      case CENTER:
        return 0.5;
      case RIGHT:
      case BOTTOM:
        return 1;
      default:
        // Attempt to parse string '0.2'
        const parsed = parseFloat(origin);
        return isNaN(parsed) ? 0 : parsed;
    }
  }
  return origin;
};

export const isTransformCentered = (transform: Transform): boolean => {
  return (
    resolveOrigin(transform.originX) === resolveOrigin(CENTER) &&
    resolveOrigin(transform.originY) === resolveOrigin(CENTER)
  );
};
