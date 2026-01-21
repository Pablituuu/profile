import {
  Canvas,
  CanvasOptions,
  classRegistry,
  type TMat2D,
  type TPointerEventInfo,
} from 'fabric';
import type { FabricObject } from 'fabric';
import * as Objects from './objects';
import { TimelineScrollbars } from './scrollbar';
import { ScrollbarOptions } from './scrollbar/types';
import { constrainViewport, setupWheelControl } from './scrollbar/util';
import { TIMELINE_CONSTANTS } from './constants';
import { IClip } from '@designcombo/video';
import * as DragHandlers from './handlers/drag-handler';
import * as ModifyHandlers from './handlers/modify-handler';

export class TimelineEngine extends Canvas {
  public get tracks() {
    return this._tracks;
  }

  public get clips() {
    return this._clips;
  }

  public static registerObjects() {
    classRegistry.setClass(Objects.TextClip, Objects.TextClip.type);
    classRegistry.setClass(Objects.AudioClip, Objects.AudioClip.type);
    classRegistry.setClass(Objects.ImageClip, Objects.ImageClip.type);
    classRegistry.setClass(Objects.TransitionClip, Objects.TransitionClip.type);
    classRegistry.setClass(Objects.EffectClip, Objects.EffectClip.type);
    classRegistry.setClass(Objects.Placeholder, Objects.Placeholder.type);
    classRegistry.setClass(Objects.VideoClip, Objects.VideoClip.type);
  }

  public enableGuideRedraw: boolean = true;
  public activeSeparatorIndex: number | null = null;
  public maxDuration: number = 0;
  private _scrollbars?: TimelineScrollbars;
  private _wheelHandler?: (
    e: WheelEvent | TPointerEventInfo<WheelEvent>
  ) => void;
  private _viewportChangeCallback?: (info: {
    left: number;
    scrollX: number;
    scrollY: number;
  }) => void;
  private _zoomChangeCallback?: (zoom: number) => void;
  private _tracks: any[] = [];
  private _clips: Record<string, IClip> = {};
  private _isRefreshing: boolean = false;
  private _isInternalSelection: boolean = false;
  private _trackRegions: Array<{ id: string; top: number; bottom: number }> =
    [];
  private _placeholderGuide?: Objects.Placeholder;
  private _currentTrackId?: string;
  private _originTrackId?: string;
  private _dragAutoScrollRaf: number | null = null;
  private _lastPointer: { x: number; y: number } | null = null;
  private _isSelectingArea: boolean = false;
  private _clipObjects: Map<string, any> = new Map();
  private _scrollOptions?: ScrollbarOptions;

  constructor(
    canvasEl: HTMLCanvasElement,
    options: Partial<CanvasOptions> = {}
  ) {
    super(canvasEl, {
      ...options,
      backgroundColor: '#0a0a0a',
      selection: true,
    });
    this._initPlaceholder();
    this._initInteractionHandlers();

    // Bind this context for auto-scroll loop
    this._handleDragAutoScroll = this._handleDragAutoScroll.bind(this);
  }

  private _initPlaceholder() {
    this._placeholderGuide = new Objects.Placeholder({
      clipId: 'drag-guide',
      width: 0,
      height: 60,
      left: 0,
      top: 0,
    });
    this.add(this._placeholderGuide);
  }

  private _initInteractionHandlers() {
    this.on('object:moving', (opt) => {
      const e = opt.e as MouseEvent | PointerEvent | TouchEvent;
      const pointer = 'clientX' in e ? e : (e as TouchEvent).touches[0];
      this._lastPointer = { x: pointer.clientX, y: pointer.clientY };
      this._startDragAutoScroll();
      DragHandlers.handleDragging(this, opt);
      this._handleObjectMoving(opt); // Keep existing tracking logic for now if needed, or merge
    });

    this.on('mouse:up', () => {
      this._stopDragAutoScroll();
      this._handleMouseUp();
    });

    // ... inside _initInteractionHandlers
    this.on('object:modified', (opt) => {
      // Block events during refresh to prevent recursion/crash
      if (!opt || this._isRefreshing) return;

      this._stopDragAutoScroll();
      ModifyHandlers.handleTrackRelocation(this, opt);
      ModifyHandlers.handleClipModification(this, opt);
    });

    this.on('track:created', (opt) => {
      this.addNewTrack(opt);
    });

    this.on('clip:movedToTrack', (opt) => {
      this.moveClipToTrack(opt);
    });

    this.on('selection:created', (opt) => {
      if (this._isRefreshing || this._isInternalSelection) return;
      const selectedIds = opt.selected
        ?.map((obj: any) => obj.clipId)
        .filter(Boolean);
      (this as any).fire('selection:changed', {
        selectedIds: selectedIds || [],
      });
    });

    this.on('selection:updated', (opt) => {
      if (this._isRefreshing || this._isInternalSelection) return;
      const selectedIds = opt.selected
        ?.map((obj: any) => obj.clipId)
        .filter(Boolean);
      (this as any).fire('selection:changed', {
        selectedIds: selectedIds || [],
      });
    });

    this.on('selection:cleared', () => {
      if (this._isRefreshing || this._isInternalSelection) return;
      (this as any).fire('selection:changed', { selectedIds: [] });
    });
  }

