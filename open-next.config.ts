import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * OpenNext configuration for the Cloudflare Workers deployment.
 *
 * No incremental cache backend is configured on purpose: the app uses
 * no ISR/revalidation — every data-bearing route is force-dynamic and
 * the remaining public pages are fully prerendered at build time and
 * served from Workers Assets. Authenticated console pages and private
 * APIs are dynamic and therefore never publicly cached.
 */
export default defineCloudflareConfig({});
