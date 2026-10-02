import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {describe, it} from 'node:test'
import {importedPackages, moduleProblems} from './workspace-deps.mjs'

describe('importedPackages', () => {
	let names = (source) => [...importedPackages(source)].sort((a, b) => a.localeCompare(b))

	it('reads every form of import', () => {
		let source = [
			"import React from 'react'",
			"import {View} from 'react-native'",
			"import type {Moment} from 'moment'",
			"export {thing} from '@frogpond/colors'",
			"import 'side-effect'",
			"let lazy = require('lazy-package')",
			"let later = await import('dynamic-package')",
			"jest.mock('mocked-package', () => ({}))",
		].join('\n')
		assert.deepEqual(names(source), [
			'@frogpond/colors',
			'dynamic-package',
			'lazy-package',
			'mocked-package',
			'moment',
			'react',
			'react-native',
			'side-effect',
		])
	})

	it('reads an import that spans lines', () => {
		let source = "import {\n\tone,\n\ttwo,\n} from 'spread-out'"
		assert.deepEqual(names(source), ['spread-out'])
	})

	it('names the package a subpath belongs to', () => {
		let source = "import a from '@expo/ui/swift-ui'\nimport b from 'date-fns/locale'"
		assert.deepEqual(names(source), ['@expo/ui', 'date-fns'])
	})

	// Quoted text in a test name or a comment is not an import.
	it('ignores package-like text inside strings and comments', () => {
		let source = [
			"it('reads from \\'aeroplane mode\\' and stops', () => {})",
			"// pulled from 'some-package' long ago",
			"let label = `copied from 'elsewhere'`",
		].join('\n')
		assert.deepEqual(names(source), [])
	})

	it('ignores relative paths and Node builtins', () => {
		let source =
			"import a from './local'\nimport b from '../up'\nimport fs from 'node:fs'\nimport path from 'path'"
		assert.deepEqual(names(source), [])
	})
})

/** A module on disk with `manifest` as its package.json and `files` as its sources. */
function moduleWith(manifest, files) {
	let dir = fs.mkdtempSync(path.join(os.tmpdir(), 'workspace-deps-'))
	fs.writeFileSync(
		path.join(dir, 'package.json'),
		JSON.stringify({name: '@frogpond/subject', ...manifest}),
	)
	for (let [name, contents] of Object.entries(files)) {
		fs.mkdirSync(path.dirname(path.join(dir, name)), {recursive: true})
		fs.writeFileSync(path.join(dir, name), contents)
	}
	return dir
}

describe('moduleProblems', () => {
	it('accepts a module that declares what it imports', () => {
		let dir = moduleWith(
			{peerDependencies: {react: 'catalog:'}, devDependencies: {'@jest/globals': '30.5.2'}},
			{
				'index.ts': "import React from 'react'",
				'__tests__/index.test.ts': "import {test} from '@jest/globals'\nimport React from 'react'",
			},
		)
		assert.deepEqual(moduleProblems(dir), [])
	})

	it('names a package imported without being declared', () => {
		let dir = moduleWith({}, {'index.ts': "import {z} from 'zod'"})
		assert.deepEqual(moduleProblems(dir), ['@frogpond/subject imports zod without declaring it'])
	})

	// A dev dependency is not installed for whoever uses the module.
	it('names a runtime import that is only a dev dependency', () => {
		let dir = moduleWith({devDependencies: {zod: '4.6.5'}}, {'index.ts': "import {z} from 'zod'"})
		assert.deepEqual(moduleProblems(dir), [
			'@frogpond/subject imports zod outside its tests, but declares it only in devDependencies',
		])
	})

	it('lets tests import dev dependencies', () => {
		let dir = moduleWith(
			{devDependencies: {'@testing-library/react-native': '14.0.1'}},
			{'lib/__tests__/thing.test.tsx': "import {render} from '@testing-library/react-native'"},
		)
		assert.deepEqual(moduleProblems(dir), [])
	})

	it('names a @frogpond package declared but never imported', () => {
		let dir = moduleWith({dependencies: {'@frogpond/colors': 'workspace:*'}}, {'index.ts': ''})
		assert.deepEqual(moduleProblems(dir), [
			'@frogpond/subject declares @frogpond/colors but does not import it',
		])
	})

	it('does not ask a module to declare itself', () => {
		let dir = moduleWith({}, {'__tests__/self.test.ts': "import x from '@frogpond/subject'"})
		assert.deepEqual(moduleProblems(dir), [])
	})
})
