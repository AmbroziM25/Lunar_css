import * as crypto from 'node:crypto';
import type * as http from 'node:http';
import type { Duplex } from 'node:stream';

/**
 * Minimal dependency-free WebSocket server — enough of RFC 6455 for the
 * Lunara compile server: handshake, text frames (with fragmentation),
 * ping/pong, close. Binary frames are acknowledged but ignored.
 */

const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
/** Refuse absurd payloads — compile requests are capped separately anyway. */
const MAX_PAYLOAD = 32 * 1024 * 1024;

export const OPCODE = {
  CONTINUATION: 0x0,
  TEXT: 0x1,
  BINARY: 0x2,
  CLOSE: 0x8,
  PING: 0x9,
  PONG: 0xa,
} as const;

/** Encode one frame. Masking is only used by clients (and our tests). */
export function encodeFrame(opcode: number, payload: Buffer, mask = false): Buffer {
  const len = payload.length;
  let header: Buffer;
  if (len < 126) {
    header = Buffer.alloc(2);
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  header[0] = 0x80 | opcode; // FIN + opcode
  if (!mask) return Buffer.concat([header, payload]);

  header[1]! |= 0x80;
  const key = crypto.randomBytes(4);
  const masked = Buffer.from(payload);
  for (let i = 0; i < masked.length; i++) masked[i]! ^= key[i % 4]!;
  return Buffer.concat([header, key, masked]);
}

export interface DecodedFrame {
  fin: boolean;
  opcode: number;
  payload: Buffer;
  /** Total bytes consumed from the input. */
  size: number;
}

/** Decode the first complete frame in `data`, or null if incomplete. */
export function decodeFrame(data: Buffer): DecodedFrame | null {
  if (data.length < 2) return null;
  const fin = (data[0]! & 0x80) !== 0;
  const opcode = data[0]! & 0x0f;
  const masked = (data[1]! & 0x80) !== 0;
  let len = data[1]! & 0x7f;
  let offset = 2;
  if (len === 126) {
    if (data.length < 4) return null;
    len = data.readUInt16BE(2);
    offset = 4;
  } else if (len === 127) {
    if (data.length < 10) return null;
    const big = data.readBigUInt64BE(2);
    if (big > BigInt(MAX_PAYLOAD)) throw new Error('WebSocket payload too large');
    len = Number(big);
    offset = 10;
  }
  if (len > MAX_PAYLOAD) throw new Error('WebSocket payload too large');
  let key: Buffer | undefined;
  if (masked) {
    if (data.length < offset + 4) return null;
    key = data.subarray(offset, offset + 4);
    offset += 4;
  }
  if (data.length < offset + len) return null;
  const payload = Buffer.from(data.subarray(offset, offset + len));
  if (key) for (let i = 0; i < payload.length; i++) payload[i]! ^= key[i % 4]!;
  return { fin, opcode, payload, size: offset + len };
}

export type WsState = 'open' | 'closing' | 'closed';

/** One connected WebSocket client. */
export class WsSocket {
  private buffer: Buffer = Buffer.alloc(0);
  private fragments: Buffer[] | null = null;
  private fragmentOpcode = 0;
  private messageHandlers: Array<(text: string) => void> = [];
  private closeHandlers: Array<() => void> = [];
  private readonly socket: Duplex;
  state: WsState = 'open';

  constructor(socket: Duplex) {
    this.socket = socket;
    socket.on('data', (chunk: Buffer) => this.feed(chunk));
    const finish = (): void => this.destroy();
    socket.on('close', finish);
    socket.on('error', finish);
    socket.on('end', finish);
  }

  onMessage(handler: (text: string) => void): void {
    this.messageHandlers.push(handler);
  }

  onClose(handler: () => void): void {
    this.closeHandlers.push(handler);
  }

  send(text: string): void {
    if (this.state !== 'open') return;
    try {
      this.socket.write(encodeFrame(OPCODE.TEXT, Buffer.from(text, 'utf8')));
    } catch {
      this.destroy();
    }
  }

  close(code = 1000): void {
    if (this.state !== 'open') return;
    this.state = 'closing';
    const payload = Buffer.alloc(2);
    payload.writeUInt16BE(code, 0);
    try {
      this.socket.write(encodeFrame(OPCODE.CLOSE, payload));
    } catch {
      /* socket already gone */
    }
    this.socket.end();
  }

  private destroy(): void {
    if (this.state === 'closed') return;
    this.state = 'closed';
    this.socket.destroy();
    for (const handler of this.closeHandlers) handler();
  }

  private feed(chunk: Buffer): void {
    this.buffer = this.buffer.length === 0 ? chunk : Buffer.concat([this.buffer, chunk]);
    for (;;) {
      let frame: DecodedFrame | null;
      try {
        frame = decodeFrame(this.buffer);
      } catch {
        this.close(1009);
        this.destroy();
        return;
      }
      if (!frame) return;
      this.buffer = this.buffer.subarray(frame.size);
      this.handleFrame(frame);
      if (this.state === 'closed') return;
    }
  }

  private handleFrame(frame: DecodedFrame): void {
    switch (frame.opcode) {
      case OPCODE.TEXT:
      case OPCODE.BINARY:
        if (frame.fin) {
          if (frame.opcode === OPCODE.TEXT) this.dispatch(frame.payload);
        } else {
          this.fragments = [frame.payload];
          this.fragmentOpcode = frame.opcode;
        }
        break;
      case OPCODE.CONTINUATION:
        if (this.fragments) {
          this.fragments.push(frame.payload);
          if (frame.fin) {
            const whole = Buffer.concat(this.fragments);
            const opcode = this.fragmentOpcode;
            this.fragments = null;
            if (opcode === OPCODE.TEXT) this.dispatch(whole);
          }
        }
        break;
      case OPCODE.PING:
        if (this.state === 'open') {
          try {
            this.socket.write(encodeFrame(OPCODE.PONG, frame.payload));
          } catch {
            this.destroy();
          }
        }
        break;
      case OPCODE.PONG:
        break;
      case OPCODE.CLOSE:
        if (this.state === 'open') {
          try {
            this.socket.write(encodeFrame(OPCODE.CLOSE, frame.payload.subarray(0, 2)));
          } catch {
            /* ignore */
          }
        }
        this.socket.end();
        this.destroy();
        break;
      default:
        break; // unknown opcode: ignore
    }
  }

  private dispatch(payload: Buffer): void {
    const text = payload.toString('utf8');
    for (const handler of this.messageHandlers) handler(text);
  }
}

export interface WsServer {
  readonly clients: Set<WsSocket>;
  broadcast(text: string): void;
  closeAll(): void;
}

/**
 * Accept WebSocket upgrades on any of `paths` of an existing http.Server.
 */
export function attachWebSocket(
  server: http.Server,
  paths: string | string[],
  onConnection: (socket: WsSocket) => void,
): WsServer {
  const clients = new Set<WsSocket>();
  const accepted = new Set(Array.isArray(paths) ? paths : [paths]);

  server.on('upgrade', (req, socket: Duplex, head: Buffer) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const key = req.headers['sec-websocket-key'];
    if (
      !accepted.has(url.pathname) ||
      typeof key !== 'string' ||
      !/websocket/i.test(String(req.headers['upgrade'] ?? ''))
    ) {
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
      socket.destroy();
      return;
    }
    const accept = crypto.createHash('sha1').update(key + WS_GUID).digest('base64');
    socket.write(
      'HTTP/1.1 101 Switching Protocols\r\n' +
        'Upgrade: websocket\r\n' +
        'Connection: Upgrade\r\n' +
        `Sec-WebSocket-Accept: ${accept}\r\n\r\n`,
    );
    const ws = new WsSocket(socket);
    clients.add(ws);
    ws.onClose(() => clients.delete(ws));
    if (head.length > 0) socket.unshift(head);
    onConnection(ws);
  });

  return {
    clients,
    broadcast(text: string): void {
      for (const client of clients) client.send(text);
    },
    closeAll(): void {
      for (const client of clients) client.close(1001);
      clients.clear();
    },
  };
}
