"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/**
 * True once the component is running on the client.
 *
 * The usual `useEffect(() => setMounted(true), [])` is a synchronous setState
 * inside an effect, which schedules a cascading render. `useSyncExternalStore`
 * expresses the same thing declaratively: the server snapshot is `false`, the
 * client snapshot is `true`, and React handles the switch as part of hydration.
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(
    noop,
    () => true, // client snapshot
    () => false, // server snapshot
  );
}
