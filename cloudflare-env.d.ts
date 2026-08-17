/**
 * App-specific Cloudflare bindings, merged into the global
 * `CloudflareEnv` interface declared by @opennextjs/cloudflare.
 *
 * Structural types are declared here on purpose instead of installing
 * @cloudflare/workers-types: its global Request/Response/caches types
 * overlap the DOM lib this app compiles against, and the two runtime
 * touchpoints below only need these shapes.
 */

interface HyperdriveBinding {
  /** Connection string routed through Cloudflare Hyperdrive. */
  connectionString: string;
}

interface RealtimeHubStub {
  fetch(input: string | URL | Request, init?: RequestInit): Promise<Response>;
}

interface RealtimeHubNamespace {
  idFromName(name: string): unknown;
  get(id: unknown): RealtimeHubStub;
}

interface MediaObject {
  body: ReadableStream | null;
  httpEtag: string;
  size: number;
  httpMetadata?: { contentType?: string };
}

/** Minimal R2 surface: gallery media upload and read-back. */
interface MediaBucket {
  get(key: string): Promise<MediaObject | null>;
  put(
    key: string,
    value: ArrayBuffer,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<unknown>;
  delete(key: string): Promise<void>;
}

declare global {
  interface CloudflareEnv {
    HYPERDRIVE?: HyperdriveBinding;
    REALTIME_HUB?: RealtimeHubNamespace;
    MEDIA?: MediaBucket;
  }
}

export {};
