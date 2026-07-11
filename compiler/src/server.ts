import * as fs from 'node:fs';
import * as http from 'node:http';
import type { AddressInfo } from 'node:net';
import * as path from 'node:path';
import { compileString, type CompileStringResult } from './compile.ts';
import { extractFile, mergeUsage, normalizePath } from './extract.ts';
import { formatBytes, formatReduction } from './report.ts';
import type { CompileResult, ResolvedConfig, Usage } from './types.ts';
import { createWatcher, type Watcher } from './watch.ts';
import { attachWebSocket, type WsServer, type WsSocket } from './ws.ts';

const MAX_BODY = 10 * 1024 * 1024;
const HASH_IN_NAME = /\.[0-9a-f]{8}(?=\.css(\.map)?$)/;
/** Reserved namespace for the server's own endpoints. */
const API = '/__lunara';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.wasm': 'application/wasm',
};

/* ------------------------------------------------------------------ *
 * Wire types
 * ------------------------------------------------------------------ */

/** Body of POST /__lunara/compile and of {type:"compile"} WS messages. */
export interface CompileRequest {
  /** The stylesheet to optimize. */
  css: string;
  /** Optional display name; *.module.css enables CSS Modules semantics. */
  filename?: string;
  /**
   * Markup/code to scan for class usage. When omitted, the server's live
   * project usage (from the file watcher) is used instead.
   */
  sources?: Array<{ name?: string; content: string }>;
  safelist?: string[];
  critical?: string[];
  minify?: boolean;
  sourceMap?: boolean;
}

export interface CompileResponse {
  outputs: Array<{ kind: 'main' | 'critical'; css: string; map?: string }>;
  selectorTotal: number;
  selectorsRemoved: number;
  removedSelectors: string[];
  criticalSelectors: number;
  cssWarnings: string[];
  dynamicWarnings: Array<{ loc: string; snippet: string }>;
}

