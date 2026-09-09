import {uitestsNeeded} from '../scripts/uitests-needed.mjs'

describe('uitestsNeeded', () => {
	it('skips a documentation-only change', () => {
		expect(uitestsNeeded(['README.md', 'docs/notes.md'])).toBe(false)
	})

	it('skips a Jest-only change', () => {
		expect(
			uitestsNeeded([
				'modules/ccc-calendar/__tests__/query-select.test.ts',
				'source/testing/render.tsx',
			]),
		).toBe(false)
	})

	it('runs when any app code changed', () => {
		expect(uitestsNeeded(['README.md', 'app/(home)/Dictionary/index.tsx'])).toBe(true)
	})

	it('runs when a dependency changed', () => {
		expect(uitestsNeeded(['pnpm-lock.yaml'])).toBe(true)
	})

	it('runs for a data/ file despite its extension', () => {
		// data/ is compiled into docs/ by `mise run bundle-data`, and the app
		// imports the result -- app/(settings)/Privacy.tsx renders
		// docs/privacy.json, compiled from this exact file.
		expect(uitestsNeeded(['data/privacy.md'])).toBe(true)
	})

	it('skips a data/_schemas/ file, which only the validation scripts read', () => {
		expect(uitestsNeeded(['data/_schemas/faq.json'])).toBe(false)
	})

	it('runs when a native dependency pin changed', () => {
		// Package.resolved is ios_scripts/'s SwiftPM equivalent of
		// pnpm-lock.yaml, and ios.yml diffs it against a fresh resolve to
		// catch a stale pin -- exactly the case above, one directory over.
		expect(uitestsNeeded(['ios_scripts/Package.resolved'])).toBe(true)
	})

	it('skips an unrelated workflow but runs for the iOS one', () => {
		expect(uitestsNeeded(['.github/workflows/check.yml'])).toBe(false)
		expect(uitestsNeeded(['.github/workflows/ios.yml'])).toBe(true)
	})

	it('runs when the UITests themselves changed', () => {
		expect(uitestsNeeded(['uitests/ModuleMoreTests.swift'])).toBe(true)
	})

	it('runs on an empty list, which means we could not work out the diff', () => {
		expect(uitestsNeeded([])).toBe(true)
	})
})
