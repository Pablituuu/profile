import { TimelineCanvas } from '../canvas';
import { addGuidelineEvents, removeGuidelineEvents } from './guidelines';
import { addPlaceholderEvents, removePlaceholderEvents } from './placeholder';
import { addScrollEvents, removeScrollEvents } from './scrolling';
import { addResizeEvents, removeResizeEvents } from './resize';
import { addSelectionEvents, removeSelectionEvents } from './selection';
import { setState } from './internal';

export const addCanvasEvents = (timeline: TimelineCanvas) => {
  setState({ canvas: timeline as any }); // casting just in case of slight type differences
  addGuidelineEvents(timeline);
  addPlaceholderEvents(timeline);
  addScrollEvents(timeline);
  addResizeEvents(timeline);
  addSelectionEvents(timeline);
};

export const removeCanvasEvents = (timeline: TimelineCanvas) => {
  setState({ canvas: null });
  removeGuidelineEvents(timeline);
  removePlaceholderEvents(timeline);
  removeScrollEvents(timeline);
  removeResizeEvents(timeline);
  removeSelectionEvents(timeline);
};
