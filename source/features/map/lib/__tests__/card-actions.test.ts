import {cardActions, MAX_CARD_ACTIONS} from '../card-actions'

describe('cardActions', () => {
	it('offers Directions to a building with a point, once walking directions exist', () => {
		expect(cardActions({point: [-93.1839, 44.4618], walkingDirections: true})).toEqual([
			{kind: 'directions', url: 'https://maps.apple.com/?daddr=44.4618,-93.1839'},
		])
	})

	// Maps routes by car and transit; campus is walked.
	it('offers no Directions without walking directions', () => {
		expect(cardActions({point: [-93.1839, 44.4618], walkingDirections: false})).toEqual([])
	})

	it('offers no Directions without a point', () => {
		expect(cardActions({point: null, walkingDirections: true})).toEqual([])
	})

	it('never offers more than the row holds', () => {
		expect(cardActions({point: [0, 0], walkingDirections: true}).length).toBeLessThanOrEqual(
			MAX_CARD_ACTIONS,
		)
	})
})
