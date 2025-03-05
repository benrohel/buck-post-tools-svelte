import { json } from 'stream/consumers';
import { fs } from '../lib/cep/node';

interface Tracker {
  to: { x: number[]; y: number[] };
  name: string;
  xpos: number;
  ypos: number;
}

interface LineData {
  [key: string]: string;
}

export const parseNukeTrackerToJson = (data: any): Tracker | null => {
  const curveRex = /{curve(.*?)(x\d+)(.*?)}/g;
  const dataRegex = /x\d+ /g;
  try {
    const lines = data.split('\n');
    let jsonData: LineData = {} as LineData;
    lines.forEach((line: string) => {
      const [key, ...rest] = line.split(' ');
      const dataPosition = rest.filter((x) => {
        return !isNaN(parseFloat(x)) || x != null;
      });
      console.log('dataPosition', dataPosition);
      if (key) {
        jsonData[key] = rest.join(' ').trim();
      }
    });
    console.log('jsonDate', jsonData);
    const res1 = Array.from(jsonData['to1'].matchAll(curveRex), (m) => m[3]);
    const res2 = Array.from(jsonData['to2'].matchAll(curveRex), (m) => m[3]);
    const res3 = Array.from(jsonData['to3'].matchAll(curveRex), (m) => m[3]);
    const res4 = Array.from(jsonData['to4'].matchAll(curveRex), (m) => m[3]);
    const tracker: any = {
      to1: {
        x: res1[0]
          .split(' ')
          .map((x) => parseFloat(x))
          .filter((x) => !isNaN(x)),
        y: res1[1]
          .split(' ')
          .map((x) => parseFloat(x))
          .filter((x) => !isNaN(x)),
      },
      to2: {
        x: res2[0]
          .split(' ')
          .map((x) => parseFloat(x))
          .filter((x) => !isNaN(x)),
        y: res2[1]
          .split(' ')
          .map((x) => parseFloat(x))
          .filter((x) => !isNaN(x)),
      },
      to3: {
        x: res3[0]
          .split(' ')
          .map((x) => parseFloat(x))
          .filter((x) => !isNaN(x)),
        y: res3[1]
          .split(' ')
          .map((x) => parseFloat(x))
          .filter((x) => !isNaN(x)),
      },
      to4: {
        x: res4[0]
          .split(' ')
          .map((x) => parseFloat(x))
          .filter((x) => !isNaN(x)),
        y: res4[1]
          .split(' ')
          .map((x) => parseFloat(x))
          .filter((x) => !isNaN(x)),
      },
      name: jsonData['name'],
      x: parseFloat(jsonData['xpos']),
      y: parseFloat(jsonData['ypos']),
    };
    return tracker;
  } catch (e) {
    console.error(e);
    return null;
  }
};
