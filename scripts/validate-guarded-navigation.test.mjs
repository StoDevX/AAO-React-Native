import {describe, test} from 'node:test'
import assert from 'node:assert/strict'

import {findUnguardedBack} from './validate-guarded-navigation.mjs'

describe('findUnguardedBack', () => {
	test('reports a call to router.back()', () => {
		let found = findUnguardedBack([
			{path: 'app/Thing.tsx', contents: 'let x = 1\nonPress={() => router.back()}\n'},
		])
		assert.equal(found.length, 1)
		assert.equal(found[0].line, 2)
		assert.equal(found[0].file, 'app/Thing.tsx')
	})

	test('leaves navigation.goBack() alone', () => {
		let found = findUnguardedBack([
			{path: 'app/Thing.tsx', contents: 'onPress={() => navigation.goBack()}\n'},
		])
		assert.deepEqual(found, [])
	})

	test('catches every other way off a screen', () => {
		let sources = [
			'router.dismiss()',
			'router.dismissAll()',
			"router.dismissTo('/x')",
			'router.goBack()',
			'navigation.pop()',
			'navigation.popToTop()',
		]
		for (let contents of sources) {
			assert.equal(
				findUnguardedBack([{path: 'a.tsx', contents}]).length,
				1,
				`${contents} should be reported`,
			)
		}
	})

	test('catches the call however it is spaced', () => {
		let found = findUnguardedBack([{path: 'a.tsx', contents: 'router . back ()\n'}])
		assert.equal(found.length, 1)
	})

	test('does not fire on a different object of the same name', () => {
		let found = findUnguardedBack([
			{path: 'a.tsx', contents: 'myRouter.backwards()\nrouterBack()\n'},
		])
		assert.deepEqual(found, [])
	})

	test('orders findings by file, then line', () => {
		let found = findUnguardedBack([
			{path: 'b.tsx', contents: 'router.back()\n'},
			{path: 'a.tsx', contents: '\n\nrouter.back()\n'},
		])
		assert.deepEqual(
			found.map((one) => `${one.file}:${one.line}`),
			['a.tsx:3', 'b.tsx:1'],
		)
	})
})
