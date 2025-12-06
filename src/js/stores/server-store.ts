import { writable } from 'svelte/store';
import { SHARED_FOLDER } from '@/api/buck-library';
import { fs } from '@/lib/cep/node';

export const buck5Server = writable(false);

if (fs.existsSync(SHARED_FOLDER())) {
  buck5Server.set(true);
  console.log('Connected to Buck Server', SHARED_FOLDER() );
} else {
  buck5Server.set(false);
  console.log('Not connected to Buck Server', SHARED_FOLDER());
}
