import {act} from '@testing-library/react-native'

import {createLayoutStore} from '../layout-store'

describe('createLayoutStore', () => {
	test('starts at the layout the screen names as its default', () => {
		let useStore = createLayoutStore('test-layout-list', 'list')
		expect(useStore.getState().layout).toBe('list')
	})

	test('remembers the layout picked from the menu', async () => {
		let useStore = createLayoutStore('test-layout-grid', 'grid')
		await act(() => {
			useStore.getState().setLayout('list')
		})
		expect(useStore.getState().layout).toBe('list')
	})

	test('takes any set of layouts, not only grid and list', async () => {
		let useStore = createLayoutStore<'tiled' | 'grouped' | 'list'>('test-layout-three', 'tiled')
		await act(() => {
			useStore.getState().setLayout('grouped')
		})
		expect(useStore.getState().layout).toBe('grouped')
	})

	// A screen drawn before the saved choice has loaded draws the default and
	// then jumps to the choice, so it waits for this.
	test('is not hydrated until the saved layout has loaded', async () => {
		let useStore = createLayoutStore('test-layout-hydrated', 'list')
		expect(useStore.getState().hydrated).toBe(false)

		await act(async () => {
			await useStore.persist.rehydrate()
		})
		expect(useStore.getState().hydrated).toBe(true)
	})
})
