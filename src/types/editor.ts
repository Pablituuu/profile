import { IClip } from '@designcombo/video';

export interface ITrack {
  id: string;
  name: string;
  type: string;
  clipIds: string[];
}

export interface IStudioEventData {
  clip?: IClip;
  track?: ITrack;
}

export interface IDisplay {
  from: number;
  to: number;
}
