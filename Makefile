files: tsc-errors tsc-counts eslint-problems

verify: files
	git diff --exit-code

tsc-errors:
	-npx tsc | sed "s:$$(git rev-parse --show-toplevel):.:g" | tee ${@}

tsc-counts: tsc-errors
	-cat ${<} | rg -or '$$1' 'error (TS\d+)' | sort | uniq -c | sort -nr | sed 's/^ *//' | tee ${@}

eslint-problems:
	-npm run lint | sed "s:$$(git rev-parse --show-toplevel):.:g" | tee ${@}

.PHONY: tsc-counts tsc-errors eslint-problems
