/* eslint-env jest */

import {msUntilIntervalRepeat} from '../index'

describe('msUntilIntervalRepeat', () => {
	test.each`
		now              | interval | expected
		${100}           | ${10}    | ${10}
		${1536625260000} | ${60000} | ${60000}
		${60000}         | ${60000} | ${60000}
		${35}            | ${60}    | ${25}
		${110}           | ${100}   | ${90}
		${1}             | ${9}     | ${8}
		${1000}          | ${20}    | ${20}
		${9}             | ${20}    | ${11}
	`(
		'returns remaining: $expected with now: $now and interval: $interval',
		({now, interval, expected}) => {
			expect(msUntilIntervalRepeat(now, interval)).toBe(expected)
		},
	)
})
