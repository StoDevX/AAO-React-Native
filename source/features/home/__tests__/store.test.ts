import {act} from '@testing-library/react-native'

import {useHomeLayoutStore} from '../store'

describe('useHomeLayoutStore', () => {
	beforeEach(() => {
		useHomeLayoutStore.setState({layout: 'grouped'})
	})

	it('starts with the tiles grouped', () => {
		expect(useHomeLayoutStore.getState().layout).toBe('grouped')
	})

	it('switches to tiled and back', async () => {
		await act(() => {
			useHomeLayoutStore.getState().setLayout('tiled')
		})
		expect(useHomeLayoutStore.getState().layout).toBe('tiled')

		await act(() => {
			useHomeLayoutStore.getState().setLayout('grouped')
		})
		expect(useHomeLayoutStore.getState().layout).toBe('grouped')
	})
})
