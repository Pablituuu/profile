import { Control, controlsUtils } from 'fabric';
import { drawVerticalLine } from './render';
import { changeWidth, resizeTransitionWidth } from './resize-action';
import { changeTrim } from './trim-action';

const { scaleSkewCursorStyleHandler } = controlsUtils;

export const createResizeControls = () => ({
  mr: new Control({
    x: 0.5,
    y: 0,
    actionHandler: changeWidth,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionName: 'resizing',
    render: drawVerticalLine,
    offsetX: -6,
  }),
  ml: new Control({
    x: -0.5,
    y: 0,
    actionHandler: changeWidth,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionName: 'resizing',
    render: drawVerticalLine,
    offsetX: 6,
  }),
});

export const createAudioControls = () => ({
  mr: new Control({
    x: 0.5,
    y: 0,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionName: 'resizing',
  }),
  ml: new Control({
    x: -0.5,
    y: 0,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionName: 'resizing',
  }),
});

export const createTrimControls = () => ({
  mr: new Control({
    x: 0.5,
    y: 0,
    render: drawVerticalLine,
    actionHandler: changeTrim,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionName: 'resizing',
    offsetX: -6,
  }),
  ml: new Control({
    x: -0.5,
    y: 0,
    render: drawVerticalLine,
    actionHandler: changeTrim,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionName: 'resizing',
    offsetX: 6,
  }),
});

export const createTransitionControls = () => ({
  mr: new Control({
    x: 0.5,
    y: 0,
    actionHandler: resizeTransitionWidth,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionName: 'resizing',
    render: drawVerticalLine,
    offsetX: -6,
  }),
  ml: new Control({
    x: -0.5,
    y: 0,
    actionHandler: resizeTransitionWidth,
    cursorStyleHandler: scaleSkewCursorStyleHandler,
    actionName: 'resizing',
    render: drawVerticalLine,
    offsetX: 6,
  }),
});
