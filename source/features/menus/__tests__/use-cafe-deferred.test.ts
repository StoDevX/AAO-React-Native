import {describe, expect, jest, test} from '@jest/globals'
import {renderHook} from '@testing-library/react-native'

import {useHomeLayoutStore} from '../../home/store'
import {useCafeDeferred} from '../use-cafe-deferred'

let mockIsFocused = false

jest.mock('expo-router', () => ({useIsFocused: () => mockIsFocused}))

describe('useCafeDeferred', () => {
	test('defers a tab that has never been focused when home is tiled', async () => {
		useHomeLayoutStore.setState({layout: 'tiled'})
		mockIsFocused = false
		let {result} = await renderHook(() => useCafeDeferred())

		expect(result.current).toBe(true)
	})

	test('stops deferring a tab once it is focused', async () => {
		useHomeLayoutStore.setState({layout: 'tiled'})
		mockIsFocused = true
		let {result} = await renderHook(() => useCafeDeferred())

		expect(result.current).toBe(false)
	})

	// Without tabs only one cafe is ever mounted, and it is the one in front.
	test.each(['grouped', 'list'] as const)('never defers when home is %s', async (layout) => {
		useHomeLayoutStore.setState({layout})
		mockIsFocused = false
		let {result} = await renderHook(() => useCafeDeferred())

		expect(result.current).toBe(false)
	})
})