  public addNewTrack(payload: {
    clipId: string;
    index: number;
    displayFrom: number;
  }) {
    const { clipId, index, displayFrom } = payload;
    const clip = this._clips[clipId];
    if (!clip) return;

    // Create new track
    const newTrackId = Math.random().toString(36).substr(2, 9);
    const newTrack = {
      id: newTrackId,
      type: clip.type === 'Audio' ? 'Audio' : 'Video', // Simple type inference
      clipIds: [clipId],
      muted: false,
    };

    // Remove clip from old track
    this._tracks.forEach((t) => {
      if (t.clipIds.includes(clipId)) {
        t.clipIds = t.clipIds.filter((id: string) => id !== clipId);
      }
    });

    // Cleanup empty tracks - THIS WAS MISSING
    this._tracks = this._tracks.filter((t) => t.clipIds.length > 0);

    // Insert new track
    const tracks = [...this._tracks];
    tracks.splice(index, 0, newTrack);

    // We update internal state. In a real app this should propagate to store.
    // But for visual consistency we update here + emit 'timeline:updated'?
    this._tracks = tracks;
    this.refreshTimeline();

    this.fire('timeline:updated', { tracks });
  }

  public moveClipToTrack(payload: {
    clipId: string;
    trackId: string;
    displayFrom: number;
  }) {
    const { clipId, trackId, displayFrom } = payload;
    const clip = this._clips[clipId];
    if (!clip) return;

    // Update clip display inside the clip object for now (simplified)
    clip.display.from = displayFrom;
    clip.display.to = displayFrom + (clip.display.to - clip.display.from);

    // Remove from old track
    this._tracks.forEach((t) => {
      if (t.clipIds.includes(clipId)) {
        t.clipIds = t.clipIds.filter((id: string) => id !== clipId);
      }
    });

    // Add to new track
    const targetTrack = this._tracks.find((t) => t.id === trackId);
    if (targetTrack) {
      targetTrack.clipIds.push(clipId);
    }

    // Cleanup empty tracks
    this._tracks = this._tracks.filter((t) => t.clipIds.length > 0);

    this.fire('timeline:updated', { tracks: this._tracks });
    this.refreshTimeline();
  }

  private _handleObjectMoving(e: any) {
    // Existing Placeholder Logic
    const target = e.target;
    if (
      !target ||
      target === this._placeholderGuide ||
      target.type === 'track-bg'
    )
      return;

    // If we have an active helper (inserting new track), hide placeholder
    const activeHelper = this.getObjects().find(
      (obj: any) => obj.isHelper && obj.fill !== 'transparent'
    );

    if (activeHelper) {
      if (this._placeholderGuide) {
        this._placeholderGuide.set({ visible: false });
      }
      return;
    }

    const pointer = this.getPointer(e.e);
    const track = this._trackRegions.find(
      (r) => pointer.y >= r.top && pointer.y <= r.bottom
    );

    if (track && this._placeholderGuide) {
      this._currentTrackId = track.id;

      this._placeholderGuide.set({
        visible: true,
        left: target.left,
        top: track.top,
        width: target.width * (target.scaleX || 1),
        height: target.height || 60,
      });
      this._placeholderGuide.setCoords();
    } else if (this._placeholderGuide) {
      this._placeholderGuide.set({ visible: false });
      this._currentTrackId = undefined;
    }
    this.requestRenderAll();
  }

  private _handleMouseUp() {
    if (this._placeholderGuide) {
      this._placeholderGuide.set({ visible: false });
    }

    this._originTrackId = undefined;
    this._currentTrackId = undefined;
  }

  // --- Auto Scroll Implementation ---

  private _startDragAutoScroll() {
    if (this._dragAutoScrollRaf) return;
    const step = () => {
      this._handleDragAutoScroll();
      this._dragAutoScrollRaf = requestAnimationFrame(step);
    };
    this._dragAutoScrollRaf = requestAnimationFrame(step);
  }

