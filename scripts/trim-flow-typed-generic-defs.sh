#!/bin/bash

for file in $(find ./flow-typed/npm | grep '.*vx.x.x.js$'); do
    echo "$file"
    END="$(rg -F '}' --line-number "$file" | head -n1 | cut -d: -f1)"
    head -n "$END" "$file" | tee "$file.min" > /dev/null
    mv "$file.min" "$file"
done
