import {act} from '@testing-library/react-native'

import {useHomeLayoutStore} from '../store'

describe('useHomeLayoutStore', () => {
	beforeEach(() => {
		useHomeLayoutStore.setState({layout: 'tiled'})
	})

	it('starts with the tiles of today', () => {
		expect(useHomeLayoutStore.getState().layout).toBe('tiled')
	})

	it('switches to grouped and back', async () => {
		await act(() => {
			useHomeLayoutStore.getState().setLayout('grouped')
		})
		expect(useHomeLayoutStore.getState().layout).toBe('grouped')

		await act(() => {
			useHomeLayoutStore.getState().setLayout('tiled')
		})
		expect(useHomeLayoutStore.getState().layout).toBe('tiled')
	})
})
