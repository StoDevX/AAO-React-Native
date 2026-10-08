import * as React from 'react'
import {Restart} from 'react-native-restart-newarch'
import {addResetListener, finishReset, isUITesting} from '@frogpond/launch-arguments'
import type {ResetRequest} from '@frogpond/launch-arguments'

import {clearStoredData} from './clear-stored-data'
import {probe} from './probe'

/**
 * Resets the app in place when the UI test runner asks, standing in for the
 * cold launch with `--reset-state` that would otherwise start each test.
 * Returns true from the request on, and the root renders nothing then: every
 * screen unmounts, and its effects finish writing, before the storage is
 * cleared, so nothing a screen does on its way out survives the reset.
 *
 * Once the storage is clear, native code clears UserDefaults and answers the
 * runner, and the JavaScript reloads, opening the route the runner asked for
 * (see `+native-intent.ts`).
 */
export function useUITestReset(): boolean {
	let [request, setRequest] = React.useState<ResetRequest | null>(null)

	React.useEffect(() => (isUITesting ? addResetListener(setRequest) : undefined), [])

	React.useEffect(() => {
		if (request === null) {
			return
		}
		void (async () => {
			probe(`reset asked for ${request.url}`)
			await clearStoredData()
			probe('reset cleared stored data')
			await finishReset(request)
			probe('reset answered; restarting')
			Restart()
		})()
	}, [request])

	return request !== null
}
