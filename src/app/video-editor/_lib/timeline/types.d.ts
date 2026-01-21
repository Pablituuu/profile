import 'fabric';

declare module 'fabric' {
  export interface CanvasEvents {
    'track:created': {
      clipId: string;
      index: number;
      displayFrom: number;
    };
    'track:moved': {
      clipId: string;
      trackId: string;
      displayFrom: number;
    };
    'clip:movedToTrack': {
      clipId: string;
      trackId: string;
      displayFrom: number;
    };
    'timeline:updated': {
      tracks: any[];
    };
    'clip:droppedEmpty': {
      clipId: string;
    };
    'clip:modified': {
      clipId: string;
    };
  }
}
