import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { after, before, describe, test } from 'node:test';
import { resolveConfig } from '../src/config.ts';
import {
  injectLiveClient,
  resolveSitePath,
  startServer,
  type CompileResponse,
  type CompileServer,
} from '../src/server.ts';

const INDEX_HTML = `<!doctype html>
<html><body class="starfield">
  <header class="hero"><nav class="nav"></nav></header>
  <main class="content"></main>
  <link rel="stylesheet" href="src/styles.css">
</body></html>`;

const STYLES_CSS = `
.starfield { background: black; }
.hero { color: white; }
.nav { display: flex; }
.content { padding: 2rem; }
.unused-a { color: red; }
.unused-b { color: blue; }
`;

const EXTRA_CSS = `
.hero { outline: 1px solid; }
.orphan { color: hotpink; }
`;

/** Wait for the next JSON message on an open WebSocket. */
function nextMessage(ws: WebSocket, timeoutMs = 5000): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timed out waiting for message')), timeoutMs);
    ws.addEventListener(
      'message',
      (event) => {
        clearTimeout(timer);
        resolve(JSON.parse(String((event as MessageEvent).data)) as Record<string, unknown>);
      },
      { once: true },
    );
    ws.addEventListener('error', () => {
      clearTimeout(timer);
      reject(new Error('websocket error'));
    });
  });
}

function openSocket(url: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.addEventListener('open', () => resolve(ws), { once: true });
    ws.addEventListener('error', () => reject(new Error('failed to connect')), { once: true });
  });
}

describe('path helpers', () => {
  const root = path.resolve('site');

  test('resolveSitePath stays inside the root', () => {
    assert.equal(resolveSitePath(root, '/a/b.css'), path.join(root, 'a', 'b.css'));
    assert.equal(resolveSitePath(root, '/'), root);
    assert.equal(resolveSitePath(root, '/../outside.txt'), null);
    assert.equal(resolveSitePath(root, '/a/../../x'), null);
    assert.equal(resolveSitePath(root, '/.git/config'), null);
    assert.equal(resolveSitePath(root, '/a/.env'), null);
    assert.equal(resolveSitePath(root, '/a%5C..%5Cb'.replace(/%5C/g, '\\')), null);
  });

  test('injectLiveClient inserts before </body>', () => {
    const out = injectLiveClient('<html><body>hi</body></html>');
    assert.match(out, /<script src="\/__lunara\/live\.js"><\/script>\n<\/body>/);
    const noBody = injectLiveClient('<p>bare</p>');
    assert.match(noBody, /<p>bare<\/p>\n<script/);
  });
});

