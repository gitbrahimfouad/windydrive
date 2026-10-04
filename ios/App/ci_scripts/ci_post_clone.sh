#!/bin/zsh
# Xcode Cloud: runs after the repository is cloned, before Xcode resolves Swift packages.
# The Capacitor plugins are local Swift packages living in node_modules/, and the web app
# (ios/App/App/public) is generated: neither is committed, so build them here.
set -euo pipefail

cd "${CI_PRIMARY_REPOSITORY_PATH:-$(cd "$(dirname "$0")/../../.." && pwd)}"

# Node.js (Xcode Cloud images ship Homebrew but not Node)
if ! command -v node > /dev/null 2>&1; then
  export HOMEBREW_NO_AUTO_UPDATE=1 HOMEBREW_NO_INSTALL_CLEANUP=1
  brew install node
fi
node --version

npm ci                 # exact versions from package-lock.json → node_modules/
npm run build          # type-check + Vite production build → dist/
npx cap sync ios       # copy dist/ into the iOS project, regenerate Capacitor config
