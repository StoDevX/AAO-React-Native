import {expect, test} from '@jest/globals'

import {homeLayoutShown, homeLayoutsOffered} from '../layout'

test('the Phone layout is offered only in dev mode', () => {
	expect(homeLayoutsOffered(false).map(([layout]) => layout)).toEqual(['tiled', 'list'])
	expect(homeLayoutsOffered(true).map(([layout]) => layout)).toEqual(['tiled', 'list', 'phone'])
})

test('a saved Phone layout draws as tiles outside dev mode, and as itself in it', () => {
	expect(homeLayoutShown('phone', false)).toBe('tiled')
	expect(homeLayoutShown('phone', true)).toBe('phone')
	expect(homeLayoutShown('list', false)).toBe('list')
})
