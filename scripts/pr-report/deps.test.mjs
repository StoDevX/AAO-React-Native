import assert from 'node:assert/strict'
import {linkSync, mkdirSync, mkdtempSync, symlinkSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {describe, it} from 'node:test'

import {nodeModulesBytes, parsePackages} from './deps.mjs'

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
