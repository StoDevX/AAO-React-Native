import {expect, test} from '@jest/globals'

import type {UnprocessedBusLine} from '../../types'
import {visibleBusLines} from '../visible-bus-lines'

function line(name: string, hidden?: boolean): UnprocessedBusLine {
	return {line: name, colors: {bar: '#000', dot: '#fff'}, hidden, schedules: []}
}

test('keeps a line the feed says nothing about', () => {
	expect(visibleBusLines([line('Express Bus')]).map((l) => l.line)).toStrictEqual(['Express Bus'])
})

test('keeps a line the feed has un-hidden', () => {
	expect(visibleBusLines([line('Express Bus', false)]).map((l) => l.line)).toStrictEqual([
		'Express Bus',
	])
})

test('drops a line the feed has retired', () => {
	let lines = [line('Express Bus'), line('Oles Go', true), line('Red Line')]
	expect(visibleBusLines(lines).map((l) => l.line)).toStrictEqual(['Express Bus', 'Red Line'])
})

test('drops every line when the feed has retired them all', () => {
	expect(visibleBusLines([line('Oles Go', true)])).toStrictEqual([])
})
