import AsyncStorage from '@react-native-async-storage/async-storage'

import type * as Redux from '../../redux'
import type * as Settings from '../../redux/parts/settings'
import type * as ClearStoredData from '../clear-stored-data'

// Before the store loads: redux-persist starts a five-second rehydration
// timeout as the store is created, which would keep Jest from exiting.
jest.useFakeTimers({advanceTimers: true})

// oxlint-disable-next-line typescript/no-require-imports
let {persistor, store}: typeof Redux = require('../../redux')
// oxlint-disable-next-line typescript/no-require-imports
let {setDevModeOverride}: typeof Settings = require('../../redux/parts/settings')
// oxlint-disable-next-line typescript/no-require-imports
let {clearStoredData}: typeof ClearStoredData = require('../clear-stored-data')

function waitForRehydration(): Promise<void> {
	return new Promise((resolve) => {
		if (persistor.getState().bootstrapped) {
			resolve()
			return
		}
		let unsubscribe = persistor.subscribe(() => {
			if (persistor.getState().bootstrapped) {
				unsubscribe()
				resolve()
			}
		})
	})
}

describe('clearStoredData', () => {
	beforeEach(async () => {
		await waitForRehydration()
	})

	afterAll(() => {
		jest.clearAllTimers()
		jest.useRealTimers()
	})

	it('leaves behind no setting changed just before it ran', async () => {
		// Redux-persist writes a change on a later tick. Written after the
		// clear, it would restore the setting the clear was meant to remove.
		store.dispatch(setDevModeOverride(true))

		await clearStoredData()
		await new Promise((resolve) => setTimeout(resolve, 50))

		expect(await AsyncStorage.getAllKeys()).toEqual([])
	})
})
