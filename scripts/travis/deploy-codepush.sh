#!/bin/bash
set -ev
set -o pipefail

echo "releasing codepush for ios";
code-push release-react AllAboutOlaf-iOS ios -d release --targetBinaryVersion '2.*';
echo "releasing codepush for android";
code-push release-react AllAboutOlaf-Android android -d release --targetBinaryVersion '2.*';
