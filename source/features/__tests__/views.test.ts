import {AllViews} from '../views'

describe('AllViews', () => {
	test('ends the tiles a student sees with Student Work', () => {
		let shipping = AllViews().filter((view) => !view.devOnly && !view.disabled)
		let last = shipping.at(-1)
		expect(last?.title).toBe('Student Work')
		expect(last?.type === 'view' ? last.view : undefined).toBe('/StudentWork')
	})
})
