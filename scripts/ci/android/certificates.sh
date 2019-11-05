#!/bin/bash

set -e
set -o pipefail

ruby scripts/ci/android/matchesque.rb
