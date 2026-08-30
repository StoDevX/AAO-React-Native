import {act} from '@testing-library/react-native'

import {selectShowChangeFiltersMessage, useFilterStore} from '../store'
import type {FilterState} from '../store'

describe('selectShowChangeFiltersMessage', () => {
	const state = (selectedSports: string[], availableSports: string[]): FilterState =>
		({selectedSports, availableSports}) as FilterState

	it('is false when nothing is selected', () => {
		expect(selectShowChangeFiltersMessage(state([], ['Baseball', 'Volleyball']))).toBe(false)
	})

	it('is false when every available sport is selected', () => {
		expect(
			selectShowChangeFiltersMessage(state(['Baseball', 'Volleyball'], ['Baseball', 'Volleyball'])),
		).toBe(false)
	})

	it('is true when some available sport is excluded from the selection', () => {
		expect(selectShowChangeFiltersMessage(state(['Baseball'], ['Baseball', 'Volleyball']))).toBe(
			true,
		)
	})
})

describe('useFilterStore', () => {
	beforeEach(() => {
		useFilterStore.setState({selectedSports: [], availableSports: []})
	})

	it('adds a sport with toggleSport', async () => {
		await act(() => {
			useFilterStore.getState().toggleSport('Baseball')
		})

		expect(useFilterStore.getState().selectedSports).toEqual(['Baseball'])
	})

	it('removes an already-selected sport with toggleSport', async () => {
		await act(() => {
			useFilterStore.getState().toggleSport('Baseball')
			useFilterStore.getState().toggleSport('Volleyball')
			useFilterStore.getState().toggleSport('Baseball')
		})

		expect(useFilterStore.getState().selectedSports).toEqual(['Volleyball'])
	})

	it('is a no-op when setAvailableSports is called with an unchanged list', async () => {
		await act(() => {
			useFilterStore.getState().setAvailableSports(['Baseball', 'Volleyball'])
		})
		const stateAfterFirstSet = useFilterStore.getState()

		await act(() => {
			// A fresh array with the same contents, as the effect in Athletics.tsx
			// builds on every render.
			useFilterStore.getState().setAvailableSports(['Baseball', 'Volleyball'])
		})

		expect(useFilterStore.getState()).toBe(stateAfterFirstSet)
	})

	it('produces a new state when setAvailableSports is called with a changed list', async () => {
		await act(() => {
			useFilterStore.getState().setAvailableSports(['Baseball'])
		})
		const stateAfterFirstSet = useFilterStore.getState()

		await act(() => {
			useFilterStore.getState().setAvailableSports(['Baseball', 'Volleyball'])
		})

		expect(useFilterStore.getState()).not.toBe(stateAfterFirstSet)
		expect(useFilterStore.getState().availableSports).toEqual(['Baseball', 'Volleyball'])
	})
})
