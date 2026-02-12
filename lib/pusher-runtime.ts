import type Pusher from 'pusher-js';

let unloadPatched = false;

export function disablePusherUnloadListener(pusher: typeof Pusher | any) {
  if (unloadPatched) return;
  if (typeof window === 'undefined') return;
  const runtime = pusher?.Runtime;
  if (!runtime || runtime.__unloadPatched) return;

  const noop = () => {};
  runtime.addUnloadListener = noop;
  runtime.removeUnloadListener = noop;
  runtime.__unloadPatched = true;
  unloadPatched = true;
}
