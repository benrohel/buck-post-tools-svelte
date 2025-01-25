import Timecode, { TIMECODE } from 'smpte-timecode';
const TICKS_SECOND = 254016000000;

export const gePremiereFramerate = (td: string): number => {
  switch (td) {
    case '23.976':
      return 110;
    case '24':
      return 100;
    case '25':
      return 101;
    case '29.97':
      return 102;
    case '30':
      return 104;
    case '59.94':
      return 106;
    default:
      return 100;
  }
};

export const gePremiereVideoFramerate = (td: string): number => {
  switch (td) {
    case '23.976':
      return 10594584000;
    case '24':
      return 10584000000;
    case '25':
      return 10160640000;
    case '29.97':
      return 8475667200;
    case '30':
      return 8467200000;
    case '59.94':
      return 4237833600;
    default:
      return 10584000000;
  }
};
export const getFramerate = (td: number): number => {
  switch (td) {
    case 23.976:
      return 23.976;
    case 24:
      return 24;
    case 29.97:
      return 29.97;
    case 30:
      return 30;
    case 100:
      return 24;
    case 101:
      return 25;
    case 102:
      return 29.97;
    case 103:
      return 29.97;
    case 104:
      return 30;
    case 105:
      return 50;
    case 106:
      return 59.94;
    case 107:
      return 59.94;
    case 108:
      return 60;
    case 110:
      return 23.976;
    default:
      return 24;
  }
};

export const createTimecode = (
  t: string | number,
  frameRate: number = 24,
  dropFrame: boolean = false
): Timecode.TimecodeInstance => {
  let TC = Timecode(0, 24);
  const fr = getFramerate(frameRate) as Timecode.FRAMERATE;

  if (typeof t === 'string') {
    const formattedTC = t.replaceAll(';', ':');
    TC = Timecode(formattedTC, fr, dropFrame);
  } else {
    TC = Timecode(t, fr, dropFrame);
  }

  if (TC) {
    return TC;
  } else {
    return Timecode(0, fr, false);
  }
};

export const getTimecodeInSeconds = (t: Timecode.TimecodeInstance): number => {
  return t.frameCount * (1 / t.frameRate);
};

export const getTimecodeInTicks = (t: Timecode.TimecodeInstance): string => {
  const frameTick = TICKS_SECOND / t.frameRate;
  return Math.round(t.frameCount * frameTick).toString();
};