  private _stopDragAutoScroll() {
    if (this._dragAutoScrollRaf) {
      cancelAnimationFrame(this._dragAutoScrollRaf);
      this._dragAutoScrollRaf = null;
    }
    this._lastPointer = null;
    this._isSelectingArea = false;
  }

  private _handleDragAutoScroll() {
    if (!this._lastPointer) return;

    const viewportWidth = this.width;
    const threshold = 60;
    const maxSpeed = 30;

    // Get canvas element position to calculate relative mouse position
    const rect = this.getElement().getBoundingClientRect();
    const x = this._lastPointer.x - rect.left;
    const y = this._lastPointer.y - rect.top;

    let deltaX = 0;
    let deltaY = 0;

    if (x < threshold) {
      // Don't autoscroll left if we are already at the beginning (vpt[4] >= 0)
      if (this.viewportTransform[4] < 0) {
        deltaX = -maxSpeed * (1 - Math.max(0, x) / threshold);
      }
    } else if (x > viewportWidth - threshold) {
      deltaX = maxSpeed * (1 - Math.max(0, viewportWidth - x) / threshold);
    }

    // if (y < threshold) {
    //   deltaY = -maxSpeed * (1 - Math.max(0, y) / threshold);
    // } else if (y > viewportHeight - threshold) {
    //   deltaY = maxSpeed * (1 - Math.max(0, viewportHeight - y) / threshold);
    // }

    if (deltaX !== 0 || deltaY !== 0) {
      const vpt = this.viewportTransform.slice(0) as TMat2D;
      vpt[4] -= deltaX;
      vpt[5] -= deltaY;

      // Apply constraints to auto-scroll
      const limitedVpt = constrainViewport(this, vpt, {
        offsetX: this._scrollOptions?.initialOffsetX ?? 0,
        offsetY: this._scrollOptions?.initialOffsetY ?? 0,
        extraMarginX: this._scrollOptions?.extraMarginX ?? 0,
        extraMarginY: this._scrollOptions?.extraMarginY ?? 0,
      });

      this.setViewportTransform(limitedVpt);
      this.requestRenderAll();
    }
  }

  public initScrollbars(options: ScrollbarOptions = {}) {
    this._scrollOptions = {
      initialOffsetX: options.initialOffsetX ?? 0,
      initialOffsetY: options.initialOffsetY ?? 0,
      extraMarginX: options.extraMarginX ?? 0,
      extraMarginY: options.extraMarginY ?? 0,
      barThickness: options.barThickness ?? 8,
      barColor: options.barColor ?? 'rgba(255, 255, 255, 0.4)',
      onScrollChanged: (info) => {
        this._viewportChangeCallback?.(info);
      },
      onZoom: (zoom) => {
        this._zoomChangeCallback?.(zoom);
      },
      ...options,
    };
    const scrollOptions = this._scrollOptions!;

    // Setup wheel control (pan and zoom)
    this._wheelHandler = setupWheelControl(this, {
      offsetX: scrollOptions.initialOffsetX,
      offsetY: scrollOptions.initialOffsetY,
      extraMarginX: scrollOptions.extraMarginX,
      extraMarginY: scrollOptions.extraMarginY,
      onZoom: (zoom) => this._zoomChangeCallback?.(zoom),
    });
    this.on('mouse:wheel', this._wheelHandler);

    // Initialize custom scrollbars
    this._scrollbars = new TimelineScrollbars(this, scrollOptions);

    // Apply initial offset if any
    if (
      scrollOptions.initialOffsetX !== 0 ||
      scrollOptions.initialOffsetY !== 0
    ) {
      const vpt = this.viewportTransform.slice(0) as TMat2D;
      vpt[4] = scrollOptions.initialOffsetX!;
      vpt[5] = scrollOptions.initialOffsetY!;
      this.setViewportTransform(vpt);
      this.requestRenderAll();
    }
  }

  handleWheel(e: WheelEvent) {
    this._wheelHandler?.(e);
  }

  public onViewportChange(
    callback: (info: { left: number; scrollX: number; scrollY: number }) => void
  ) {
    this._viewportChangeCallback = callback;
  }

  public onZoomChange(callback: (zoom: number) => void) {
    this._zoomChangeCallback = callback;
  }

