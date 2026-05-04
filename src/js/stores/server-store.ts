import { writable } from 'svelte/store';
import { SHARED_FOLDER } from '@/api/buck-library';
import { fs } from '@/lib/cep/node';
import { logModule } from '@/lib/logger';

const log = logModule('server-store');

export const buck5Server = writable(false);

if (fs.existsSync(SHARED_FOLDER())) {
  buck5Server.set(true);
  log.debug('Connected to Buck Server', { sharedFolder: SHARED_FOLDER() });
} else {
  buck5Server.set(false);
  log.warn(`Not connected to Buck Server. Make sure you connect to 'work' and 'globalprefs'`, { sharedFolder: SHARED_FOLDER() });
}
