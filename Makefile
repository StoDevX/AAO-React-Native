diff-errors:
	npx tsc > "tsc-errors.branch" || true
	git checkout master
	npx tsc > "tsc-errors.main" || true
	git checkout -
	diff -wu tsc-errors.main tsc-errors.branch
