export interface ViewportChangeInfo {
  left: number;
  scrollX: number;
  scrollY: number;
}

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
  extraMarginX?: number;
  extraMarginY?: number;
  initialOffsetX?: number;
  initialOffsetY?: number;
  onScrollChanged?: (info: ViewportChangeInfo) => void;
  onZoom?: (zoom: number) => void;
}

export interface RectDimensions {
  left: number;
  top: number;
  right: number;
  bottom: number;
}
