import { FabricObject, TPointerEvent } from 'fabric';
import { Helper } from '../helper';

export const clearPlaceholderObjects = (
  canvas: any,
  placeholderMovingObjects: any[]
) => {
  canvas.remove(...placeholderMovingObjects);
};

export interface CanvasSpacing {
  left: number;
  right: number;
}

export const isHelperTrack = (obj: any): obj is Helper => {
  return obj instanceof Helper;
};

export const clearTrackHelperGuides = (allObjects: FabricObject[]) => {
  allObjects.forEach((obj) => {
    if (isHelperTrack(obj)) {
      obj.setSelected(false);
    }
  });
};

export const calcCanvasSpacing = (
  payload?: Partial<CanvasSpacing>
): CanvasSpacing => {
  const defaultSpacing = {
    left: 16,
    right: 80,
  };
  return Object.assign({}, defaultSpacing, payload);
};

const touchEvents = ['touchstart', 'touchmove', 'touchend'];
export const isTouchEvent = (event: TPointerEvent) =>
  touchEvents.includes(event.type) ||
  (event as PointerEvent).pointerType === 'touch';
