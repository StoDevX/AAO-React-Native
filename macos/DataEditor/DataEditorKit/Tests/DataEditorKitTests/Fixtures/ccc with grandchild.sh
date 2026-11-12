#!/bin/sh
# Stands in for ccc's node, which starts wrangler and workerd: ignores TERM,
# as do the children it starts, so only a SIGKILL to its group ends them.
trap '' TERM
sleep 30 &
echo "grandchild $!"
wait
