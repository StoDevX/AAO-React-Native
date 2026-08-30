import {renderHook, waitFor} from '@testing-library/react-native'
import {describe, expect, jest, test} from '@jest/globals'

jest.mock('expo-asset', () => ({
	Asset: {
		fromURI: (uri: string) => ({
			// The real `downloadAsync` returns a promise and rejects on failure;
			// resolving/rejecting synchronously here would let a hook that forgot
			// to `await` it pass anyway.
			downloadAsync: () =>
				uri.includes('broken')
					? Promise.reject(new Error('404'))
					: Promise.resolve({localUri: `file:///cache/${uri.split('/').pop()}`}),
		}),
	},
}))

import {useLocalCorIcons} from '../use-local-cor-icons'
import type {MasterCorIconMapType} from '../../types'

const icons: MasterCorIconMapType = {
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

	// A caller that builds its `corIcons` argument from a fallback object
	// literal (`data = {corIcons: {}, ...}`) hands down a fresh reference every
	// render even when nothing about the icons changed. Regression for the
	// menu-github.tsx infinite loop: render -> effect -> setState -> render.
	test('a new but equivalent corIcons object does not trigger a further update', async () => {
		let {result, rerender} = await renderHook(
			({corIcons}: {corIcons: MasterCorIconMapType}) => useLocalCorIcons(corIcons),
			{initialProps: {corIcons: icons}},
		)

		await waitFor(() => expect(result.current.vegan).toBe('file:///cache/vegan.png'))
		let settled = result.current

		// A different object, same entries -- what an inline default produces.
		await rerender({corIcons: {...icons}})

		// Give the effect's download promise a turn to resolve, if it were going
		// to produce a new object. It should not: the state's reference should
		// be unchanged, meaning React never re-rendered on account of it.
		await Promise.resolve()
		await Promise.resolve()

		expect(result.current).toBe(settled)
	})

	test('an empty corIcons does not trigger a state update at all', async () => {
		let renderCount = 0

		let {result} = await renderHook(() => {
			renderCount++
			return useLocalCorIcons({})
		})

		// Let any effect this hook scheduled run to completion.
		await Promise.resolve()
		await Promise.resolve()

		expect(result.current).toEqual({})
		expect(renderCount).toBe(1)
	})
})
