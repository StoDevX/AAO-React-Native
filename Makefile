files: tsc-errors tsc-counts eslint-problems

tsc-errors:
	npx tsc | tee ${@}

tsc-counts:
	npx tsc | rg -or '$$1' 'error (TS\d{4})' | sort | uniq -c | sort -nr | tee ${@}

eslint-problems:
	npm run eslint | tee ${@}

.PHONY: tsc-counts tsc-errors eslint-problems
