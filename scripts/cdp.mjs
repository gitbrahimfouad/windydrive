// Minimal Chrome DevTools Protocol client (headless Chrome) used by the store-asset scripts.
import { spawn } from 'node:child_process';

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function openChrome(debugPort = 9333) {
  const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${debugPort}`, `--user-data-dir=/tmp/windy-shots-profile-${debugPort}`, 'about:blank'], { stdio: 'ignore' });
  process.on('exit', () => chrome.kill());
  let up = false;
  for (let i = 0; i < 60 && !up; i++) {
    try {
      await (await fetch(`http://localhost:${debugPort}/json/version`)).json();
      up = true;
    } catch {
      await sleep(250);
    }
  }
  if (!up) throw new Error('Chrome did not start');
  const pages = await (await fetch(`http://localhost:${debugPort}/json`)).json();
  const ws = new WebSocket(pages.find((p) => p.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pending = new Map();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      const { resolve, reject } = pending.get(m.id);
      pending.delete(m.id);
      m.error ? reject(new Error(m.error.message)) : resolve(m.result);
    }
  };
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const i = ++id;
      pending.set(i, { resolve, reject });
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  await send('Page.enable');
  await send('Runtime.enable');

  /** Loads `url` at w×h CSS px × dpr, waits until document.title === `title` and fonts are ready, returns PNG bytes. */
  const capture = async (url, { w, h, dpr, title }) => {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: true });
    await send('Page.navigate', { url });
    for (let i = 0; i < 60; i++) {
      const r = await send('Runtime.evaluate', { expression: `document.title === ${JSON.stringify(title)} && document.fonts.status === 'loaded'` });
      if (r.result.value) break;
      await sleep(150);
    }
    await sleep(600); // a few frames
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    return Buffer.from(shot.data, 'base64');
  };
  const close = () => {
    ws.close();
    chrome.kill();
  };
  return { send, capture, close };
}
