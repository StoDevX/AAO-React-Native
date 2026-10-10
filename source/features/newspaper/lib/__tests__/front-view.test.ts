import {describe, expect, test} from '@jest/globals'
import {linkedView, viewKey, viewOf} from '../front-view'
import {MESSENGER} from '../../../../campuses/edu-stolaf/paper'

describe('viewOf', () => {
	test.each([
		[null, {mode: 'issues', section: null}],
		['Issues', {mode: 'issues', section: null}],
		['Latest', {mode: 'latest', section: null}],
		['Latest:Sports', {mode: 'latest', section: 'Sports'}],
		['Issues:Sports', {mode: 'issues', section: 'Sports'}],
		['Latest:Arts & Entertainment', {mode: 'latest', section: 'Arts & Entertainment'}],
	])('reads %p as %p', (saved, view) => {
		expect(viewOf(saved, MESSENGER.mainSections)).toStrictEqual(view)
	})

	// Keys an installed copy may still hold that name no view.
	test.each(['Top', 'News', 'Variety', 'Messenger Wars', 'Latest:Horoscopes', ''])(
		'opens By Issue with no filter for %p',
		(saved) => {
			expect(viewOf(saved, MESSENGER.mainSections)).toStrictEqual({mode: 'issues', section: null})
		},
	)
})

test('viewKey writes what viewOf reads', () => {
	for (let view of [
		{mode: 'issues', section: null},
		{mode: 'latest', section: null},
		{mode: 'latest', section: 'News'},
		{mode: 'issues', section: 'Opinions'},
	] as const) {
		expect(viewOf(viewKey(view), MESSENGER.mainSections)).toStrictEqual(view)
	}
})

describe('linkedView', () => {
	test.each([
		['Issues', undefined, {mode: 'issues', section: null}],
		['Latest', undefined, {mode: 'latest', section: null}],
		['Latest', 'Variety', {mode: 'latest', section: 'Variety'}],
		['Latest', 'Arts & Entertainment', {mode: 'latest', section: 'Arts & Entertainment'}],
	])('opens view %p, section %p, as %p', (view, section, expected) => {
		expect(linkedView(view, section, MESSENGER.mainSections)).toStrictEqual(expected)
	})

	// A link that names no view leaves the remembered one alone, rather than opening By Issue.
	test.each([
		[undefined, undefined],
		[undefined, 'Variety'],
		['', undefined],
		['Top', undefined],
		['latest', undefined],
		['Latest', 'Horoscopes'],
		['Latest:Variety', undefined],
		['Latest', ''],
	])('ignores view %p, section %p', (view, section) => {
		expect(linkedView(view, section, MESSENGER.mainSections)).toBeNull()
	})
})
