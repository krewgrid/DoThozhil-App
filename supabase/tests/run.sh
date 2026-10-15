#!/bin/sh
# Runs the Krewgrid rule tests on a scratch database. Needs Postgres 15+ (set PGHOST/PGPORT/PGUSER).
set -e
cd "$(dirname "$0")/.."
psql -v ON_ERROR_STOP=1 -q -c "drop database if exists krewgrid_test" -c "create database krewgrid_test"
for f in tests/stubs.sql migrations/0001_krewgrid.sql migrations/0002_storage.sql tests/lifecycle.sql; do
  psql -d krewgrid_test -v ON_ERROR_STOP=1 -q -f "$f" 2>&1 | grep -v -e wal_level -e HINT || true
done | grep -E "FAIL|ERROR|ALL TESTS PASSED" || true
