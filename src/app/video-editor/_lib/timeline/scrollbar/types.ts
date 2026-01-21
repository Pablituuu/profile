export interface ScrollbarOptions {
  barColor?: string;
  outlineColor?: string;
  outlineWidth?: number;
  showHorizontal?: boolean;
  showVertical?: boolean;
  minBarLength?: number;
  barThickness?: number;
  barSpacing?: number;
  contentPadding?: number;
  marginRight?: number;
  marginBottom?: number;
  initialOffsetX?: number;
  initialOffsetY?: number;
  onScrollChanged?: (scrollLeft: number) => void;
  onZoom?: (zoom: number) => void;
}

export interface RectDimensions {
  left: number;
  top: number;
  right: number;
  bottom: number;
}
