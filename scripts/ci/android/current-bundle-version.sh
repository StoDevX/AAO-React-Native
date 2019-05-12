#!/bin/bash

set -e
set -o pipefail

: "${GRADLE_FILE:?Expected GRADLE_FILE to be set}"

grep 'versionName ' "$GRADLE_FILE" | egrep -o '\d+[.]\d+[.]\d+' | tail -n1