export interface CompileServer {
  readonly server: http.Server;
  readonly port: number;
  readonly url: string;
  /** Latest project build, if one has succeeded. */
  latest(): CompileResult | undefined;
  clientCount(): number;
  close(): Promise<void>;
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

function packageVersion(): string {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
    ) as { version?: string };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function readBody(req: http.IncomingMessage, limit: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function reportJson(result: CompileResult | undefined): Record<string, unknown> {
  if (!result) return { ready: false };
  return {
    ready: true,
    durationMs: Math.round(result.durationMs),
    totals: result.totals,
    files: result.files,
    manifest: result.manifest,
    sourceFiles: result.usage.sourceFiles,
    classCount: result.usage.global.size,
    patterns: result.usage.patterns,
    warnings: result.usage.warnings,
  };
}

function rebuildMessage(result: CompileResult, initial: boolean): string {
  return JSON.stringify({
    type: 'rebuild',
    initial,
    durationMs: Math.round(result.durationMs),
    totals: result.totals,
    outputs: result.files.flatMap((f) =>
      f.outputs.map((o) => ({
        file: o.fileName,
        stable: o.fileName.replace(HASH_IN_NAME, ''),
        kind: o.kind,
        bytes: o.bytes,
        input: f.input,
      })),
    ),
  });
}

/**
 * Resolve a request path to a file inside the project root, or null when it
 * escapes the root or touches a dot-segment (.git, .env, ...).
 */
export function resolveSitePath(root: string, pathname: string): string | null {
  const rel = pathname.replace(/^\/+/, '');
  if (rel.includes('\\')) return null; // no encoded backslash tricks
  if (rel.split('/').some((s) => s.startsWith('.'))) return null; // .git, .env, ..
  const full = path.resolve(root, rel);
  const base = path.resolve(root);
  if (full !== base && !full.startsWith(base + path.sep)) return null;
  return full;
}

/** Inject the live-reload client before </body> (or append). */
export function injectLiveClient(html: string): string {
  const tag = `<script src="${API}/live.js"></script>`;
  const at = html.toLowerCase().lastIndexOf('</body>');
  if (at === -1) return `${html}\n${tag}\n`;
  return `${html.slice(0, at)}${tag}\n${html.slice(at)}`;
}

/** Compile a request against explicit sources or the live project usage. */
function handleCompileRequest(
  config: ResolvedConfig,
  watcher: Watcher,
  body: CompileRequest,
): CompileResponse {
  if (typeof body.css !== 'string' || body.css.length === 0) {
    throw new RequestError(400, 'Field "css" (string) is required');
  }
  let usage: Usage;
  let dynamicWarnings: Array<{ loc: string; snippet: string }> = [];
  if (body.sources && body.sources.length > 0) {
    const usages = body.sources.map((source, i) => {
      const name = source.name ?? `source-${i}.tsx`;
      return extractFile(path.join(config.cwd, name), String(source.content ?? ''), config.cwd);
    });
    usage = mergeUsage(usages);
    dynamicWarnings = usage.warnings;
  } else {
    const last = watcher.last;
    if (!last) throw new RequestError(409, 'No project build available yet; pass "sources"');
    usage = last.usage;
  }
  const compiled: CompileStringResult = compileString({
    code: body.css,
    filename: body.filename ?? 'input.css',
    usage,
    safelist: body.safelist ?? config.safelist,
    critical: body.critical ?? config.critical,
    minify: body.minify ?? config.minify,
    sourceMap: body.sourceMap ?? config.sourceMap,
  });
  return {
    outputs: compiled.outputs.map((o) => ({
      kind: o.kind,
      css: o.code,
      ...(o.map !== undefined ? { map: o.map } : {}),
    })),
    selectorTotal: compiled.selectorTotal,
    selectorsRemoved: compiled.selectorsRemoved,
    removedSelectors: compiled.removedSelectors,
    criticalSelectors: compiled.criticalSelectors,
    cssWarnings: compiled.cssWarnings,
    dynamicWarnings,
  };
}

class RequestError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/* ------------------------------------------------------------------ *
 * Live-reload client
 * ------------------------------------------------------------------ */

const LIVE_CLIENT = `(() => {
  const script = document.currentScript;
  if (!script || !script.src) return;
  const src = new URL(script.src);
  const wsUrl = (src.protocol === 'https:' ? 'wss://' : 'ws://') + src.host + '${API}/ws';
  let retry = 0;
  const refresh = () => {
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .filter((l) => new URL(l.href, location.href).origin === src.origin);
    for (const link of links) {
      const url = new URL(link.href, location.href);
      url.searchParams.set('v', String(Date.now()));
      link.href = url.toString();
    }
    if (links.length) console.log('[lunara] stylesheet refreshed');
  };
  const connect = () => {
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => { retry = 0; console.log('[lunara] live reload connected'); };
    ws.onmessage = (event) => {
      let msg;
      try { msg = JSON.parse(event.data); } catch { return; }
      if (msg.type === 'cssupdate' || (msg.type === 'rebuild' && !msg.initial)) refresh();
    };
    ws.onclose = () => setTimeout(connect, Math.min(1000 * 2 ** retry++, 10000));
  };
  connect();
})();
`;

/* ------------------------------------------------------------------ *
 * Dashboard
 * ------------------------------------------------------------------ */

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function dashboardHtml(
  result: CompileResult | undefined,
  config: ResolvedConfig,
  origin: string,
  version: string,
  clients: number,
): string {
  const rows = (result?.files ?? [])
    .map((f) => {
      const outputs = f.outputs
        .map(
          (o) =>
            `<a href="/${encodeURIComponent(o.fileName)}">${escapeHtml(o.fileName)}</a> ` +
            `<span class="dim">${formatBytes(o.bytes)} · gzip ${formatBytes(o.gzip)}</span>`,
        )
        .join('<br>');
      return `<tr><td>${escapeHtml(f.input)}</td><td>${outputs}</td>` +
        `<td>${formatBytes(f.originalBytes)}</td>` +
        `<td>${f.selectorsRemoved}/${f.selectorTotal} removed</td></tr>`;
    })
    .join('');
  const warnings = (result?.usage.warnings ?? [])
    .slice(0, 20)
    .map((w) => `<li><code>${escapeHtml(w.loc)}</code> ${escapeHtml(w.snippet)}</li>`)
    .join('');
  const totals = result
    ? `${formatBytes(result.totals.originalBytes)} → ${formatBytes(result.totals.outputBytes)} ` +
      `(-${formatReduction(result.totals.originalBytes, result.totals.outputBytes)}) · ` +
      `${result.totals.selectorsRemoved} of ${result.totals.selectorTotal} selectors removed · ` +
      `built in ${result.durationMs.toFixed(0)} ms`
    : 'no successful build yet — check the terminal for errors';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>lunara compile server</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0 auto; max-width: 60rem; padding: 2rem 1.25rem 4rem;
         font: 15px/1.6 ui-monospace, "Cascadia Code", Consolas, monospace;
         background: #0b0e1a; color: #dfe4f5; }
  h1 { font-size: 1.3rem; } h2 { font-size: 1rem; margin-top: 2.2rem; color: #9fb0e8; }
  a { color: #8ab4ff; } code, pre { background: #131a30; border-radius: 6px; }
  code { padding: .1rem .35rem; }
  pre { padding: .8rem 1rem; overflow-x: auto; }
  table { border-collapse: collapse; width: 100%; font-size: .92em; }
  td, th { border-bottom: 1px solid #222c4d; padding: .45rem .6rem; text-align: left;
           vertical-align: top; }
  .dim { color: #7c88ad; } .pill { background: #131a30; border-radius: 99px;
         padding: .15rem .7rem; margin-right: .5rem; }
  ul { padding-left: 1.2rem; }
</style>
</head>
<body>
<h1>lunara 🌙 <span class="dim">compile server v${escapeHtml(version)}</span></h1>
<p><span class="pill">${totals}</span></p>
<p class="dim">serving ${escapeHtml(config.cwd)} · ${clients} live client${clients === 1 ? '' : 's'} connected</p>

<h2>How it works</h2>
<p>Open your site through this server — <a href="/">${escapeHtml(origin)}/</a> — and every
stylesheet it references is compiled on the fly: unused Lunara classes purged, the rest
minified. HTML pages get the live-reload client injected automatically, so editing any
watched file re-styles open pages without a refresh.</p>

<h2>Optimized outputs (written to ${escapeHtml(path.relative(config.cwd, config.outDir) || '.')}/)</h2>
<table><tr><th>input</th><th>output</th><th>original</th><th>selectors</th></tr>${rows ||
    '<tr><td colspan="4" class="dim">none yet</td></tr>'}</table>

<h2>For pages served elsewhere</h2>
<pre>&lt;link rel="stylesheet" href="${escapeHtml(origin)}/lunar.css"&gt;
&lt;script src="${escapeHtml(origin)}${API}/live.js"&gt;&lt;/script&gt;</pre>

<h2>Endpoints</h2>
<ul>
<li><code>GET /&lt;any site file&gt;</code> — your site; <code>.css</code> responses are optimized on the fly</li>
<li><code>GET ${API}</code> — this dashboard · <code>GET ${API}/report</code> — build report JSON</li>
<li><code>GET ${API}/manifest.json</code> — input → output mapping</li>
<li><code>POST ${API}/compile</code> — <code>{ css, sources?, safelist?, critical? }</code> → optimized CSS</li>
<li><code>WS ${API}/ws</code> — rebuild/cssupdate broadcasts; send <code>{ type: "compile", id, ...body }</code></li>
</ul>
${warnings ? `<h2>Dynamic class names (consider safelisting)</h2><ul>${warnings}</ul>` : ''}
<script>
  const ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '${API}/ws');
  ws.onmessage = (e) => { try { const t = JSON.parse(e.data).type; if (t === 'rebuild' || t === 'cssupdate') location.reload(); } catch {} };
</script>
</body>
</html>`;
}

/* ------------------------------------------------------------------ *
 * The server
 * ------------------------------------------------------------------ */

export interface StartServerOptions {
  log?: (line: string) => void;
}

export function startServer(
  config: ResolvedConfig,
  options: StartServerOptions = {},
): Promise<CompileServer> {
  const log = options.log ?? console.log;
  const version = packageVersion();
  let wss: WsServer | undefined;
  /** stable (hash-stripped) name -> actual file name in outDir */
  let stableNames = new Map<string, string>();
  /** Normalized absolute paths of the CSS files the watcher compiles. */
  let cssInputs = new Set<string>();
  /** Bumped on every build; part of the on-the-fly compile cache key. */
  let buildCounter = 0;
  /** On-the-fly ("sniped") stylesheet cache. */
  const snipeCache = new Map<string, { mtimeMs: number; build: number; code: string; note: string }>();
  const cssBroadcastTimers = new Map<string, NodeJS.Timeout>();

  const watcher = createWatcher(config, {
    onBuild(result, recompiled, initial) {
      buildCounter++;
      stableNames = new Map();
      cssInputs = new Set(
        result.files.map((f) => normalizePath(path.resolve(config.cwd, f.input))),
      );
      for (const file of result.files) {
        for (const out of file.outputs) {
          const stable = out.fileName.replace(HASH_IN_NAME, '');
          if (stable !== out.fileName) {
            stableNames.set(stable, out.fileName);
            if (config.sourceMap) stableNames.set(`${stable}.map`, `${out.fileName}.map`);
          }
        }
      }
      if (recompiled > 0 || initial) {
        wss?.broadcast(rebuildMessage(result, initial));
        log(
          `${initial ? 'built' : 'rebuilt'} ${recompiled} stylesheet${recompiled === 1 ? '' : 's'} — ` +
            `${formatBytes(result.totals.originalBytes)} → ${formatBytes(result.totals.outputBytes)} ` +
            `(-${formatReduction(result.totals.originalBytes, result.totals.outputBytes)}) · ` +
            `${result.durationMs.toFixed(0)} ms`,
        );
      }
    },
    onError(error) {
      wss?.broadcast(JSON.stringify({ type: 'builderror', message: error.message }));
      log(`build failed: ${error.message}`);
    },
    onWarn(message) {
      log(message);
    },
    onFileChange(file) {
      // Stylesheets served on the fly are not always compile inputs; make
      // sure live pages refresh when any css under the site root changes.
      if (!/\.css$/i.test(file)) return;
      const key = normalizePath(file);
      clearTimeout(cssBroadcastTimers.get(key));
      cssBroadcastTimers.set(
        key,
        setTimeout(() => {
          cssBroadcastTimers.delete(key);
          if (cssInputs.has(key)) return; // the rebuild broadcast covers it
          wss?.broadcast(
            JSON.stringify({
              type: 'cssupdate',
              file: path.relative(config.cwd, file).replace(/\\/g, '/'),
            }),
          );
        }, 150),
      );
    },
  });

  const sendJson = (res: http.ServerResponse, status: number, data: unknown): void => {
    res.writeHead(status, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    });
    res.end(JSON.stringify(data));
  };

  /** Compile a project stylesheet on demand for direct serving. */
  const snipeCss = (file: string): { code: string; note: string } | null => {
    const last = watcher.last;
    let mtimeMs: number;
    try {
      mtimeMs = fs.statSync(file).mtimeMs;
    } catch {
      return null;
    }
    const key = normalizePath(file);
    const cached = snipeCache.get(key);
    if (cached && cached.mtimeMs === mtimeMs && cached.build === buildCounter) {
      return cached;
    }
    const raw = fs.readFileSync(file, 'utf8');
    let entry: { mtimeMs: number; build: number; code: string; note: string };
    if (!last) {
      entry = { mtimeMs, build: buildCounter, code: raw, note: 'raw (no build yet)' };
    } else {
      try {
        const compiled = compileString({
          code: raw,
          filename: path.relative(config.cwd, file).replace(/\\/g, '/'),
          usage: last.usage,
          fileKey: key,
          safelist: config.safelist,
          critical: [], // on-the-fly responses are always the full sheet
          minify: config.minify,
          sourceMap: false,
        });
        const code = compiled.outputs[0]?.code ?? raw;
        entry = {
          mtimeMs,
          build: buildCounter,
          code,
          note: `optimized ${Buffer.byteLength(raw)} -> ${Buffer.byteLength(code)}`,
        };
      } catch (e) {
        entry = { mtimeMs, build: buildCounter, code: raw, note: `raw (${(e as Error).message})` };
      }
    }
    snipeCache.set(key, entry);
    return entry;
  };

  /** Serve a file from the project root; returns false when not found. */
  const serveSite = (res: http.ServerResponse, pathname: string): boolean => {
    let full = resolveSitePath(config.cwd, pathname);
    if (!full) return false;
    let stat: fs.Stats;
    try {
      stat = fs.statSync(full);
    } catch {
      return false;
    }
    if (stat.isDirectory()) {
      full = path.join(full, 'index.html');
      try {
        stat = fs.statSync(full);
      } catch {
        return false;
      }
    }
    if (!stat.isFile()) return false;

    const ext = path.extname(full).toLowerCase();
    const type = MIME[ext] ?? 'application/octet-stream';
    const underOutDir = normalizePath(full).startsWith(normalizePath(config.outDir) + path.sep);

    if (ext === '.css' && (!underOutDir || cssInputs.has(normalizePath(full)))) {
      // The snipe: any stylesheet the site references is served optimized.
      // Files under outDir that are not inputs were already compiled by us.
      const sniped = snipeCss(full);
      if (!sniped) return false;
      res.writeHead(200, {
        'content-type': type,
        'cache-control': 'no-store',
        'x-lunara': sniped.note,
      });
      res.end(sniped.code);
      return true;
    }

    let content: Buffer;
    try {
      content = fs.readFileSync(full);
    } catch {
      return false;
    }
    if (ext === '.html' || ext === '.htm') {
      const injected = injectLiveClient(content.toString('utf8'));
      res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' });
      res.end(injected);
      return true;
    }
    res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' });
    res.end(content);
    return true;
  };

  /** Serve a compiled output from outDir by (possibly hash-stripped) name. */
  const serveOutputFile = (res: http.ServerResponse, name: string): boolean => {
    const actual = stableNames.get(name) ?? name;
    if (actual.includes('/') || actual.includes('\\') || actual.includes('..')) return false;
    if (!/\.css(\.map)?$/i.test(actual) && actual !== 'manifest.json') return false;
    const full = path.join(config.outDir, actual);
    let content: Buffer;
    try {
      content = fs.readFileSync(full);
    } catch {
      return false;
    }
    const type = actual.endsWith('.css')
      ? 'text/css; charset=utf-8'
      : 'application/json; charset=utf-8';
    res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' });
    res.end(content);
    return true;
  };

  const handleApi = async (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    route: string,
  ): Promise<boolean> => {
    if (req.method === 'GET' && (route === '' || route === '/')) {
      const origin = `http://${req.headers.host ?? `127.0.0.1:${config.port}`}`;
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      res.end(dashboardHtml(watcher.last, config, origin, version, wss?.clients.size ?? 0));
      return true;
    }
    if (req.method === 'GET' && route === '/report') {
      sendJson(res, 200, reportJson(watcher.last));
      return true;
    }
    if (req.method === 'GET' && route === '/live.js') {
      res.writeHead(200, {
        'content-type': 'application/javascript; charset=utf-8',
        'cache-control': 'no-store',
      });
      res.end(LIVE_CLIENT);
      return true;
    }
    if (req.method === 'GET' && route === '/manifest.json') {
      return serveOutputFile(res, 'manifest.json');
    }
    if (req.method === 'POST' && route === '/compile') {
      const body = await readBody(req, MAX_BODY);
      let parsed: CompileRequest;
      try {
        parsed = JSON.parse(body.toString('utf8')) as CompileRequest;
      } catch {
        throw new RequestError(400, 'Body must be JSON');
      }
      sendJson(res, 200, handleCompileRequest(config, watcher, parsed));
      return true;
    }
    return false;
  };

  const handler = async (req: http.IncomingMessage, res: http.ServerResponse): Promise<void> => {
    res.setHeader('access-control-allow-origin', '*');
    const url = new URL(req.url ?? '/', 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);

    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'access-control-allow-methods': 'GET, POST, OPTIONS',
        'access-control-allow-headers': 'content-type',
      });
      res.end();
      return;
    }

    try {
      // 1. Reserved API namespace.
      if (pathname === API || pathname.startsWith(`${API}/`)) {
        if (await handleApi(req, res, pathname.slice(API.length))) return;
        sendJson(res, 404, { error: `No route for ${req.method} ${pathname}` });
        return;
      }
      // Legacy top-level aliases (kept for external pages): resolved only
      // when the site itself has no file at that path.
      if (req.method === 'POST' && pathname === '/compile') {
        if (await handleApi(req, res, '/compile')) return;
      }

      // 2. The site itself, with CSS sniping and live-client injection.
      if (req.method === 'GET') {
        if (serveSite(res, pathname)) return;
        if (pathname === '/') {
          // No index.html — show the dashboard instead.
          if (await handleApi(req, res, '/')) return;
        }
        if (pathname === '/lunara-live.js' && (await handleApi(req, res, '/live.js'))) return;
        if (pathname === '/report' && (await handleApi(req, res, '/report'))) return;
        // 3. Compiled outputs by stable name (e.g. /lunar.css for external pages).
        if (pathname.length > 1 && serveOutputFile(res, pathname.slice(1))) return;
      }
      sendJson(res, 404, { error: `No route for ${req.method} ${pathname}` });
    } catch (e) {
      if (e instanceof RequestError) {
        sendJson(res, e.status, { error: e.message });
      } else {
        sendJson(res, 500, { error: (e as Error).message });
      }
    }
  };

  const server = http.createServer((req, res) => {
    void handler(req, res);
  });

  wss = attachWebSocket(server, [`${API}/ws`, '/ws'], (socket: WsSocket) => {
    socket.send(
      JSON.stringify({ type: 'hello', version, report: reportJson(watcher.last) }),
    );
    socket.onMessage((text) => {
      let msg: { type?: string; id?: unknown } & CompileRequest;
      try {
        msg = JSON.parse(text) as typeof msg;
      } catch {
        socket.send(JSON.stringify({ type: 'error', message: 'Messages must be JSON' }));
        return;
      }
      if (msg.type === 'ping') {
        socket.send(JSON.stringify({ type: 'pong' }));
        return;
      }
      if (msg.type === 'compile') {
        try {
          const result = handleCompileRequest(config, watcher, msg);
          socket.send(JSON.stringify({ type: 'result', id: msg.id ?? null, ...result }));
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          socket.send(JSON.stringify({ type: 'error', id: msg.id ?? null, message }));
        }
        return;
      }
      socket.send(
        JSON.stringify({ type: 'error', message: `Unknown message type "${msg.type ?? ''}"` }),
      );
    });
  });

  return new Promise((resolve, reject) => {
    const onError = (e: Error): void => {
      watcher.close();
      reject(e);
    };
    server.once('error', onError);
    server.listen(config.port, config.host, () => {
      server.removeListener('error', onError);
      const address = server.address() as AddressInfo;
      const displayHost = config.host === '0.0.0.0' ? '127.0.0.1' : config.host;
      resolve({
        server,
        port: address.port,
        url: `http://${displayHost}:${address.port}`,
        latest: () => watcher.last,
        clientCount: () => wss?.clients.size ?? 0,
        close: () =>
          new Promise<void>((done) => {
            for (const timer of cssBroadcastTimers.values()) clearTimeout(timer);
            wss?.closeAll();
            watcher.close();
            server.close(() => done());
          }),
      });
    });
  });
}
