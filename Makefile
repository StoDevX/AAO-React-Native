tsc-errors:
	npx tsc | tee ${@}

tsc-counts:
	npx tsc | rg -or '$$1' 'error (TS\d{4})' | sort | uniq -c | sort -nr | tee ${@}

.PHONY: tsc-counts tsc-errors
