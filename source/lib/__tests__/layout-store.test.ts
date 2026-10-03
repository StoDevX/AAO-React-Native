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
})
