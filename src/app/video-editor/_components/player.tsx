'use client';

import { RefObject } from 'react';

interface PlayerProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
}

export function Player({ canvasRef }: PlayerProps) {
  return (
    <div
      id="preview-container"
      style={{
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        id="preview-canvas"
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
}
