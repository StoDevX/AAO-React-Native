import {describe, expect, test} from '@jest/globals'

import {buildRequestPath, clientPath, requestLabel} from '../request-path'

describe('buildRequestPath', () => {
	test('leaves a path without parameters alone', () => {
		expect(buildRequestPath('/ping', {}, [])).toBe('/ping')
	})

	test('fills each path parameter with its value', () => {
		expect(
			buildRequestPath('/v1/news/mess/wp/v2/:resource/:id', {resource: 'posts', id: '42'}, []),
		).toBe('/v1/news/mess/wp/v2/posts/42')
	})

	test('encodes a path value so it stays one segment', () => {
		expect(buildRequestPath('/v1/orgs/uri/:uri', {uri: 'a/b c'}, [])).toBe('/v1/orgs/uri/a%2Fb%20c')
	})

	test('keeps the placeholder for a path parameter with no value yet', () => {
		expect(buildRequestPath('/v1/food/menu/:cafeId', {cafeId: ''}, [])).toBe(
			'/v1/food/menu/:cafeId',
		)
	})

	test('does not lowercase anything', () => {
		expect(buildRequestPath('/v1/calendar/google', {}, [{name: 'id', value: 'AbC@group'}])).toBe(
			'/v1/calendar/google?id=AbC%40group',
		)
	})

	test('appends query rows in order, repeating a name as often as it is given', () => {
		expect(
			buildRequestPath('/_cache', {}, [
				{name: 'key', value: 'a'},
				{name: 'key', value: 'b'},
			]),
		).toBe('/_cache?key=a&key=b')
	})

	test('sends a named row with an empty value, and skips a row with no name', () => {
		expect(
			buildRequestPath('/v1/streams/search', {}, [
				{name: 'q', value: ''},
				{name: '  ', value: 'ignored'},
			]),
		).toBe('/v1/streams/search?q=')
	})

	test('encodes query values', () => {
		expect(
			buildRequestPath('/v1/news/rss', {}, [{name: 'url', value: 'https://x.test/feed?a=1&b=2'}]),
		).toBe('/v1/news/rss?url=https%3A%2F%2Fx.test%2Ffeed%3Fa%3D1%26b%3D2')
	})
})

describe('clientPath', () => {
	// the client's base is the server's `/v1/`, wherever the server is mounted
	test('reaches a path from the server root through the base above `/v1/`', () => {
		expect(clientPath('/ping')).toBe('../ping')
		expect(clientPath('/v1/food/menu/262?x=1')).toBe('../v1/food/menu/262?x=1')
	})

	test('leaves a path typed relative to the base alone', () => {
		expect(clientPath('food/menu/262')).toBe('food/menu/262')
	})
})

describe('requestLabel', () => {
	test('names a request without a body by its path', () => {
		expect(requestLabel('/v1/food/menu/:cafeId', {pathValues: {cafeId: '262'}, query: []})).toBe(
			'/v1/food/menu/262',
		)
	})

	test('tells requests to one path apart by their bodies', () => {
		let label = (text: string) =>
			requestLabel('/v1/util/html-to-md', {pathValues: {}, query: [], bodyValues: {text}})
		expect(label('<b>a</b>')).toBe('/v1/util/html-to-md {"text":"<b>a</b>"}')
		expect(label('<b>a</b>')).not.toBe(label('<i>b</i>'))
	})
})
