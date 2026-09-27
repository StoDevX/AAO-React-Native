import {describe, expect, test} from '@jest/globals'

import {AllViews, HOME_GROUPS, homeSections} from '../views'

describe('the views registry', () => {
	test('every view has an id of its own', () => {
		let ids = AllViews().map((view) => view.id)

		expect(new Set(ids).size).toBe(ids.length)
	})

	test('every view belongs to a group home draws', () => {
		let groups = new Set(HOME_GROUPS.map((group) => group.id))

		for (let view of AllViews()) {
			expect(groups).toContain(view.group)
		}
	})

	test('Help is the only group that cannot collapse', () => {
		let fixed = HOME_GROUPS.filter((group) => !group.collapsible).map((group) => group.id)

		expect(fixed).toEqual(['help'])
	})
})

describe('homeSections', () => {
	test('draws the groups in their fixed order', () => {
		let order = homeSections(AllViews(), {isDev: false}).map((section) => section.id)

		expect(order).toEqual([
			'eat',
			'get-around',
			'classes-work',
			'whats-on',
			'listen-watch',
			'just-for-fun',
			'help',
			'campus-communications',
		])
	})

	test('leaves out the Dev group outside dev mode', () => {
		let ids = homeSections(AllViews(), {isDev: false}).flatMap((section) =>
			section.views.map((view) => view.id),
		)

		expect(ids).not.toContain('carleton-campus')
		expect(ids).not.toContain('carleton-menus')
	})

	test('adds the Dev group, last, in dev mode', () => {
		let sections = homeSections(AllViews(), {isDev: true})

		expect(sections.at(-1)?.id).toBe('dev')
	})

	test('shows Athletics outside dev mode', () => {
		let whatsOn = homeSections(AllViews(), {isDev: false}).find(
			(section) => section.id === 'whats-on',
		)

		expect(whatsOn?.views.map((view) => view.id)).toContain('athletics')
	})

	test('drops a disabled view, and a group it leaves empty', () => {
		let views = AllViews().map((view) =>
			view.group === 'just-for-fun' ? {...view, disabled: true} : view,
		)

		let ids = homeSections(views, {isDev: false}).map((section) => section.id)

		expect(ids).not.toContain('just-for-fun')
	})
})
