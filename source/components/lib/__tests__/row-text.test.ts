import {detailLinesOf, rowLabel} from '../row-text'

describe('detailLinesOf', () => {
	it('takes a single line as it stands', () => {
		expect(detailLinesOf('Runs every 20 minutes')).toEqual(['Runs every 20 minutes'])
	})

	it('keeps several lines in the order they were given', () => {
		expect(detailLinesOf(['Rølvaag Library', '7:00 PM'])).toEqual(['Rølvaag Library', '7:00 PM'])
	})

	it('has no lines for a row that was given none', () => {
		expect(detailLinesOf(undefined)).toEqual([])
	})

	// A row builds its lines straight from optional fields, so an absent one
	// arrives as a hole in the array rather than being left out of it. Drawing
	// the hole would leave a gap where a line should be.
	it('drops the gaps an absent or blank line would leave', () => {
		expect(detailLinesOf([undefined, 'Only this one', '', null, '   '])).toEqual(['Only this one'])
	})
})

describe('rowLabel', () => {
	// VoiceOver reads a row once, so the title and its lines have to arrive as
	// one phrase rather than as separate elements to swipe between.
	it('reads the title and its lines as one phrase', () => {
		expect(rowLabel('Organ Recital', ['Rølvaag Library', '7:00 PM'])).toBe(
			'Organ Recital, Rølvaag Library, 7:00 PM',
		)
	})

	it('falls back to the title alone when there is nothing under it', () => {
		expect(rowLabel('Shuttle', undefined)).toBe('Shuttle')
	})

	it('leaves out a line it would not draw', () => {
		expect(rowLabel('Shuttle', ['', undefined])).toBe('Shuttle')
	})
})
