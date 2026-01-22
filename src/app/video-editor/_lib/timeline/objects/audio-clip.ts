import { Control } from 'fabric';
import { TimelineClip, TimelineClipProps } from './base-clip';

import { editorFont } from './objects-constants';

import { createTrimControls } from '../controls';

export class AudioClip extends TimelineClip {
  public isSelected: boolean = false;
  static createControls(): { controls: Record<string, Control> } {
    return { controls: createTrimControls() };
  }

  static ownDefaults = {
    rx: 10,
    ry: 10,
    objectCaching: false,
    borderColor: 'transparent',
    stroke: 'transparent',
    strokeWidth: 0,
    fill: '#1e3a8a',
    borderOpacityWhenMoving: 1,
    hoverCursor: 'default',
  };

  private peaks: number[] = [];
  private isLoadingPeaks: boolean = false;

  constructor(options: TimelineClipProps) {
    super(options);
    this.clipId = options.clipId || '';
    (this as any).type = AudioClip.type;
    this.set({
      // fill: options.fill || TRACK_COLORS.audio.solid,
      fill: '#1e3a8a',
    });
    console.log(this);
    this.initialize();
  }

  public async initialize(): Promise<void> {
    if (this.src) {
      await this.loadPeaks(this.src);
    }
  }

  private async loadPeaks(url: string) {
    if (this.isLoadingPeaks) return;
    this.isLoadingPeaks = true;

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioContext = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Set source duration in microseconds (seconds * 1_000_000) based on buffer duration
      // This is crucial for trim checks
      this.sourceDuration = audioBuffer.duration * 1_000_000;
      if (this.trim.to === 0 && this.sourceDuration > 0) {
        this.trim.to = this.sourceDuration;
      }

      const channelData = audioBuffer.getChannelData(0);
      const samples = 4000; // High resolution buffer to support wide clips
      const blockSize = Math.floor(channelData.length / samples);
      const newPeaks: number[] = [];
      let maxOverall = 0;

      for (let i = 0; i < samples; i++) {
        let max = 0;
        for (let j = 0; j < blockSize; j++) {
          const val = Math.abs(channelData[i * blockSize + j]);
          if (val > max) max = val;
        }
        if (max > maxOverall) maxOverall = max;
        newPeaks.push(max);
      }

      // Normalization: ensure the highest peak is 1.0
      const normalizedPeaks =
        maxOverall > 0 ? newPeaks.map((p) => p / maxOverall) : newPeaks;

      this.peaks = normalizedPeaks;
      this.set({ dirty: true });
      this.canvas?.requestRenderAll();
    } catch (error) {
      console.error('Error loading audio peaks:', error);
    } finally {
      this.isLoadingPeaks = false;
    }
  }

  public _render(ctx: CanvasRenderingContext2D) {
    super._render(ctx);
    this.drawWaveform(ctx);
    this.drawIdentity(ctx);
  }

  public drawWaveform(ctx: CanvasRenderingContext2D) {
    if (this.peaks.length === 0) return;

    ctx.save();
    const width = this.width;
    const height = this.height;

    // Create a clipping region to ensure waveform doesn't leak out of the clip
    ctx.beginPath();
    ctx.roundRect(-width / 2, -height / 2, width, height, this.rx || 0);
    ctx.clip();

    // Position waveform
    const xStart = -width / 2;
    const waveformHeight = height * 0.45;
    const yCenter = 10;

    ctx.translate(xStart, yCenter);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';

    const totalPeaks = this.peaks.length;
    const barGap = 1.5;

    // Calculate barWidth to perfectly fit the total width with gaps
    // Avoid using Math.max(1, ...) which was causing the overflow on small widths
    let barWidth = width / totalPeaks - barGap;

    // If bars are too thin to be visible, we reduce the number of peaks we draw
    // or we skip some to maintain a minimum bar width of 1px
    let step = 1;
    if (barWidth < 1) {
      barWidth = 1;
      // Step determines how many peaks we skip to fit 1px bars in the width
      step = Math.ceil(totalPeaks / (width / (barWidth + barGap)));
    }

    // Optimization: Calculate visible range based on zoom/viewport if needed
    // For now, simple culling could be added here if performance suffers

    for (let i = 0; i < totalPeaks; i += step) {
      const peak = this.peaks[i];
      const intensity = Math.pow(peak, 0.8);
      const barHeight = Math.max(2, intensity * waveformHeight);

      // Calculate X based on the index and step to stay within bounds
      const x = (i / totalPeaks) * width;
      const y = -barHeight / 2;

      // Skip drawing if outside visible bounds (simple check)
      if (x + barWidth < 0 || x > width) continue;

      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x, y, Math.max(0.5, barWidth), barHeight, barWidth / 2);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, Math.max(0.5, barWidth), barHeight);
      }
    }

    ctx.restore();
  }

  public drawIdentity(ctx: CanvasRenderingContext2D) {
    const svgPath = new Path2D(
      'M13.9326 0C14.264 0 14.5332 0.268239 14.5332 0.599609V11.4326L14.5293 11.5869C14.4912 12.353 14.17 13.08 13.625 13.625C13.0436 14.2064 12.2548 14.5332 11.4326 14.5332C10.6106 14.5331 9.82248 14.2062 9.24121 13.625C8.65985 13.0436 8.33301 12.2548 8.33301 11.4326C8.33309 10.6106 8.65992 9.8225 9.24121 9.24121C9.8225 8.65992 10.6106 8.33309 11.4326 8.33301C12.125 8.33301 12.792 8.56695 13.333 8.9873V4.5332H6.19922V11.4326C6.19922 12.2547 5.87325 13.0437 5.29199 13.625C4.71063 14.2064 3.92178 14.5332 3.09961 14.5332C2.27744 14.5332 1.48859 14.2064 0.907227 13.625C0.325965 13.0437 0 12.2547 0 11.4326C8.61069e-05 10.6107 0.326144 9.82247 0.907227 9.24121C1.48859 8.65985 2.27744 8.33301 3.09961 8.33301C3.79208 8.33301 4.45894 8.56685 5 8.9873V0.599609C5 0.268239 5.26824 0 5.59961 0H13.9326ZM3.09961 9.5332C2.5957 9.5332 2.11218 9.73352 1.75586 10.0898C1.39982 10.4461 1.1993 10.929 1.19922 11.4326C1.19922 11.9365 1.39964 12.4201 1.75586 12.7764C2.11218 13.1327 2.5957 13.333 3.09961 13.333C3.60352 13.333 4.08704 13.1327 4.44336 12.7764C4.79958 12.4201 5 11.9365 5 11.4326C4.99991 10.929 4.7994 10.4461 4.44336 10.0898C4.08704 9.73352 3.60352 9.5332 3.09961 9.5332ZM11.4326 9.5332C10.9288 9.53329 10.4461 9.7336 10.0898 10.0898C9.7336 10.4461 9.53329 10.9288 9.5332 11.4326C9.5332 11.9365 9.73352 12.42 10.0898 12.7764C10.4461 13.1325 10.9289 13.3329 11.4326 13.333C11.9365 13.333 12.42 13.1327 12.7764 12.7764C13.1327 12.42 13.333 11.9365 13.333 11.4326C13.3329 10.9289 13.1325 10.4461 12.7764 10.0898C12.42 9.73352 11.9365 9.5332 11.4326 9.5332ZM6.19922 3.33301H13.333V1.19922H6.19922V3.33301Z'
    );

    ctx.save();
    ctx.translate(-this.width / 2 + 10, -this.height / 2 + 8);

    // Icon
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fill(svgPath);

    // Label
    const filename = this.src
      ? this.src.split('/').pop()?.split('?')[0]
      : this.label || 'Audio';

    ctx.font = `400 12px ${editorFont.fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Clip text area
    ctx.beginPath();
    ctx.rect(20, 0, this.width - 40, 20);
    ctx.clip();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText(filename || 'Audio', 20, 0);

    ctx.restore();
  }

  public setSelected(selected: boolean) {
    this.isSelected = selected;
    this.set({ dirty: true });
  }
}
