tsc-errors:
	npx tsc > ${@}

tsc-counts:
	npx tsc | rg -or '$$1' 'error (TS\d{4})' | sort | uniq -c | sort -nr > ${@}

.PHONY: tsc-counts tsc-errors
