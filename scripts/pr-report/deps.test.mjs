import assert from 'node:assert/strict'
import {linkSync, mkdirSync, mkdtempSync, symlinkSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {describe, it} from 'node:test'

import {
	combineSizes,
	installedSizes,
	nodeModulesBytes,
	packageKeyOfDir,
	parsePackages,
} from './deps.mjs'

describe('parsePackages', () => {
	it('lists each package with its versions, sorted', () => {
		let lockfile = [
			"lockfileVersion: '9.0'",
			'packages:',
			'  react@19.2.3:',
			'    resolution: {integrity: sha512-a}',
			'  semver@7.6.0:',
			'    resolution: {integrity: sha512-b}',
			'  semver@6.3.1:',
			'    resolution: {integrity: sha512-c}',
			'snapshots:',
			'  react@19.2.3: {}',
			'',
		].join('\n')
		assert.deepEqual(parsePackages(lockfile), {react: ['19.2.3'], semver: ['6.3.1', '7.6.0']})
	})

	it('sorts versions as semver, not as text', () => {
		let lockfile = [
			'packages:',
			'  a@10.0.0:',
			'    resolution: {integrity: sha512-a}',
			'  a@9.1.0:',
			'    resolution: {integrity: sha512-b}',
			'  a@9.0.0-beta.1:',
			'    resolution: {integrity: sha512-c}',
			'  a@https://example.com/a.tgz:',
			'    resolution: {tarball: https://example.com/a.tgz}',
			'',
		].join('\n')
		assert.deepEqual(parsePackages(lockfile), {
			a: ['9.0.0-beta.1', '9.1.0', '10.0.0', 'https://example.com/a.tgz'],
		})
	})

	it('keeps a scoped name whole', () => {
		let lockfile = "packages:\n  '@babel/core@7.29.0':\n    resolution: {integrity: sha512-a}\n"
		assert.deepEqual(parsePackages(lockfile), {'@babel/core': ['7.29.0']})
	})

	it('keeps a non-registry version whole', () => {
		let lockfile = [
			'packages:',
			'  foo@https://example.com/foo@1.tgz:',
			'    resolution: {tarball: https://example.com/foo@1.tgz}',
			'',
		].join('\n')
		assert.deepEqual(parsePackages(lockfile), {foo: ['https://example.com/foo@1.tgz']})
	})

	it('returns an empty map when the lockfile has no packages', () => {
		assert.deepEqual(parsePackages("lockfileVersion: '9.0'\n"), {})
	})
})

describe('nodeModulesBytes through a symlinked directory', () => {
	// Files with a single link are not de-duplicated by inode, so reaching
	// them through a symlink would count them twice.
	let dir = mkdtempSync(join(tmpdir(), 'pr-report-symlink-'))
	mkdirSync(join(dir, 'real'))
	writeFileSync(join(dir, 'real', 'a.js'), 'x'.repeat(100))
	symlinkSync(join(dir, 'real'), join(dir, 'link-to-dir'))

	it('does not follow the symlink', () => {
		assert.equal(nodeModulesBytes(dir), 100)
	})
})

describe('nodeModulesBytes', () => {
	let dir = mkdtempSync(join(tmpdir(), 'pr-report-deps-'))
	mkdirSync(join(dir, 'real'))
	writeFileSync(join(dir, 'real', 'a.js'), 'x'.repeat(100))
	writeFileSync(join(dir, 'b.js'), 'y'.repeat(50))
	// pnpm hard-links a package into every project that uses it, and
	// symlinks packages into each other; neither adds bytes.
	linkSync(join(dir, 'real', 'a.js'), join(dir, 'linked.js'))
	symlinkSync(join(dir, 'real'), join(dir, 'link-to-dir'))
	symlinkSync(join(dir, 'b.js'), join(dir, 'link-to-file'))

	it('sums regular files once, ignoring hard links and symlinks', () => {
		assert.equal(nodeModulesBytes(dir), 150)
	})
})

describe('packageKeyOfDir', () => {
	it('names a registry package and its version', () => {
		assert.equal(packageKeyOfDir('semver@7.8.5'), 'semver@7.8.5')
	})

	it('restores the slash in a scoped name', () => {
		assert.equal(packageKeyOfDir('@babel+core@7.29.7'), '@babel/core@7.29.7')
	})

	it('drops a peer or patch suffix', () => {
		assert.equal(packageKeyOfDir('@babel+core@7.29.7_supports-color@8.1.1'), '@babel/core@7.29.7')
		assert.equal(
			packageKeyOfDir('react-native@0.86.3_patch_hash=6ca2e12_aea6764d'),
			'react-native@0.86.3',
		)
	})

	it('returns null for an entry that is not a package', () => {
		assert.equal(packageKeyOfDir('node_modules'), null)
		assert.equal(packageKeyOfDir('lock.yaml'), null)
	})
})

describe('installedSizes', () => {
	let pnpm = mkdtempSync(join(tmpdir(), 'pr-report-pnpm-'))
	let file = (dir, name, bytes) => {
		mkdirSync(dir, {recursive: true})
		writeFileSync(join(dir, name), 'x'.repeat(bytes))
	}
	file(join(pnpm, 'semver@6.3.1', 'node_modules', 'semver'), 'index.js', 10)
	file(join(pnpm, 'semver@7.8.5', 'node_modules', 'semver'), 'a.js', 20)
	file(join(pnpm, 'semver@7.8.5', 'node_modules', 'semver'), 'b.js', 5)
	// pnpm symlinks a package's dependencies beside it; they belong to
	// their own directories.
	symlinkSync(
		join(pnpm, 'semver@6.3.1', 'node_modules', 'semver'),
		join(pnpm, 'semver@7.8.5', 'node_modules', 'older'),
	)
	// One version installed against two peers is one version, not two.
	file(
		join(pnpm, '@sentry+react@1.0.0_react@19.0.0', 'node_modules', '@sentry', 'react'),
		'x.js',
		7,
	)
	file(
		join(pnpm, '@sentry+react@1.0.0_react@18.0.0', 'node_modules', '@sentry', 'react'),
		'x.js',
		7,
	)
	writeFileSync(join(pnpm, 'lock.yaml'), 'ignored')

	it("sums each version's own files, once per version", () => {
		assert.deepEqual(installedSizes(pnpm), {
			'semver@6.3.1': 10,
			'semver@7.8.5': 25,
			'@sentry/react@1.0.0': 7,
		})
	})
})

describe('combineSizes', () => {
	it('pairs installed and bundled bytes, with zero for a side that has none', () => {
		assert.deepEqual(combineSizes({a: 5}, {a: 3, b: 2}), {
			a: {installed: 5, bundled: 3},
			b: {installed: 0, bundled: 2},
		})
	})
})
