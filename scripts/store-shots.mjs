// Captures the store screenshots through the Chrome DevTools Protocol (exact device metrics).
// Needs the Vite dev server (shot mode, see src/dev/shots.ts). Run by make-store-assets.sh.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const APP = process.env.APP_URL ?? 'http://localhost:5199';
const DEBUG_PORT = 9333;
const SCENES = ['home', 'curve', 'narrow', 'record', 'near', 'night'];
const LANGS = ['fr', 'en'];
// dir, CSS width, CSS height, device pixel ratio, safe-area top, safe-area bottom  (pixels = css × dpr)
const DEVICES = [
  ['ios/iphone-6.9in_1320x2868', 440, 956, 3, 62, 34],
  ['ios/iphone-6.5in_1284x2778', 428, 926, 3, 47, 34],
  ['ios/ipad-13in_2064x2752', 1032, 1376, 2, 24, 20],
  ['android/phone_1080x1920', 360, 640, 3, 24, 0],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${DEBUG_PORT}`, '--user-data-dir=/tmp/windy-shots-profile', 'about:blank'], { stdio: 'ignore' });
process.on('exit', () => chrome.kill());

let version;
for (let i = 0; i < 60 && !version; i++) {
  try {
    version = await (await fetch(`http://localhost:${DEBUG_PORT}/json/version`)).json();
  } catch {
    await sleep(250);
  }
}
if (!version) throw new Error('Chrome did not start');
const pages = await (await fetch(`http://localhost:${DEBUG_PORT}/json`)).json();
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

for (const [dir, w, h, dpr, sat, sab] of DEVICES) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: true });
  for (const lang of LANGS) {
    mkdirSync(`store/${dir}/${lang}`, { recursive: true });
    for (const [n, scene] of SCENES.entries()) {
      await send('Page.navigate', { url: `${APP}/?shot=${scene}&lang=${lang}&sat=${sat}&sab=${sab}&t=${Date.now()}` });
      // wait for the scene to be applied and the fonts to be ready
      for (let i = 0; i < 60; i++) {
        const r = await send('Runtime.evaluate', { expression: `document.title === 'shot:${scene}' && document.fonts.status === 'loaded'` });
        if (r.result.value) break;
        await sleep(150);
      }
      await sleep(600); // a few frames
      const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      writeFileSync(`store/${dir}/${lang}/0${n + 1}-${scene}.png`, Buffer.from(shot.data, 'base64'));
    }
  }
}
ws.close();
chrome.kill();
console.log('screenshots written');
