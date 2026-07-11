import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { decodeFrame, encodeFrame, OPCODE } from '../src/ws.ts';

describe('WebSocket framing', () => {
  test('short text frame roundtrip', () => {
    const frame = encodeFrame(OPCODE.TEXT, Buffer.from('hello'));
    const decoded = decodeFrame(frame)!;
    assert.equal(decoded.fin, true);
    assert.equal(decoded.opcode, OPCODE.TEXT);
    assert.equal(decoded.payload.toString(), 'hello');
    assert.equal(decoded.size, frame.length);
  });

  test('masked frame roundtrip (client -> server)', () => {
    const frame = encodeFrame(OPCODE.TEXT, Buffer.from('masked payload'), true);
    const decoded = decodeFrame(frame)!;
    assert.equal(decoded.payload.toString(), 'masked payload');
  });

  test('16-bit extended length (126..65535 bytes)', () => {
    const payload = Buffer.alloc(300, 0x61);
    const frame = encodeFrame(OPCODE.TEXT, payload);
    assert.equal(frame[1], 126);
    const decoded = decodeFrame(frame)!;
    assert.equal(decoded.payload.length, 300);
  });

  test('64-bit extended length (>65535 bytes)', () => {
    const payload = Buffer.alloc(70_000, 0x62);
    const frame = encodeFrame(OPCODE.TEXT, payload, true);
    assert.equal(frame[1]! & 0x7f, 127);
    const decoded = decodeFrame(frame)!;
    assert.equal(decoded.payload.length, 70_000);
    assert.equal(decoded.payload[12345], 0x62);
  });

  test('incomplete frames return null until all bytes arrive', () => {
    const frame = encodeFrame(OPCODE.TEXT, Buffer.from('split into pieces'), true);
    for (let cut = 1; cut < frame.length; cut += 5) {
      assert.equal(decodeFrame(frame.subarray(0, cut)), null, `cut at ${cut}`);
    }
    assert.ok(decodeFrame(frame));
  });

  test('two frames in one buffer decode sequentially', () => {
    const a = encodeFrame(OPCODE.TEXT, Buffer.from('one'));
    const b = encodeFrame(OPCODE.TEXT, Buffer.from('two'));
    const joined = Buffer.concat([a, b]);
    const first = decodeFrame(joined)!;
    assert.equal(first.payload.toString(), 'one');
    const second = decodeFrame(joined.subarray(first.size))!;
    assert.equal(second.payload.toString(), 'two');
  });

  test('control opcodes survive the roundtrip', () => {
    for (const opcode of [OPCODE.PING, OPCODE.PONG, OPCODE.CLOSE]) {
      const decoded = decodeFrame(encodeFrame(opcode, Buffer.from([3, 232])))!;
      assert.equal(decoded.opcode, opcode);
    }
  });
});
