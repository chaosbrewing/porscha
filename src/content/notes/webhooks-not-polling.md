---
title: Let GitHub call you
date: 2026-08-05
kind: devlog
---

This site shows near-realtime progress on my projects, and the tempting
first implementation was to poll GitHub from the browser. Don't.

The shape that works: GitHub webhooks land on one endpoint, get their
signatures verified, get normalized into boring internal events, and update
a per-project snapshot in Postgres. Pages read the snapshot. The browser
talks only to this site, never to GitHub.

Polling survives only as a reconciliation pass for the events webhooks
inevitably drop — a safety net, not a strategy.
