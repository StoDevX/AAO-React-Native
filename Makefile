tsc-errors: **/*.ts **/*.tsx
	npx tsc > ${@}

tsc-counts: **/*.ts **/*.tsx
	npx tsc | rg -or '$$1' 'error (TS\d{4})' | sort | uniq -c | sort -nr > ${@}
