#!/bin/bash
# Runs the hermesc that Xcode's Release build uses: the hermes-compiler package
# react-native depends on, whose version matches the Hermes VM in the app.
# Arguments pass straight through.
set -euo pipefail
hermes=$(node -p "require('path').dirname(require.resolve('hermes-compiler/package.json', {paths: [require('path').dirname(require.resolve('react-native/package.json'))]}))")
case "$(uname -s)" in
	Darwin) bin="$hermes/hermesc/osx-bin/hermesc" ;;
	*) bin="$hermes/hermesc/linux64-bin/hermesc" ;;
esac
exec "$bin" "$@"
