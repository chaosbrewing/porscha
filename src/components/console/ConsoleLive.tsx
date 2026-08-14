"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

/**
 * Live console updates.
 *
 * Opens an SSE connection to /api/console/stream and refreshes the
 * server-rendered console when project state changes. Connection state
 * drives the system indicator: Live / Updating / Delayed / Disconnected.
 * While disconnected, a slow polling refresh keeps data from rotting.
 */

export type LiveStatus = "live" | "updating" | "delayed" | "disconnected";

const LiveStatusContext = createContext<LiveStatus>("disconnected");
export function useLiveStatus(): LiveStatus {
  return useContext(LiveStatusContext);
}

const HEARTBEAT_TIMEOUT_MS = 70_000; // ~2 missed heartbeats
const FALLBACK_REFRESH_MS = 60_000;
const REFRESH_DEBOUNCE_MS = 800;

export function ConsoleLive({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<LiveStatus>("updating");
  const lastSeenRef = useRef<number>(0);

  useEffect(() => {
    let disposed = false;
    lastSeenRef.current = Date.now();
    let source: EventSource | null = null;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleRefresh = () => {
      if (refreshTimer) return;
      refreshTimer = setTimeout(() => {
        refreshTimer = null;
        setStatus((s) => (s === "live" ? "updating" : s));
        router.refresh();
        // Settle back to live shortly after the refresh kicks off.
        setTimeout(() => {
          if (!disposed) {
            setStatus((s) => (s === "updating" ? "live" : s));
          }
        }, 600);
      }, REFRESH_DEBOUNCE_MS);
    };

    const connect = () => {
      if (disposed) return;
      source = new EventSource("/api/console/stream");
      source.addEventListener("hello", () => {
        lastSeenRef.current = Date.now();
        setStatus("live");
      });
      source.addEventListener("update", () => {
        lastSeenRef.current = Date.now();
        scheduleRefresh();
      });
      source.onerror = () => {
        // EventSource retries automatically while the tab is open.
        setStatus("disconnected");
      };
    };
    connect();

    // Watchdog: no heartbeat for a while → delayed.
    const watchdog = setInterval(() => {
      const silentFor = Date.now() - lastSeenRef.current;
      if (silentFor > HEARTBEAT_TIMEOUT_MS) {
        setStatus((s) => (s === "live" ? "delayed" : s));
      }
    }, 15_000);

    // Fallback refresh while not live, so missed events can't strand
    // stale data on screen.
    const fallback = setInterval(() => {
      setStatus((s) => {
        if (s === "delayed" || s === "disconnected") router.refresh();
        return s;
      });
    }, FALLBACK_REFRESH_MS);

    return () => {
      disposed = true;
      clearInterval(watchdog);
      clearInterval(fallback);
      if (refreshTimer) clearTimeout(refreshTimer);
      source?.close();
    };
  }, [router]);

  return (
    <LiveStatusContext.Provider value={status}>
      {children}
    </LiveStatusContext.Provider>
  );
}

const STATUS_COPY: Record<LiveStatus, { label: string; dotClass: string }> = {
  live: { label: "Live", dotClass: "bg-ok pulse-live" },
  updating: { label: "Updating", dotClass: "bg-warn" },
  delayed: { label: "Delayed", dotClass: "bg-warn" },
  disconnected: { label: "Disconnected", dotClass: "bg-alert" },
};

/** The restrained system indicator shown in the console chrome. */
export function LiveStatusIndicator() {
  const status = useLiveStatus();
  const copy = STATUS_COPY[status];
  return (
    <span
      className="inline-flex items-center gap-2 type-meta text-ink-inverse-soft"
      role="status"
      aria-live="polite"
    >
      <span aria-hidden="true" className={`size-1.5 rounded-full ${copy.dotClass}`} />
      {copy.label}
    </span>
  );
}
