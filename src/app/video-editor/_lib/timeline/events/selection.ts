import { ActiveSelection, FabricObject } from 'fabric';
import { TimelineCanvas } from '../canvas';

export function onSelectionCreated(this: TimelineCanvas) {
  const activeObject = this.getActiveObject();

  if (activeObject instanceof ActiveSelection) {
    activeObject.getObjects().forEach((obj: FabricObject) => {
      this.bringObjectToFront(obj);
    });
  } else {
    this.bringObjectToFront(activeObject as FabricObject);
  }

  if (activeObject instanceof ActiveSelection) {
    activeObject.set({
      hasControls: false,
      lockRotation: true,
      lockScalingX: true,
      lockScalingY: true,
      lockSkewingX: true,
      lockSkewingY: true,
      objectCaching: false,
    });
  }

  (this as any).fire('active-selection:created');
  this.requestRenderAll();
}

export function onSelectionCleared(this: TimelineCanvas) {
  (this as any).fire('active-selection:cleared');
  this.requestRenderAll();
}

export function addSelectionEvents(timeline: TimelineCanvas) {
  timeline.on('selection:created', onSelectionCreated.bind(timeline));
  timeline.on('selection:updated', onSelectionCreated.bind(timeline));
  timeline.on('selection:cleared', onSelectionCleared.bind(timeline));
}

export function removeSelectionEvents(timeline: TimelineCanvas) {
  timeline.off('selection:created', onSelectionCreated.bind(timeline));
  timeline.off('selection:updated', onSelectionCreated.bind(timeline));
  timeline.off('selection:cleared', onSelectionCleared.bind(timeline));
}
