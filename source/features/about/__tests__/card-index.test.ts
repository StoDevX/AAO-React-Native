import {describe, expect, it} from '@jest/globals'
import {cardIndex} from '../card-index'

const CARDS = [{id: 'now'}, {id: 'then'}, {id: 'before'}]

describe('cardIndex', () => {
	it('finds the card scrolled to', () => {
		expect(cardIndex(CARDS, 'then')).toBe(1)
	})

	it('reads no position yet as the first card', () => {
		expect(cardIndex(CARDS, null)).toBe(0)
	})

	it('reads an id no card has as the first card', () => {
		expect(cardIndex(CARDS, 'gone')).toBe(0)
	})
})
