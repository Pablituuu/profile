import { Control, controlsUtils } from 'fabric';
import { drawVerticalLine } from './render';
import { changeTrim } from './trim-action';
import { changeWidth } from './resize-action';

const { scaleSkewCursorStyleHandler } = controlsUtils;

export const createResizeControls = () => {
  const mr = new Control({
    x: 0.5,
    y: 0,
    actionHandler: changeWidth,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionName: 'resizing',
    render: drawVerticalLine,
    offsetX: -8,
  });
  (mr as any).controlOrientation = 'right';

  const ml = new Control({
    x: -0.5,
    y: 0,
    actionHandler: changeWidth,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionName: 'resizing',
    render: drawVerticalLine,
    offsetX: 8,
  });
  (ml as any).controlOrientation = 'left';

  return { mr, ml };
};

export const createTrimControls = () => {
  const mr = new Control({
    x: 0.5,
    y: 0,
    render: drawVerticalLine,
    actionHandler: changeTrim,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionName: 'resizing',
    offsetX: -8,
  });
  (mr as any).controlOrientation = 'right';

  const ml = new Control({
    x: -0.5,
    y: 0,
    render: drawVerticalLine,
    actionHandler: changeTrim,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionName: 'resizing',
    offsetX: 8,
  });
  (ml as any).controlOrientation = 'left';

  return { mr, ml };
};
