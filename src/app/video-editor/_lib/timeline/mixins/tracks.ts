import { TimelineCanvas } from '../canvas';
import { Track } from '../track';
import { Helper } from '../helper';
import { getHelperHeight } from '../utils/sizes';
import { TIMELINE_CONSTANTS } from '../controls/constants';

class TracksMixin {
  public renderTracks(this: TimelineCanvas, trackDataList: any[]) {
    // 1. Remove existing tracks and helpers
    const existingObjects = this.getObjects().filter(
      (obj) => obj instanceof Track || obj instanceof Helper
    );
    existingObjects.forEach((obj) => this.remove(obj));

    const canvasWidth = 1000000; // Ancho virtual muy grande para tracks infinitos

    // 2. Interleave helpers
    const tracksWithHelpers = trackDataList
      .flatMap((track, index) => [
        track,
        {
          id: `helper-${track.id}`,
          type: 'helper',
          index: index + 1, // Insertion index after this track
        },
      ])
      .slice(0, -1);

    let verticalPosition = TIMELINE_CONSTANTS.INITIAL_Y_OFFSET;

    // Render top helper
    const topHelper = new Helper({
      id: 'helper-line-top',
      kind: 'top',
      index: 0, // Insertion index at start
      top: verticalPosition - 1000,
      width: canvasWidth,
      height: 1000,
    });
    this.insertAt(0, topHelper);

    // Render tracks and helpers
    let trackCounter = 0;
    tracksWithHelpers.forEach((data) => {
      if (data.type === 'helper') {
        const helperHeight = getHelperHeight('center');
        const helper = new Helper({
          id: data.id,
          kind: 'center',
          index: data.index,
          top: verticalPosition,
          width: canvasWidth,
          height: helperHeight,
        });
        this.insertAt(0, helper);
        verticalPosition += helperHeight;
      } else {
        const trackHeight = TIMELINE_CONSTANTS.CLIP_HEIGHT;
        const track = new Track({
          id: data.id,
          name: data.name,
          type: data.type,
          clipIds: data.clipIds || [],
          index: data.index !== undefined ? data.index : trackCounter,
          width: canvasWidth,
          height: trackHeight,
          top: verticalPosition,
          fill: '#4f4f4f',
        });
        this.insertAt(0, track);
        verticalPosition += trackHeight;
        trackCounter++;
      }
    });

    // Render bottom helper
    const bottomHelper = new Helper({
      id: 'helper-line-bottom',
      kind: 'bottom',
      index: trackDataList.length, // Insertion index at end
      top: verticalPosition,
      width: canvasWidth,
      height: 1000,
    });
    this.insertAt(0, bottomHelper);

    this.renderAll();
  }
}

export default TracksMixin;
