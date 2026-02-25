"use client";

import { useEffect } from "react";

export function usePresenceHeartbeat(onHeartbeat: () => void, intervalMs = 15_000) {
  useEffect(() => {
    onHeartbeat();
    const id = window.setInterval(onHeartbeat, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, onHeartbeat]);
}