describe('compile server', () => {
  let tmp: string;
  let server: CompileServer;

  before(async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lunara-server-'));
    fs.mkdirSync(path.join(tmp, 'src'));
    fs.mkdirSync(path.join(tmp, 'assets'));
    fs.mkdirSync(path.join(tmp, 'extra'));
    fs.writeFileSync(path.join(tmp, 'index.html'), INDEX_HTML);
    fs.writeFileSync(path.join(tmp, 'src', 'styles.css'), STYLES_CSS);
    fs.writeFileSync(path.join(tmp, 'assets', 'app.js'), 'console.log("app");');
    fs.writeFileSync(path.join(tmp, 'extra', 'other.css'), EXTRA_CSS);
    const config = resolveConfig(tmp, {}, { port: 0 });
    server = await startServer(config, { log: () => {} });
  });

  after(async () => {
    await server.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  test('initial build ran and is exposed', () => {
    const result = server.latest();
    assert.ok(result);
    assert.equal(result.totals.selectorsRemoved, 2); // .unused-a, .unused-b
  });

  test('GET / serves the site index with the live client injected', async () => {
    const res = await fetch(`${server.url}/`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') ?? '', /text\/html/);
    const html = await res.text();
    assert.match(html, /class="starfield"/);
    assert.match(html, /__lunara\/live\.js/);
  });

  test('sniping: site CSS is served optimized on the fly', async () => {
    const res = await fetch(`${server.url}/src/styles.css`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') ?? '', /text\/css/);
    assert.match(res.headers.get('x-lunara') ?? '', /optimized/);
    const css = await res.text();
    assert.match(css, /\.starfield/);
    assert.doesNotMatch(css, /unused-a/);
  });

  test('sniping covers CSS outside the configured globs', async () => {
    const res = await fetch(`${server.url}/extra/other.css`);
    assert.equal(res.status, 200);
    const css = await res.text();
    assert.match(css, /\.hero/);
    assert.doesNotMatch(css, /\.orphan/);
  });

  test('non-CSS assets are served raw with their content type', async () => {
    const res = await fetch(`${server.url}/assets/app.js`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') ?? '', /javascript/);
    assert.equal(await res.text(), 'console.log("app");');
  });

  test('GET /styles.css falls back to the compiled outDir output', async () => {
    const res = await fetch(`${server.url}/styles.css`);
    assert.equal(res.status, 200);
    const css = await res.text();
    assert.match(css, /\.hero/);
    assert.doesNotMatch(css, /unused-b/);
  });

  test('GET /__lunara serves the dashboard', async () => {
    const res = await fetch(`${server.url}/__lunara`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.match(html, /lunara/);
    assert.match(html, /styles\.css/);
  });

  test('GET /__lunara/report returns build JSON', async () => {
    const res = await fetch(`${server.url}/__lunara/report`);
    assert.equal(res.status, 200);
    const report = (await res.json()) as { ready: boolean; totals: { selectorsRemoved: number } };
    assert.equal(report.ready, true);
    assert.equal(report.totals.selectorsRemoved, 2);
  });

  test('dotfiles and traversal are rejected', async () => {
    assert.equal((await fetch(`${server.url}/..%2Fsecrets.txt`)).status, 404);
    assert.equal((await fetch(`${server.url}/.git/config`)).status, 404);
  });

  test('POST /__lunara/compile with explicit sources', async () => {
    const res = await fetch(`${server.url}/__lunara/compile`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        css: '.keep { color: red; } .drop { color: blue; }',
        sources: [{ name: 'page.html', content: '<div class="keep"></div>' }],
      }),
    });
    assert.equal(res.status, 200);
    const body = (await res.json()) as CompileResponse;
    assert.equal(body.outputs.length, 1);
    assert.match(body.outputs[0]!.css, /\.keep/);
    assert.doesNotMatch(body.outputs[0]!.css, /\.drop/);
    assert.equal(body.selectorsRemoved, 1);
  });

  test('POST /__lunara/compile falls back to live project usage', async () => {
    const res = await fetch(`${server.url}/__lunara/compile`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ css: '.hero { top: 0; } .never-used { top: 0; }' }),
    });
    const body = (await res.json()) as CompileResponse;
    assert.match(body.outputs[0]!.css, /\.hero/);
    assert.doesNotMatch(body.outputs[0]!.css, /never-used/);
  });

  test('POST /__lunara/compile without css is a 400', async () => {
    const res = await fetch(`${server.url}/__lunara/compile`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sources: [] }),
    });
    assert.equal(res.status, 400);
  });

  test('WebSocket: hello, ping/pong, compile request', async () => {
    const ws = await openSocket(`${server.url.replace(/^http/, 'ws')}/__lunara/ws`);
    try {
      const hello = await nextMessage(ws);
      assert.equal(hello['type'], 'hello');
      assert.equal((hello['report'] as { ready: boolean }).ready, true);

      ws.send(JSON.stringify({ type: 'ping' }));
      const pong = await nextMessage(ws);
      assert.equal(pong['type'], 'pong');

      ws.send(
        JSON.stringify({
          type: 'compile',
          id: 'req-1',
          css: '.keep { color: red; } .drop { color: blue; }',
          sources: [{ name: 'x.html', content: '<i class="keep"></i>' }],
        }),
      );
      const result = await nextMessage(ws);
      assert.equal(result['type'], 'result');
      assert.equal(result['id'], 'req-1');
      const outputs = result['outputs'] as Array<{ css: string }>;
      assert.match(outputs[0]!.css, /\.keep/);
      assert.doesNotMatch(outputs[0]!.css, /\.drop/);
    } finally {
      ws.close();
    }
  });

  test('legacy /ws path still accepts connections', async () => {
    const ws = await openSocket(`${server.url.replace(/^http/, 'ws')}/ws`);
    try {
      const hello = await nextMessage(ws);
      assert.equal(hello['type'], 'hello');
    } finally {
      ws.close();
    }
  });

  test('WebSocket: usage change broadcasts a rebuild', async () => {
    const ws = await openSocket(`${server.url.replace(/^http/, 'ws')}/__lunara/ws`);
    try {
      await nextMessage(ws); // hello
      const rebuild = nextMessage(ws, 10_000);
      // Use a class that exists in the CSS so the output actually changes.
      fs.writeFileSync(
        path.join(tmp, 'index.html'),
        INDEX_HTML.replace('class="content"', 'class="content unused-a"'),
      );
      const msg = await rebuild;
      assert.equal(msg['type'], 'rebuild');
      const totals = msg['totals'] as { selectorsRemoved: number };
      assert.equal(totals.selectorsRemoved, 1); // only .unused-b left unused
      // The sniped stylesheet reflects the new usage immediately.
      const css = await (await fetch(`${server.url}/src/styles.css`)).text();
      assert.match(css, /unused-a/); // now kept
    } finally {
      ws.close();
    }
  });

  test('WebSocket: non-input CSS change broadcasts a cssupdate', async () => {
    const ws = await openSocket(`${server.url.replace(/^http/, 'ws')}/__lunara/ws`);
    try {
      await nextMessage(ws); // hello
      const update = (async () => {
        for (;;) {
          const msg = await nextMessage(ws, 10_000);
          if (msg['type'] === 'cssupdate') return msg;
        }
      })();
      fs.writeFileSync(
        path.join(tmp, 'extra', 'other.css'),
        `${EXTRA_CSS}\n.hero { border: 0; }\n`,
      );
      const msg = await update;
      assert.equal(msg['file'], 'extra/other.css');
      const css = await (await fetch(`${server.url}/extra/other.css`)).text();
      assert.match(css, /border/); // freshly recompiled after the edit
    } finally {
      ws.close();
    }
  });
});
