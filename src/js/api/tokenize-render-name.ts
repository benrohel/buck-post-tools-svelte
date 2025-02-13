import { evalES } from '../lib/utils/bolt';

const TOKEN_LIST: string[] = [
  'projectVersion',
  'projectName',
  'compName',
  '/',
  'date',
];

export const loadAeTokesn = async () => {
  const tokens = await evalES('getTokens()');
  return new Promise((resolve, reject) => {
    if (tokens.length === 0) {
      reject('No tokens found');
    }
    resolve(tokens);
  });
};

export const filePathFromTokens = (tokens: string[]) => {};
