import {describe, expect, test} from '@jest/globals'

import {historyKey, routeKey} from '../store'
import {recentRequests, recordRequest} from '../util/history'

describe('historyKey', () => {
	test("keeps each campus's remembered requests apart", () => {
		let route = routeKey('GET', '/v1/food/menu/:cafeId')
		let history = recordRequest([], historyKey('edu.stolaf', route), {
			pathValues: {cafeId: '262'},
			query: [],
		})
		expect(recentRequests(history, historyKey('edu.carleton', route))).toEqual([])
		expect(recentRequests(history, historyKey('edu.stolaf', route))).toHaveLength(1)
	})
})
