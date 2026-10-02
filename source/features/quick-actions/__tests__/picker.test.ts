import {isPickable} from '../picker'

test('a picked destination can always be unpicked', () => {
	expect(isPickable('Transit', ['Stav Menu', 'Cage Menu', 'Olaf Messenger', 'Transit'])).toBe(true)
})

test('an unpicked destination can be picked while a slot is free', () => {
	expect(isPickable('Calendar', ['Stav Menu'])).toBe(true)
})

test('an unpicked destination cannot be picked once every slot is taken', () => {
	expect(isPickable('Calendar', ['Stav Menu', 'Cage Menu', 'Olaf Messenger', 'Transit'])).toBe(
		false,
	)
})
