import {describe, it, expect} from '@jest/globals'
import {AllViews} from '../views'

describe('AllViews()', () => {
	it('every view has a non-empty kebab-case id', () => {
		const views = AllViews()
		const idPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/
		for (const view of views) {
			expect(view.id).toMatch(idPattern)
		}
	})

	it('all view ids are unique', () => {
		const views = AllViews()
		const ids = views.map((view) => view.id)
		const unique = new Set(ids)
		expect(unique.size).toBe(ids.length)
	})
})
