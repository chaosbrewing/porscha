#!/usr/bin/env node
/**
 * Bundles the Markdown content tree (src/content) into a JSON module so
 * the Cloudflare Workers runtime — which has no filesystem — can serve
 * the same content the Node runtime reads from disk.
 *
 * Runs automatically via the `prebuild` npm hook, so every `npm run
 * build` (including the one `opennextjs-cloudflare build` performs)
 * regenerates it. The generated file is committed so typecheck and test
 * runs work without a build step; content edits show up in the diff.
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const contentRoot = path.join(root, "src", "content");
const outFile = path.join(root, "src", "server", "content", "content-bundle.json");

/** @type {Record<string, string>} */
const files = {};

function walk(dir, prefix) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      walk(path.join(dir, entry.name), rel);
    } else if (entry.name.endsWith(".md") || entry.name.endsWith(".mdx")) {
      files[rel] = fs.readFileSync(path.join(dir, entry.name), "utf8");
    }
  }
}

walk(contentRoot, "");

const bundle = { generatedFrom: "src/content", files };
const json = `${JSON.stringify(bundle, null, 1)}\n`;

const previous = fs.existsSync(outFile) ? fs.readFileSync(outFile, "utf8") : null;
if (previous !== json) {
  fs.writeFileSync(outFile, json);
  console.log(`[content-bundle] wrote ${Object.keys(files).length} files to ${path.relative(root, outFile)}`);
} else {
  console.log(`[content-bundle] up to date (${Object.keys(files).length} files)`);
}
