files: tsc-errors tsc-counts eslint-problems

verify: files
	git diff --exit-code

tsc-errors:
	-npx tsc | sed s:$$(git rev-parse --show-toplevel):.:g | tee ${@}

tsc-counts:
	-npx tsc | rg -or '$$1' 'error (TS\d{4})' | sort | uniq -c | sort -nr | tee ${@}

eslint-problems:
	-npm run lint | tee ${@}

.PHONY: tsc-counts tsc-errors eslint-problems
