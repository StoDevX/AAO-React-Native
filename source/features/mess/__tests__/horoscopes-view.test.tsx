import * as React from 'react'
import {beforeEach, describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'

import variety from './fixtures/variety-posts.json'
import {HoroscopesView} from '../horoscopes-view'
import {parseBlocks} from '../lib/blocks'
import {parseHoroscopes} from '../lib/horoscopes'
import {useMessStore} from '../store'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../testing/expo-ui-mock') as typeof import('../../../testing/expo-ui-mock')
})

const LAYOUT = parseHoroscopes(
	parseBlocks(variety.find((post) => post.id === 36518)?.content.rendered ?? ''),
)

const ROW_LABELS = [
	'Aries, March 21 to April 19',
	'Taurus, April 20 to May 20',
	'Gemini, May 21 to June 20',
	'Cancer, June 21 to July 22',
	'Leo, July 23 to August 22',
	'Virgo, August 23 to September 22',
	'Libra, September 23 to October 22',
	'Scorpio, October 23 to November 21',
	'Sagittarius, November 22 to December 21',
	'Capricorn, December 22 to January 19',
	'Aquarius, January 20 to February 18',
	'Pisces, February 19 to March 20',
]

const GLYPH_LABELS = ROW_LABELS.map((label) => label.split(',')[0] ?? '')

let scrollTo: jest.Mock<(target: string) => void>

beforeEach(() => {
	useMessStore.setState({lastSign: null})
	scrollTo = jest.fn()
})

function renderView() {
	if (LAYOUT.kind !== 'horoscopes') throw new Error('expected the fixture to parse as horoscopes')
	return render(<HoroscopesView layout={LAYOUT} scrollTo={scrollTo} />)
}

describe('HoroscopesView', () => {
	test('shows the intro', async () => {
		await renderView()
		expect(screen.getByText(/citrus fruit now/u)).toBeTruthy()
	})

	describe('with no sign remembered', () => {
		test('asks the reader to pick a sign from twelve rows in zodiac order', async () => {
			await renderView()

			expect(screen.getByText('Pick your sign')).toBeTruthy()
			let rows = screen
				.getAllByRole('button')
				.map((button) => button.props.accessibilityLabel as string)
			expect(rows).toStrictEqual(ROW_LABELS)
		})

		test('shows no chosen sign and no reading', async () => {
			await renderView()

			for (let label of GLYPH_LABELS) {
				expect(screen.queryByRole('button', {name: label})).toBeNull()
			}
			expect(screen.queryByText(/Blood orange/u)).toBeNull()
		})

		test('remembers and shows the sign the reader picks', async () => {
			await renderView()

			await fireEvent.press(screen.getByRole('button', {name: 'Leo, July 23 to August 22'}))

			expect(useMessStore.getState().lastSign).toBe('leo')
			expect(screen.getByText(/The citrus king/u)).toBeTruthy()
			expect(screen.queryByText('Pick your sign')).toBeNull()
			expect(scrollTo).toHaveBeenCalledWith('leo')
		})
	})

	describe('with Taurus remembered', () => {
		beforeEach(() => {
			useMessStore.setState({lastSign: 'taurus'})
		})

		test("shows Taurus's name, dates and reading, and no other reading", async () => {
			await renderView()

			expect(screen.getByText('Taurus')).toBeTruthy()
			expect(screen.getByText('Apr 20 – May 20')).toBeTruthy()
			expect(screen.getByText(/A classic lime/u)).toBeTruthy()
			expect(screen.queryByText(/Blood orange/u)).toBeNull()
			expect(screen.queryByText('Pick your sign')).toBeNull()
		})

		test('offers all twelve glyphs, with Taurus selected', async () => {
			await renderView()

			for (let label of GLYPH_LABELS) {
				expect(screen.getByRole('button', {name: label})).toBeTruthy()
			}
			expect(screen.getByRole('button', {name: 'Taurus', selected: true})).toBeTruthy()
			expect(screen.getAllByRole('button', {selected: true})).toHaveLength(1)
		})

		test('lists the other eleven signs as rows', async () => {
			await renderView()

			for (let label of ROW_LABELS) {
				if (label.startsWith('Taurus')) {
					expect(screen.queryByRole('button', {name: label})).toBeNull()
				} else {
					expect(screen.getByRole('button', {name: label})).toBeTruthy()
				}
			}
		})

		test('does not scroll when it opens', async () => {
			await renderView()
			expect(scrollTo).not.toHaveBeenCalled()
		})

		test('shows, remembers and scrolls to the sign whose row is pressed', async () => {
			await renderView()

			await fireEvent.press(screen.getByRole('button', {name: 'Gemini, May 21 to June 20'}))

			expect(useMessStore.getState().lastSign).toBe('gemini')
			expect(screen.getByText(/A pomelo/u)).toBeTruthy()
			expect(screen.queryByText(/A classic lime/u)).toBeNull()
			expect(screen.getByRole('button', {name: 'Gemini', selected: true})).toBeTruthy()
			expect(screen.getByRole('button', {name: 'Taurus, April 20 to May 20'})).toBeTruthy()
			expect(scrollTo).toHaveBeenCalledWith('gemini')
		})

		test('does nothing when the chosen glyph is pressed again', async () => {
			await renderView()
			let storeChanges = jest.fn()
			let unsubscribe = useMessStore.subscribe(storeChanges)

			await fireEvent.press(screen.getByRole('button', {name: 'Taurus'}))
			unsubscribe()

			expect(storeChanges).not.toHaveBeenCalled()
			expect(useMessStore.getState().lastSign).toBe('taurus')
			expect(scrollTo).not.toHaveBeenCalled()
		})

		test('shows, remembers and scrolls to the sign whose glyph is pressed', async () => {
			await renderView()

			await fireEvent.press(screen.getByRole('button', {name: 'Pisces'}))

			expect(useMessStore.getState().lastSign).toBe('pisces')
			expect(screen.getByRole('button', {name: 'Pisces', selected: true})).toBeTruthy()
			expect(scrollTo).toHaveBeenCalledWith('pisces')
		})
	})
})
