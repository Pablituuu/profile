import { Canvas, type CanvasOptions, TPointerEvent } from 'fabric';
import { applyMixins } from './utils/apply-mixins';
import CanvasMixin from './mixins/canvas';
import TracksMixin from './mixins/tracks';
import { Scrollbars } from './scrollbar';
import { makeMouseWheel } from './scrollbar/util';
import { addCanvasEvents } from './events/events';
import { TIMELINE_CONSTANTS } from './controls/constants';
import { detectOverObject } from './utils/over-element';
import { isTouchEvent } from './utils/canvas';

export interface TimelineCanvas extends Canvas, CanvasMixin, TracksMixin {}

export class TimelineCanvas extends Canvas {
  public scrollbars: Scrollbars;

  constructor(element: string | HTMLCanvasElement, options?: CanvasOptions) {
    super(element, {
      ...options,
      backgroundColor: '#0a0a0a',
      selection: true,
      preserveObjectStacking: true,
    });

    this.scrollbars = new Scrollbars(this);
    this.on('mouse:wheel', makeMouseWheel(this));
    addCanvasEvents(this);
  }

  // detect if the mouse click does not land on any item -> clean the selection and generate another selection
  public __onMouseDown(e: TPointerEvent) {
    const point = this.getScenePoint(e);
    const target = this._activeObject;
    const activeObjects = this.getActiveObjects();

    if (activeObjects.length === 0) {
      super.__onMouseDown(e);
      return;
    }

    const { isOverObject: overActiveObject } = detectOverObject(
      point,
      activeObjects
    );

    if (target) {
      const handle = target?.findControl(
        this.getViewportPoint(e),
        isTouchEvent(e)
      );
      if (handle) {
        super.__onMouseDown(e);
        return;
      }
    }

    const items = this.getTrackItems();
    const { isOverObject: overAnyObject, overObjects } = detectOverObject(
      point,
      items
    );

    if (overAnyObject) {
      if (overActiveObject) {
        super.__onMouseDown(e);
      } else {
        // Switch selection to the new object we clicked on
        const newTarget = overObjects[0];
        this.setActiveObject(newTarget);
        this.requestRenderAll();
        super.__onMouseDown(e);
      }
    } else {
      // Clicked on empty space: clear selection
      this.discardActiveObject();
      this.requestRenderAll();
      // Initialize internal group selector for selection box
      (this as any)._groupSelector = {
        x: point.x,
        y: point.y,
        deltaY: 0,
        deltaX: 0,
      };
      super.__onMouseDown(e);
    }
  }

  public getTrackItems() {
    return this.getClips();
  }

  public resize(width: number, height: number) {
    this.setDimensions({ width, height });
    this.renderAll();
  }

  public setZoom(zoomLevel: number) {
    const pixelsPerSec = TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel;

    this.getObjects().forEach((obj) => {
      // Update zoom reference for calculations
      (obj as any).zoom = zoomLevel;

      // Check if it's a clip (has startUs and durationUs)
      if (
        (obj as any).startUs !== undefined &&
        (obj as any).durationUs !== undefined
      ) {
        const startSec = (obj as any).startUs / 1_000_000;
        const durationSec = (obj as any).durationUs / 1_000_000;

        obj.set({
          left: ((obj as any).startUs * pixelsPerSec) / 1_000_000,
          width: ((obj as any).durationUs * pixelsPerSec) / 1_000_000,
        });
        obj.setCoords();
      }
    });

    this.renderAll();
  }
}

applyMixins(TimelineCanvas, [CanvasMixin, TracksMixin]);

export default TimelineCanvas;
