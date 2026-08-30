import {renderHook, waitFor} from '@testing-library/react-native'
import {describe, expect, jest, test} from '@jest/globals'

jest.mock('expo-asset', () => ({
	Asset: {
		fromURI: (uri: string) => ({
			downloadAsync: () => {
				if (uri.includes('broken')) {
					throw new Error('404')
				}
				return {localUri: `file:///cache/${uri.split('/').pop()}`}
			},
		}),
	},
}))

import {useLocalCorIcons} from '../use-local-cor-icons'

const icons = {
	vegan: {sort: '1', label: 'Vegan', description: '', image: 'https://x/vegan.png'},
	halal: {sort: '2', label: 'Halal', description: '', image: 'https://x/broken.png'},
	none: {sort: '3', label: 'Unknown', description: '', image: ''},
}

describe('useLocalCorIcons', () => {
	test('maps each downloadable icon to its local path', async () => {
		let {result} = await renderHook(() => useLocalCorIcons(icons))
		await waitFor(() => expect(result.current.vegan).toBe('file:///cache/vegan.png'))
	})

	test('omits an icon that fails to download rather than failing the menu', async () => {
		let {result} = await renderHook(() => useLocalCorIcons(icons))
		await waitFor(() => expect(result.current.vegan).toBeDefined())
		expect(result.current.halal).toBeUndefined()
	})

	test('omits an icon with no image url', async () => {
		let {result} = await renderHook(() => useLocalCorIcons(icons))
		await waitFor(() => expect(result.current.vegan).toBeDefined())
		expect(result.current.none).toBeUndefined()
	})
})
