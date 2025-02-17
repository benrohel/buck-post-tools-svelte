import { writable } from 'svelte/store';
import { SHARED_FOLDER } from '../api/buck-libray';
import { fs, path, os } from '../lib/cep/node';

export const buck5Server = writable(false);

if (fs.existsSync(SHARED_FOLDER)) {
  console.log('Shared folder exists');
  buck5Server.set(true);
} else {
  console.log('Shared folder does not exist');
  buck5Server.set(false);
}
