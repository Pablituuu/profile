export const formatTimelineUnit = (seconds: number) => {
  const date = new Date(0);
  date.setSeconds(seconds);
  const hh =
    seconds >= 3600 ? date.getUTCHours().toString().padStart(2, '0') + ':' : '';
  const mm = date.getUTCMinutes().toString().padStart(2, '0');
  const ss = date.getUTCSeconds().toString().padStart(2, '0');
  return `${hh}${mm}:${ss}`;
};
