import type {Run} from '../lib/diff'
import {withoutFullStop, withoutTrailingFullStop} from '../lib/full-stop'

describe('withoutFullStop', () => {
	it('drops the full stop a citation would otherwise run on from', () => {
		expect(withoutFullStop('The venue.')).toBe('The venue')
	})

	it('leaves a definition that never ended in one alone', () => {
		expect(withoutFullStop('The venue')).toBe('The venue')
	})

	// A colon does not replace what these carry, so they stay.
	it('keeps a question or exclamation mark', () => {
		expect(withoutFullStop('Who knows?')).toBe('Who knows?')
		expect(withoutFullStop('Watch out!')).toBe('Watch out!')
	})

	it('drops only the last one, so an ellipsis is not eaten a stop at a time', () => {
		expect(withoutFullStop('and so on...')).toBe('and so on..')
	})
})

describe('withoutTrailingFullStop', () => {
	it('leaves an added trailing full stop alone -- the edit itself added it', () => {
		let runs: Run[] = [
			{text: 'modify', mark: 'removed'},
			{text: 'modify.', mark: 'added'},
		]

		expect(withoutTrailingFullStop(runs)).toEqual(runs)
	})

	it('drops a trailing full stop that both the old and new text already carried', () => {
		let runs: Run[] = [
			{text: 'modify.', mark: 'removed'},
			{text: 'change.', mark: 'added'},
		]

		expect(withoutTrailingFullStop(runs)).toEqual([
			{text: 'modify.', mark: 'removed'},
			{text: 'change', mark: 'added'},
		])
	})

	it('has nothing to drop from an empty diff', () => {
		expect(withoutTrailingFullStop([])).toEqual([])
	})
})
