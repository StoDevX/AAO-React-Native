#!/bin/sh
# Stands in for the Node helper: echoes each request back as its result,
# fails the method "fail", and exits on the method "exit".
while IFS= read -r line; do
  id=$(printf '%s' "$line" | sed -E 's/^\{"id":([0-9]+).*/\1/')
  case "$line" in
    *'"method":"fail"'*) printf '{"id":%s,"error":{"message":"it failed"}}\n' "$id" ;;
    *'"method":"exit"'*) exit 0 ;;
    *) printf '{"id":%s,"result":{"echo":%s}}\n' "$id" "$line" ;;
  esac
done
