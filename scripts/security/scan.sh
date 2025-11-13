#!/usr/bin/env bash
# Simple helper to run security scanners for backend and frontend.
# Runs: brakeman, bundler-audit (backend) and pnpm audit (frontend).

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR/../.." && pwd)

echo "== Running backend security checks =="
cd "$ROOT_DIR/backend"

if ! command -v bundle >/dev/null 2>&1; then
  echo "Bundle not found. Please install Ruby and Bundler."
  exit 2
fi

bundle install --jobs 4 --retry 3

# Brakeman
if bundle info brakeman >/dev/null 2>&1; then
  echo "Running Brakeman..."
  bundle exec brakeman -q -A || true
else
  echo "Brakeman not installed in bundle. Skipping."
fi

# bundler-audit
if bundle info bundler-audit >/dev/null 2>&1; then
  echo "Updating bundler-audit database..."
  bundle exec bundler-audit update || true
  echo "Running bundler-audit check..."
  bundle exec bundler-audit check || { echo "bundler-audit found vulnerabilities"; exit 3; }
else
  echo "bundler-audit not installed in bundle. Skipping."
fi

echo "== Running frontend security checks =="
cd "$ROOT_DIR/frontend"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm not found. Please install Node.js and pnpm to run frontend audits."
  exit 2
fi

pnpm install --frozen-lockfile

# pnpm audit
echo "Running pnpm audit (summary)..."
PNPM_AUDIT_OUTPUT=$(pnpm audit --json 2>/dev/null || true)
if [ -z "$PNPM_AUDIT_OUTPUT" ]; then
  echo "No vulnerabilities reported by pnpm audit or audit not supported in this pnpm version."
else
    # Print a brief summary and fail if high severity vulnerabilities exist.
    if command -v jq >/dev/null 2>&1; then
      echo "$PNPM_AUDIT_OUTPUT" | jq '.metadata' || true
      HIGH_COUNT=$(echo "$PNPM_AUDIT_OUTPUT" | jq '.advisories | to_entries[]? | select(.value.severity == "high" or .value.severity == "critical")' | wc -l || true)
    else
      echo "jq not found; skipping detailed pnpm audit JSON parsing. Install jq for richer output."
      # Fallback: count occurrences of high/critical severity strings in the JSON
      HIGH_COUNT=$(echo "$PNPM_AUDIT_OUTPUT" | grep -E '"severity"\s*:\s*"(high|critical)"' -c || true)
    fi
  if [ "$HIGH_COUNT" -gt 0 ]; then
    echo "pnpm audit found high/critical vulnerabilities"
    echo "$PNPM_AUDIT_OUTPUT" | jq '.advisories'
    exit 4
  else
    echo "pnpm audit: no high/critical vulnerabilities found"
  fi
fi

echo "Security scan completed successfully."
