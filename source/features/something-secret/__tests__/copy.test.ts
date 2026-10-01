import {announcementFor, INSCRIPTION} from '../copy'

describe('announcementFor', () => {
	it('says nothing for the blank space', () => {
		expect(announcementFor('blank')).toBeNull()
	})

	it.each([
		['tremor', 'Something stirs'],
		['edge', 'Something rises from the ground'],
		['cracking', 'It is cracking'],
		['open', 'It has opened'],
	] as const)('announces %s as "%s"', (stage, words) => {
		expect(announcementFor(stage)).toBe(words)
	})

	it('reads the inscription aloud once the slab has risen', () => {
		expect(announcementFor('risen')).toBe(
			'Words are carved into it. This is not a button of honor. No glorious deeds are celebrated here.',
		)
	})

	it('carves the inscription on two lines', () => {
		expect(INSCRIPTION).toBe('THIS IS NOT A BUTTON OF HONOR\nNO GLORIOUS DEEDS ARE CELEBRATED HERE')
	})
})
