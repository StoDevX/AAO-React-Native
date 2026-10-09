import {describe, expect, test} from '@jest/globals'

import {groupRoutes, type RouteInput, type ServerRoute} from '../query'

function route(path: string, methods: string[], inputs: RouteInput[] = []): ServerRoute {
	return {
		path,
		displayName: path.replace(/^\/v1\//u, ''),
		methods,
		params: inputs.filter((input) => input.in === 'path').map((input) => input.name),
		inputs,
	}
}

describe('groupRoutes', () => {
	test('gives a path answering two methods one entry per method, each with its own key', () => {
		let [section] = groupRoutes([route('/_cache', ['DELETE']), route('/_cache', ['GET'])])
		expect(section?.data.map((entry) => [entry.method, entry.key])).toEqual([
			['DELETE', 'DELETE /_cache'],
			['GET', 'GET /_cache'],
		])
	})

	test('splits a layer answering several methods into an entry for each', () => {
		let [section] = groupRoutes([route('/v1/util/html-to-md', ['GET', 'POST'])])
		expect(section?.data.map((entry) => entry.method)).toEqual(['GET', 'POST'])
	})

	test("keeps the route's path, display name and path parameters on each entry", () => {
		let [section] = groupRoutes([
			route('/v1/food/menu/:cafeId', ['GET'], [{name: 'cafeId', in: 'path', required: true}]),
		])
		expect(section?.data[0]).toMatchObject({
			path: '/v1/food/menu/:cafeId',
			displayName: 'food/menu/:cafeId',
			params: ['cafeId'],
		})
	})

	test("keeps the route's inputs on each of its entries", () => {
		let cafeId: RouteInput = {name: 'cafeId', in: 'path', required: true}
		let [section] = groupRoutes([route('/v1/food/menu/:cafeId', ['GET'], [cafeId])])
		expect(section?.data[0]?.inputs).toEqual([cafeId])
	})

	test("groups entries under their path's first segment", () => {
		let sections = groupRoutes([route('/ping', ['GET']), route('/v1/news/rss', ['GET'])])
		expect(sections.map((section) => section.title)).toEqual(['ping', 'v1'])
	})
})
