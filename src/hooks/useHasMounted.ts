import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

// Returns false during SSR and the client's initial hydration pass, then
// true immediately after — the standard replacement for the old
// `useState(false) + useEffect(() => setState(true))` "isMounted" idiom.
// useSyncExternalStore is built for exactly this server/client divergence:
// React renders getServerSnapshot() during hydration to match the server
// HTML exactly (no mismatch warning), then re-checks getSnapshot() right
// after mount — without ever calling setState from inside an effect body.
export const useHasMounted = (): boolean =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
