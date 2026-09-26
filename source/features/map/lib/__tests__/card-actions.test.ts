import {cardActions, MAX_CARD_ACTIONS} from '../card-actions'

describe('cardActions', () => {
	it('offers Directions to a building with a point', () => {
		expect(cardActions({point: [-93.1839, 44.4618]})).toEqual([
			{kind: 'directions', url: 'https://maps.apple.com/?daddr=44.4618,-93.1839'},
		])
	})

	it('offers nothing without a point', () => {
		expect(cardActions({point: null})).toEqual([])
	})

	it('never offers more than the row holds', () => {
		expect(cardActions({point: [0, 0]}).length).toBeLessThanOrEqual(MAX_CARD_ACTIONS)
	})
})
