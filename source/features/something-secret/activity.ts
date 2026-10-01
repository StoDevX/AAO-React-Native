import * as React from 'react'
import {AppState} from 'react-native'
import {now} from '@frogpond/timer'

import {useSecretStore} from './store'

/**
 * Keeps the store's record of when the app was last in use: woken at launch and on each return to
 * the foreground, so a long enough absence digs a buried slab back up, and noted on each departure,
 * so time spent in the app never counts as rest.
 */
export function useBurialClock(): void {
	React.useEffect(() => {
		let {wake, noteActive} = useSecretStore.getState()
		// Woken only once the stored record has loaded; waking before would be overwritten by it.
		let unsubscribe: () => void = () => undefined
		if (useSecretStore.persist.hasHydrated()) {
			wake(now().valueOf())
		} else {
			unsubscribe = useSecretStore.persist.onFinishHydration(() => wake(now().valueOf()))
		}
		let subscription = AppState.addEventListener('change', (status) => {
			if (status === 'active') {
				wake(now().valueOf())
			} else {
				noteActive(now().valueOf())
			}
		})
		return () => {
			unsubscribe()
			subscription.remove()
		}
	}, [])
}
