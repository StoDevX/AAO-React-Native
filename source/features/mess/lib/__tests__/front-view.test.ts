import {describe, expect, test} from '@jest/globals'
import {viewKey, viewOf} from '../front-view'

describe('viewOf', () => {
	test.each([
		[null, {mode: 'issues', section: null}],
		['Issues', {mode: 'issues', section: null}],
		['Latest', {mode: 'latest', section: null}],
		['Latest:Sports', {mode: 'latest', section: 'Sports'}],
		['Issues:Sports', {mode: 'issues', section: 'Sports'}],
		['Latest:Arts & Entertainment', {mode: 'latest', section: 'Arts & Entertainment'}],
	])('reads %p as %p', (saved, view) => {
		expect(viewOf(saved)).toStrictEqual(view)
	})

	// Saved by the chip row the switch replaced.
	test.each(['Top', 'News', 'Variety', 'Messenger Wars', 'Latest:Horoscopes', ''])(
		'opens By Issue with no filter for %p',
		(saved) => {
			expect(viewOf(saved)).toStrictEqual({mode: 'issues', section: null})
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
		expect(viewOf(viewKey(view))).toStrictEqual(view)
	}
})
