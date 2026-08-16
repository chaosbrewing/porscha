#!/bin/sh
# Production entrypoint: apply database migrations, then start the app.
# Equivalent to `npm run db:migrate && npm start` (the migrator here is
# drizzle-orm's, sharing the same migration journal as drizzle-kit).
set -e

echo "[entrypoint] applying database migrations"
node scripts/migrate.mjs

echo "[entrypoint] starting porscha.today"
exec npm start
