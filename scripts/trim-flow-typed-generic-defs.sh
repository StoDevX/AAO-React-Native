#!/bin/bash
# Usage: From root of project, run ./script/trim-flow-generic-defs.sh
# Required binaries: ripgrep

for file in $(find ./flow-typed/npm | grep '.*vx.x.x.js$'); do
    echo "$file"
    END="$(rg -F '}' --line-number "$file" | head -n1 | cut -d: -f1)"
    head -n "$END" "$file" | tee "$file.min" > /dev/null
    mv "$file.min" "$file"
done
