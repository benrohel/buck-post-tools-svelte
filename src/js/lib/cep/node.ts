// /src/js/lib/cep/node.ts

// Helper: are we running in a Node-like environment (CLI, tests, etc.)?
const isNode =
  typeof process !== 'undefined' &&
  typeof process.versions !== 'undefined' &&
  typeof (process.versions as any).node !== 'undefined';

// Helper: are we in a CEP panel (browser + window.cep + CEP's Node runtime)?
const isCEP =
  typeof window !== 'undefined' && typeof (window as any).cep !== 'undefined';

// We can use Node core modules if either:
// - we're in Node (CLI/tests), or
// - we're in a CEP panel (which embeds Node).
const canUseNodeModules = isNode || isCEP;

// Tiny helper to DRY up requires.
function getNodeModule<T>(id: string): T {
  if (canUseNodeModules && typeof require === 'function') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(id) as T;
  }
  // In a plain browser without CEP or Node: export an empty object.
  return {} as T;
}

// Abstracted built-in Node.js Modules

export const crypto = getNodeModule<typeof import('crypto')>('crypto');
export const assert = getNodeModule<typeof import('assert')>('assert');
export const buffer = getNodeModule<typeof import('buffer')>('buffer');
export const child_process =
  getNodeModule<typeof import('child_process')>('child_process');
export const cluster = getNodeModule<typeof import('cluster')>('cluster');
export const dgram = getNodeModule<typeof import('dgram')>('dgram');
export const dns = getNodeModule<typeof import('dns')>('dns');
export const domain = getNodeModule<typeof import('domain')>('domain');
export const events = getNodeModule<typeof import('events')>('events');
export const fs = getNodeModule<typeof import('fs')>('fs');
export const http = getNodeModule<typeof import('http')>('http');
export const https = getNodeModule<typeof import('https')>('https');
export const net = getNodeModule<typeof import('net')>('net');
export const os = getNodeModule<typeof import('os')>('os');
export const path = getNodeModule<typeof import('path')>('path');
export const punycode = getNodeModule<typeof import('punycode')>('punycode');
export const querystring =
  getNodeModule<typeof import('querystring')>('querystring');
export const readline = getNodeModule<typeof import('readline')>('readline');
export const stream = getNodeModule<typeof import('stream')>('stream');
export const string_decoder =
  getNodeModule<typeof import('string_decoder')>('string_decoder');
export const timers = getNodeModule<typeof import('timers')>('timers');
export const tls = getNodeModule<typeof import('tls')>('tls');
export const tty = getNodeModule<typeof import('tty')>('tty');
export const url = getNodeModule<typeof import('url')>('url');
export const util = getNodeModule<typeof import('util')>('util');
export const v8 = getNodeModule<typeof import('v8')>('v8');
export const vm = getNodeModule<typeof import('vm')>('vm');
export const zlib = getNodeModule<typeof import('zlib')>('zlib');
