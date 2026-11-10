#!/usr/bin/env bash
# Verifies that a sealed archive opens with the environment's key and that its
# payload is a readable tar stream. Run in the quarterly drill before restoring.
set -euo pipefail

archive="${1:?usage: verify.sh <sealed archive>}"
tmp="$(mktemp -d)"
trap 'rm -rf "${tmp}"' EXIT

node "$(dirname "$0")/seal.mjs" open "${archive}" "${tmp}/payload.tar.gz"
tar -tzf "${tmp}/payload.tar.gz" > /dev/null
echo "Verified: ${archive}"
