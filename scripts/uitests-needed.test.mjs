import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {uitestsNeeded} from './uitests-needed.mjs'

describe('uitestsNeeded', () => {
	it('skips a documentation-only change', () => {
		assert.equal(uitestsNeeded(['README.md', 'docs/notes.md']), false)
	})

	it('skips a Jest-only change', () => {
		assert.equal(
			uitestsNeeded([
				'modules/ccc-calendar/__tests__/query-select.test.ts',
				'source/testing/render.tsx',
			]),
			false,
		)
	})

	it('runs when any app code changed', () => {
		assert.equal(uitestsNeeded(['README.md', 'app/(home)/Dictionary/index.tsx']), true)
	})

	it('runs when a dependency changed', () => {
		assert.equal(uitestsNeeded(['pnpm-lock.yaml']), true)
	})

	it('runs for a data/ file despite its extension', () => {
		// data/ is compiled into docs/ by `mise run bundle-data`, and the app
		// imports the result -- app/(settings)/Privacy.tsx renders
		// docs/privacy.json, compiled from this exact file.
		assert.equal(uitestsNeeded(['data/privacy.md']), true)
	})

	it('skips a data/_schemas/ file, which only the validation scripts read', () => {
		assert.equal(uitestsNeeded(['data/_schemas/faq.json']), false)
	})

	it('runs when a native dependency pin changed', () => {
		// Package.resolved is ios_scripts/'s SwiftPM equivalent of
		// pnpm-lock.yaml, and ios.yml diffs it against a fresh resolve to
		// catch a stale pin -- exactly the case above, one directory over.
		assert.equal(uitestsNeeded(['ios_scripts/Package.resolved']), true)
	})

	it('skips an unrelated workflow but runs for the iOS one', () => {
		assert.equal(uitestsNeeded(['.github/workflows/check.yml']), false)
		assert.equal(uitestsNeeded(['.github/workflows/ios.yml']), true)
	})

	it('skips a node:test file, which sits beside its subject rather than in __tests__/', () => {
		assert.equal(uitestsNeeded(['scripts/split-uitests.test.mjs']), false)
		assert.equal(uitestsNeeded(['plugins/with-binary-stripping.test.ts']), false)
	})

	it('runs when the script under one of those tests changed', () => {
		assert.equal(uitestsNeeded(['scripts/split-uitests.mjs']), true)
	})

	it('runs when the UITests themselves changed', () => {
		assert.equal(uitestsNeeded(['uitests/ModuleMoreTests.swift']), true)
	})

	it('runs on an empty list, which means we could not work out the diff', () => {
		assert.equal(uitestsNeeded([]), true)
	})
})
