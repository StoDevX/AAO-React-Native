// typescript-eslint@8.67.0 hard-refuses to run against TypeScript 7 (its own
// peer range is ">=4.8.4 <6.1.0"; TS 7's native compiler changed APIs it
// hasn't caught up to yet -- see
// https://github.com/typescript-eslint/typescript-eslint/issues/10940).
//
// `pnpm.overrides` can't fix this: it can rewrite a *version range*, but
// typescript is still a peerDependency here, and pnpm resolves peers by
// linking in whatever satisfies the name from an ancestor -- which is always
// this project's real typescript@7 devDependency. `pnpm.packageExtensions`
// can't fix it either: adding `dependencies.typescript` alongside an
// existing `peerDependencies.typescript` of the same name still lets the
// peer link win once one is satisfiable, so the added dependency is never
// used.
//
// The only lever left is rewriting the manifest before pnpm resolves peers
// at all: drop `typescript` from peerDependencies on typescript-eslint and
// its @typescript-eslint/* subpackages, and add it back as a real
// dependency pinned to a TS 6 release. That gives the whole typescript-eslint
// subtree its own isolated TypeScript 6 instance to run against, while
// tsc/ts-jest/the rest of the project keep using the real typescript
// devDependency (7.x). Remove this file once #10940 closes and
// typescript-eslint supports TS 7.
const TYPESCRIPT_ESLINT_TS_VERSION = '6.0.3'

function readPackage(pkg) {
	const isTypescriptEslintFamily =
		pkg.name === 'typescript-eslint' ||
		(pkg.name && pkg.name.startsWith('@typescript-eslint/'))

	if (isTypescriptEslintFamily && pkg.peerDependencies?.typescript) {
		delete pkg.peerDependencies.typescript
		if (pkg.peerDependenciesMeta) {
			delete pkg.peerDependenciesMeta.typescript
		}
		pkg.dependencies = {
			...pkg.dependencies,
			typescript: TYPESCRIPT_ESLINT_TS_VERSION,
		}
	}

	return pkg
}

module.exports = {
	hooks: {
		readPackage,
	},
}
