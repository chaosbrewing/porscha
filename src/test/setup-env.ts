// Vitest setup: minimal environment so server modules can load.
process.env.SESSION_SECRET ??=
  "test-session-secret-0123456789abcdef0123456789abcdef";
process.env.DATABASE_URL ??=
  "postgres://porscha:porscha_dev@localhost:5432/porscha";
process.env.SITE_URL ??= "http://localhost:3000";
