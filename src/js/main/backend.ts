import type { ServerStatus } from 'buck-client';
import { client, getStatus } from 'buck-client';
import { notifications } from '../stores/notifications-store';

const maxConnectionAttempts = 20;
let connectionAttempt = 0;
let launched = false;
let developmentBackend = true;

/**
 * Represents a connection to the Daemon.
 */
export type DaemonConnection = {
  /**
   * The Daemon REST API address.
   */
  host: string;
  /**
   * The Daemon Bridge Websocket Address.
   */
  bridgeHost: string;
  /**
   * The Aquarium base URL.
   */
  aquarium: string;
  /**
   * The Daemon server status.
   *
   * @see ServerStatus
   */
  serverStatus: ServerStatus;
};

/**
 * An async function that establishes a connection with the daemon and configures the client
 * used for communication.
 *
 * @param backend The backend to connect to. @see Backend
 * @param onInit Callback that is executed when a connection has established.
 * @param onLaunch Callback that is executed when the Production daemon has been launched.
 * @param onError Callback that is executed when an error occurs.
 */
export async function connectToDaemon(
  onInit?: (connection: DaemonConnection) => void,
  onLaunch?: () => void,
  onError?: (message: string) => void
) {
  // configure client based on the backend
  const baseUrl = developmentBackend
    ? 'http://localhost:8000'
    : 'http://localhost:22131';

  client.setConfig({
    baseUrl: baseUrl,
  });

  client.interceptors.request.use((req: any) => {
    req.headers.append('X-BUCK-APP', 'desktop2');
    return req;
  });

  client.interceptors.response.use((res: any) => {
    if (res.status === 401 && !res.url.includes('/auth')) {
      // Set authenticated to false so we go back to the login screen.
      notifications.error('Session expired. Please log in again.', 3000);

      // expireSession();
    }

    return res;
  });

  await getStatus()
    .then(({ data }) => {
      if (!data) {
        throw new Error('No data received.');
      }

      const port = Number.parseInt(baseUrl.split(':')[2]);

      const connection: DaemonConnection = {
        host: baseUrl,
        bridgeHost: `ws:${baseUrl.split(':')[1]}:${(
          data.ws_port || port + 1
        ).toString()}`,
        aquarium: data.backend.host,
        serverStatus: data,
      };

      // Reset some counters
      connectionAttempt = 0;
      launched = false;

      // onInit?.(connection) || console.log(connection);
    })
    .catch((err: any) => {
      console.error(err);
      if (developmentBackend) {
        onError?.('Waiting for daemon is start...');
        setTimeout(() => {
          connectToDaemon(onInit, onLaunch, onError).catch(console.error);
        }, 1000);
      } else {
        onLaunch?.();

        // We don't want to keep spamming the production daemon.
        if (!launched) {
          launched = true;
          console.debug(
            'Production Daemon is not running. Attempting to launch it.'
          );
          // invoke('launch_daemon', {}).catch((launch_err) => {
          //   onError?.(
          //     'An error occurred during launch. See console for more details.',
          //   );
          //   console.error(err);
          //   console.error(launch_err);
          // });
        }

        connectionAttempt += 1;

        if (connectionAttempt >= maxConnectionAttempts) {
          onError?.(
            'Production Daemon is not running. See console for more details.'
          );
          console.error(err);
        } else {
          console.debug('Reconnecting in 3 seconds...');
          setTimeout(() => {
            connectToDaemon(onInit, onLaunch, onError).catch(console.error);
          }, 3000);
        }
      }
    });
}
