#!/bin/sh
set -e

# The compose file mounts ./frontend over /app but keeps node_modules in an
# anonymous volume. Re-run install when package.json/lock change so new deps
# (e.g. react-i18next) are available without a manual image rebuild.
npm install

exec npm run dev -- --host
