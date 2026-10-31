import {describe, expect, test} from '@jest/globals'

import {
	answer,
	cannotComplete,
	idle,
	menuPrompt,
	notInService,
	press,
	type CallState,
	type Key,
} from '../call'
import type {HotlineMenu} from '../directory'

const menuOf = (title: string, count: number): HotlineMenu => ({
	title,
	options: Array.from({length: count}, (_, i) => ({
		label: `${title} ${i + 1}`,
		target: {answer: `${title} ${i + 1} is open today.`},
	})),
})

const ten = menuOf('Office', 10)
const nine = menuOf('Hall', 9)

const root: HotlineMenu = {
	title: 'Main menu',
	options: [
		{label: 'the dining hall specials', target: nine},
		{label: 'building hours', target: ten},
		{label: 'everything open right now', target: {answer: 'Nothing is open right now.'}},
	],
}

const ROOT_PROMPT =
	'For the dining hall specials, press 1. For building hours, press 2. ' +
	'For everything open right now, press 3.'

/** Presses `keys` in turn from the answered call. */
function pressAll(...keys: Key[]) {
	let step = answer(root, 'All About Olaf')
	for (let key of keys) {
		step = press(step.state, key)
	}
	return step
}

const depth = (state: CallState) => state.stack.length

describe('answer', () => {
	test('greets the caller, then offers the main menu', () => {
		let step = answer(root, 'All About Olaf')
		expect(step.say).toBe(`Thank you for calling the All About Olaf Hotline. ${ROOT_PROMPT}`)
		expect(step.next).toBe('listen')
	})
})

describe('menuPrompt', () => {
	test('pages a long menu eight at a time, with 9 for more', () => {
		expect(menuPrompt(ten, 0)).toBe(
			Array.from({length: 8}, (_, i) => `For Office ${i + 1}, press ${i + 1}.`).join(' ') +
				' For more options, press 9.',
		)
		expect(menuPrompt(ten, 1)).toBe('For Office 9, press 1. For Office 10, press 2.')
	})

	test('gives a menu of exactly nine all nine keys', () => {
		expect(menuPrompt(nine, 0)).toBe(
			Array.from({length: 9}, (_, i) => `For Hall ${i + 1}, press ${i + 1}.`).join(' '),
		)
	})
})

describe('press', () => {
	test('opens a submenu', () => {
		let step = pressAll('2')
		expect(depth(step.state)).toBe(2)
		expect(step.say).toBe(menuPrompt(ten, 0))
	})

	test('reads an answer, then offers the same menu again', () => {
		let step = pressAll('3')
		expect(step.say).toBe(`Nothing is open right now. ${ROOT_PROMPT}`)
		expect(depth(step.state)).toBe(1)
		expect(step.next).toBe('listen')
	})

	test('9 selects the ninth item of a menu of nine', () => {
		expect(pressAll('1', '9').say).toBe(`Hall 9 is open today. ${menuPrompt(nine, 0)}`)
	})

	test('9 turns the page, and keys then name that page', () => {
		expect(pressAll('2', '9').say).toBe(menuPrompt(ten, 1))
		expect(pressAll('2', '9', '2').say).toBe(`Office 10 is open today. ${menuPrompt(ten, 1)}`)
	})

	test('star goes back a level, from any page', () => {
		let step = pressAll('2', '9', '*')
		expect(depth(step.state)).toBe(1)
		expect(step.say).toBe(ROOT_PROMPT)
	})

	test('star at the main menu repeats it', () => {
		expect(pressAll('*').say).toBe(ROOT_PROMPT)
	})

	test('0 repeats the current page', () => {
		expect(pressAll('2', '9', '0').say).toBe(menuPrompt(ten, 1))
	})

	test('a key that names no option says so, then repeats the menu', () => {
		let invalid = `Sorry, that is not a valid option. ${ROOT_PROMPT}`
		expect(pressAll('5').say).toBe(invalid)
		expect(pressAll('#').say).toBe(invalid)
		expect(pressAll('2', '9', '3').say).toBe(
			`Sorry, that is not a valid option. ${menuPrompt(ten, 1)}`,
		)
	})

	test('any key resets the idle count', () => {
		let waited = idle(answer(root, 'All About Olaf').state)
		expect(press(waited.state, '0').state.idlePrompts).toBe(0)
	})
})

describe('idle', () => {
	test('repeats the menu once, then says goodbye and hangs up', () => {
		let first = idle(answer(root, 'All About Olaf').state)
		expect(first).toMatchObject({say: ROOT_PROMPT, next: 'listen'})
		expect(first.state.idlePrompts).toBe(1)

		let second = idle(first.state)
		expect(second).toMatchObject({
			say: "We didn't receive a selection. Goodbye.",
			next: 'hang-up',
		})
	})
})

test('notInService hangs up', () => {
	expect(notInService()).toMatchObject({
		say: 'The number you have dialed is not in service.',
		next: 'hang-up',
	})
})

test('cannotComplete apologises and hangs up', () => {
	expect(cannotComplete()).toMatchObject({
		say: "We're unable to complete your call at this time. Please try again later.",
		next: 'hang-up',
	})
})
