import {describe, expect, it} from '@jest/globals'
import {splitOpening} from '../opening'

describe('splitOpening', () => {
	it('takes the first four words of a plain opening run', () => {
		expect(
			splitOpening([{text: 'Student workers from the St. Olaf union delivered'}]),
		).toStrictEqual({
			opening: 'Student workers from the',
			rest: [{text: ' St. Olaf union delivered'}],
		})
	})

	it('keeps the runs after the first one as they are', () => {
		let runs = [{text: 'One two three four five '}, {text: 'bold', bold: true}]
		expect(splitOpening(runs)).toStrictEqual({
			opening: 'One two three four',
			rest: [{text: ' five '}, {text: 'bold', bold: true}],
		})
	})

	it('takes the whole run when it has four words or fewer, leaving no empty run', () => {
		let runs = [{text: 'Just three words'}, {text: ' then italic', italic: true}]
		expect(splitOpening(runs)).toStrictEqual({
			opening: 'Just three words',
			rest: [{text: ' then italic', italic: true}],
		})
	})

	it('stops at a line break', () => {
		expect(splitOpening([{text: 'Dear reader,\nwe begin'}])).toStrictEqual({
			opening: 'Dear reader,',
			rest: [{text: '\nwe begin'}],
		})
	})

	it('leaves a paragraph that opens with styled text alone', () => {
		let runs = [{text: 'Update:', bold: true}, {text: ' the vote passed'}]
		expect(splitOpening(runs)).toStrictEqual({opening: '', rest: runs})
	})

	it('leaves a paragraph that opens with a link alone', () => {
		let runs = [{text: 'SGA', href: 'https://x.test/'}, {text: ' met on Tuesday'}]
		expect(splitOpening(runs)).toStrictEqual({opening: '', rest: runs})
	})

	it('gives nothing for no runs', () => {
		expect(splitOpening([])).toStrictEqual({opening: '', rest: []})
	})
})
