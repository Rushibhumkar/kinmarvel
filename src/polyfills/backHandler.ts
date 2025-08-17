// src/polyfills/backHandler.ts
import {BackHandler} from 'react-native';

type Handler = () => boolean;
type Entry = {handler: Handler; remove: () => void};
const registry: Record<string, Entry[]> = {};

const originalAdd = BackHandler.addEventListener.bind(BackHandler);
const hasRemove =
  typeof (BackHandler as any).removeEventListener === 'function';

if (!hasRemove) {
  (BackHandler as any).addEventListener = (type: string, handler: Handler) => {
    const sub = originalAdd(type, handler);
    if (!registry[type]) registry[type] = [];
    registry[type].push({handler, remove: () => sub.remove()});
    return sub;
  };

  (BackHandler as any).removeEventListener = (
    type: string,
    handler: Handler,
  ) => {
    const list = registry[type];
    if (!list) return;
    const idx = list.findIndex(e => e.handler === handler);
    if (idx !== -1) {
      try {
        list[idx].remove();
      } catch {}
      list.splice(idx, 1);
    }
  };
}
