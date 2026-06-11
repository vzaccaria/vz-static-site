#!/bin/bash
# Sync design system tokens and fonts from vz-personal-store monorepo.
# Usage: DS_ROOT=/path/to/vz-personal-store/design-system ./scripts/sync-ds.sh
# Default DS_ROOT: ../vz-personal-store/design-system

set -euo pipefail

# Default to sibling directory, allow override via env
DS_ROOT="${DS_ROOT:-../vz-personal-store/design-system}"

# Validate DS_ROOT exists
if [ ! -d "$DS_ROOT" ]; then
  echo "ERROR: DS_ROOT not found: $DS_ROOT" >&2
  echo "Set DS_ROOT=/path/to/vz-personal-store/design-system or place monorepo as sibling" >&2
  exit 1
fi

# Validate required build script exists
if [ ! -f "$DS_ROOT/scripts/build.mjs" ]; then
  echo "ERROR: build.mjs not found in DS_ROOT/scripts/" >&2
  exit 1
fi

echo "Building design system from: $DS_ROOT"
node "$DS_ROOT/scripts/build.mjs"

# Ensure destination directory exists
mkdir -p src/styles/ds/

# Copy built artifacts
echo "Copying tokens.css, fonts.css, fonts/ to src/styles/ds/"
cp -f "$DS_ROOT/build/tokens.css" src/styles/ds/
cp -f "$DS_ROOT/build/fonts.css" src/styles/ds/
cp -rf "$DS_ROOT/build/fonts/" src/styles/ds/

echo "Design system sync complete!"