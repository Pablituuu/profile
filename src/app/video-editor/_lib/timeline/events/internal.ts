import { Helper } from '../helper';
import { Track } from '../track';
import { Placeholder } from '../placeholder';
import { FabricObject, Canvas } from 'fabric';

export interface MovingState {
  canvas: Canvas | null;
  enableGuideRedraw: boolean;
  isPointerOverHelperTrack: boolean;
  draggingOverTrack: Track | Helper | null | undefined;
  placeholderMovingObjects: Placeholder[];
  primaryMovingObjects: FabricObject[];
  objectInitialPositions: Record<string, { top: number; left: number }>;
}

const state: MovingState = {
  canvas: null,
  enableGuideRedraw: true,
  isPointerOverHelperTrack: false,
  draggingOverTrack: null,
  placeholderMovingObjects: [],
  primaryMovingObjects: [],
  objectInitialPositions: {},
};

export const getState = () => state;
export const setState = (updates: Partial<MovingState>) => {
  Object.assign(state, updates);
};
