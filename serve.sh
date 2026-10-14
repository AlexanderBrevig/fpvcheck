#!/usr/bin/env bash
# Serve fpvcheck on http://localhost:8080 (service worker + geolocation work on localhost).
# Phone over USB: `adb reverse tcp:8080 tcp:8080`, then open http://localhost:8080 in Chrome on the phone.
cd "$(dirname "$0")"
PORT="${1:-8080}"
exec nix shell nixpkgs#python3 -c python3 -m http.server "$PORT" --bind 127.0.0.1