  public setScroll(scrollX?: number, scrollY?: number) {
    const vpt = this.viewportTransform.slice(0) as TMat2D;
    const zoom = vpt[0];
    if (scrollX !== undefined) {
      vpt[4] = -scrollX + (this._scrollOptions?.initialOffsetX ?? 0) * zoom;
    }
    if (scrollY !== undefined) {
      vpt[5] = -scrollY + (this._scrollOptions?.initialOffsetY ?? 0) * zoom;
    }

    const limitedVpt = constrainViewport(this, vpt, {
      offsetX: this._scrollOptions?.initialOffsetX ?? 0,
      offsetY: this._scrollOptions?.initialOffsetY ?? 0,
      extraMarginX: this._scrollOptions?.extraMarginX ?? 0,
      extraMarginY: this._scrollOptions?.extraMarginY ?? 0,
    });

    this.setViewportTransform(limitedVpt);
    this.requestRenderAll();
  }

  public disposeScrollbars() {
    if (this._wheelHandler) {
      this.off('mouse:wheel', this._wheelHandler);
      this._wheelHandler = undefined;
    }
    if (this._scrollbars) {
      this._scrollbars.dispose();
      this._scrollbars = undefined;
    }
  }

  public clearSeparatorHighlights() {
    this.getObjects().forEach((obj: any) => {
      if (obj.isHelper) {
        obj.set('fill', 'transparent');
      }
    });
    this.requestRenderAll();
  }

  public setActiveSeparatorIndex(index: number | null) {
    this.activeSeparatorIndex = index;
  }

  public setTimeline(tracks: any[], clips: any, duration?: number) {
    this._tracks = tracks.map((t, i) => ({
      ...t,
      id: t.id || `track-${i}`,
    }));

    if (Array.isArray(clips)) {
      this._clips = clips.reduce(
        (acc, clip) => {
          if (clip) {
            const id = clip.id || clip._id;
            if (id) acc[id] = clip;
          }
          return acc;
        },
        {} as Record<string, any>
      );
    } else if (clips && typeof clips === 'object') {
      this._clips = clips;
    } else {
      this._clips = {};
    }

    // Calculate max duration from clips or use provided duration
    if (duration !== undefined) {
      this.maxDuration = duration;
    } else {
      let max = 0;
      Object.values(this._clips).forEach((clip) => {
        if (clip.display.to > max) max = clip.display.to;
      });
      this.maxDuration = max;
    }

    this.refreshTimeline();
  }

  public get trackRegions() {
    return this._trackRegions;
  }

  public refreshTimeline() {
    // 0. Capture current selection
    const activeObjects = this.getActiveObjects();
    const selectedIds = activeObjects
      .map((obj: any) => obj.clipId)
      .filter(Boolean);

    this._isRefreshing = true;
    try {
      // 1. Clear current clip objects & helpers
      this._clipObjects.clear();
      const objects = this.getObjects();
      objects.forEach((obj) => {
        if (
          ((obj as any).clipId && obj !== this._placeholderGuide) ||
          (obj as any).isHelper
        ) {
          this.remove(obj);
        }
      });

      // 2. Clear tracks (if we draw them as objects)
      objects.forEach((obj) => {
        if (obj.type === 'track-bg') {
          this.remove(obj);
        }
      });

      const pixelsPerSecond = TIMELINE_CONSTANTS.PIXELS_PER_SECOND;
      const trackHeight = 60; // Adjusted to a more standard height
      const helperHeight = 16; // Height for helper zones

      this._trackRegions = [];
      let currentTop = 10;

      // Top Helper
      const topHelper = new Objects.Helper({
        id: 'helper-top',
        kind: 'top',
        separatorIndex: 0,
        left: 0,
        top: currentTop,
        width: 100000,
        height: helperHeight,
      });
      this.add(topHelper);
      this.sendObjectToBack(topHelper);
      currentTop += helperHeight;

      this._tracks.forEach((track: any, index: number) => {
        const top = currentTop;

        this._trackRegions.push({
          id: track.id || `track-${index}`,
          top,
          bottom: top + trackHeight,
        });

        // Draw track background
        const trackBg = new Objects.TimelineClip({
          clipId: `track-${index}`,
          label: `Track ${index}`,
          left: 0,
          top: top,
          width: 100000,
          height: trackHeight,
          fill: '#121212',
          selectable: false,
          evented: false,
          hasControls: false,
          lockMovementX: true,
          lockMovementY: true,
        });
        (trackBg as any).type = 'track-bg';
        this.add(trackBg);
        this.sendObjectToBack(trackBg); // Ensure track bg is behind clips

        currentTop += trackHeight;

        // Center/Bottom Helper
        const isLast = index === this._tracks.length - 1;
        const helper = new Objects.Helper({
          id: isLast ? 'helper-bottom' : `helper-${index}`,
          kind: isLast ? 'bottom' : 'center',
          separatorIndex: index + 1,
          left: 0,
          top: currentTop,
          width: 100000,
          height: helperHeight,
        });
        this.add(helper);
        this.sendObjectToBack(helper);
        currentTop += helperHeight;

        // Draw clips for this track
        if (track.clipIds) {
          track.clipIds.forEach((clipId: string) => {
            const clipData = this._clips[clipId] as any;
            if (!clipData) {
              console.warn(
                `[TimelineEngine] Clip ${clipId} not found in store. Available keys:`,
                Object.keys(this._clips)
              );
              return;
            }

            const left = (clipData.display.from / 1_000_000) * pixelsPerSecond;
            const width =
              ((clipData.display.to - clipData.display.from) / 1_000_000) *
              pixelsPerSecond;
            const type = (clipData.type || '').toLowerCase();

            let clipObj: any;

            switch (type) {
              case 'text':
              case 'caption':
                clipObj = new Objects.TextClip({
                  clipId: clipData.id,
                  left,
                  top,
                  width,
                  height: trackHeight,
                  label: clipData.text || clipData.name || 'Text',
                });
                break;
              case 'audio':
                clipObj = new Objects.AudioClip({
                  clipId: clipData.id,
                  left,
                  top,
                  width,
                  height: trackHeight,
                  label: clipData.name || 'Audio',
                  src: clipData.src,
                  trim: {
                    from: 0,
                    to: clipData.display.to - clipData.display.from,
                  },
                });
                break;
              case 'image':
              case 'placeholder':
                clipObj = new Objects.ImageClip({
                  clipId: clipData.id,
                  left,
                  top,
                  width,
                  height: trackHeight,
                  label: clipData.name || 'Media',
                  sourceUrl: clipData.src || '',
                });
                break;
              case 'transition':
                clipObj = new Objects.TransitionClip({
                  clipId: clipData.id,
                  label: 'Transition',
                  left: left - 25,
                  top: top + (trackHeight - 50) / 2,
                  width: 50,
                  height: 50,
                });
                break;
              case 'effect':
                clipObj = new Objects.EffectClip({
                  clipId: clipData.id,
                  label: clipData.name || 'Effect',
                  left,
                  top,
                  width,
                  height: trackHeight,
                });
                break;

              case 'video':
                clipObj = new Objects.VideoClip({
                  clipId: clipData.id,
                  left,
                  top,
                  width,
                  height: trackHeight,
                  label: clipData.name || 'Video',
                  sourceUrl: clipData.src || '',
                  trim: {
                    from: 0,
                    to: clipData.display.to - clipData.display.from,
                  },
                });
                break;
              default:
                clipObj = new Objects.TimelineClip({
                  clipId: clipData.id,
                  left,
                  top,
                  width,
                  height: trackHeight,
                  fill: '#333',
                  label: clipData.name || 'Clip',
                });
            }

            if (clipObj) {
              this.add(clipObj);
              this._clipObjects.set(clipData.id, clipObj);
            }
          });
        }
      });
    } finally {
      this._isRefreshing = false;
      // 3. Restore selection
      if (selectedIds.length > 0) {
        this.selectClips(selectedIds);
      }
      this.requestRenderAll();
    }
  }

  public selectClips(clipIds: string[]) {
    // Avoid redundant updates
    const currentActive = this.getActiveObjects();
    const currentIds = currentActive
      .map((obj: any) => obj.clipId)
      .filter(Boolean);

    const isSame =
      clipIds.length === currentIds.length &&
      clipIds.every((id) => currentIds.includes(id));

    if (isSame) return;

    this.discardActiveObject();

    if (clipIds.length === 0) {
      this.requestRenderAll();
      return;
    }

    this._isInternalSelection = true;
    try {
      const objectsToSelect: any[] = [];
      for (const id of clipIds) {
        const obj = this._clipObjects.get(id);
        if (obj) objectsToSelect.push(obj);
      }

      if (objectsToSelect.length === 1) {
        this.setActiveObject(objectsToSelect[0]);
      } else if (objectsToSelect.length > 1) {
        this.setActiveObject(objectsToSelect[0]); // Simple fallback - real implementation would use ActiveSelection
      }
    } finally {
      this.requestRenderAll();
      this._isInternalSelection = false;
    }
  }

  // Basic diagnostic method to verify initialization
  public getVersion() {
    return '0.0.1-fabric-shell';
  }
}

// Register custom objects once on module load
TimelineEngine.registerObjects();

export default TimelineEngine;
