import * as React from 'react'
import {AppState, StyleSheet, Text, View} from 'react-native'
import {secretLockoutEnded} from '@frogpond/launch-arguments'
import {
	addShakeEscapeListener,
	coverForRewind,
	rewind,
	startShakeWatch,
	stopShakeWatch,
} from '@frogpond/something-secret'
import {now} from '@frogpond/timer'

import {useBurialClock} from './activity'
import {ANGERED, RESTING} from './copy'
import {clampLockedUntil, isLockedOut} from './lockout'
import {useSecretStore} from './store'

export const RESTING_TEST_ID = 'something-secret-resting'

/** How long "you've angered it" shows before the app comes back. */
const ANGERED_MS = 2000

const styles = StyleSheet.create({
	screen: {
		...StyleSheet.absoluteFill,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#050505',
	},
	words: {
		color: '#5a5a5a',
		fontSize: 17,
	},
})

/** Reads the app's clock each second and whenever the app comes back to the foreground. */
function useClock(): number {
	let [clock, setClock] = React.useState(() => now().valueOf())
	React.useEffect(() => {
		let id = setInterval(() => setClock(now().valueOf()), 1000)
		let subscription = AppState.addEventListener('change', (status) => {
			if (status === 'active') {
				setClock(now().valueOf())
			}
		})
		return () => {
			clearInterval(id)
			subscription.remove()
		}
	}, [])
	return clock
}

/**
 * Seeds a lockout that has already run out, once the stored state has loaded, for a UI test
 * (whose clock is frozen) to watch a lockout end: --secret-lockout-ended.
 */
function useSeededLockout(): void {
	React.useEffect(() => {
		if (!secretLockoutEnded) {
			return
		}
		let seed = () => useSecretStore.setState({pressCount: 1, lockedUntil: now().valueOf() - 1})
		if (useSecretStore.persist.hasHydrated()) {
			seed()
			return
		}
		return useSecretStore.persist.onFinishHydration(seed)
	}, [])
}

/** Ends a lockout: the app pours back up out of black, with the slab's space buried. */
async function endLockout(unlock: () => void, bury: () => void): Promise<void> {
	// The cover goes up before the dead screen comes down, so the app never shows between them.
	await coverForRewind()
	unlock()
	// Buried before the rewind, so the app it pours back already lacks the space.
	bury()
	await rewind()
}

/** Lays the dead screen over the whole app while the red button's lockout lasts. */
export function LockoutGate(): React.ReactNode {
	let lockedUntil = useSecretStore((state) => state.lockedUntil)
	let unlock = useSecretStore((state) => state.unlock)
	let bury = useSecretStore((state) => state.bury)
	let clock = useClock()
	useBurialClock()
	useSeededLockout()

	// A lockout further off than any lockout lasts means the clock moved back. The dead screen
	// never showed for it, so there is nothing to rewind: let them in, and bury the slab.
	let honored = clampLockedUntil(lockedUntil, clock)
	let clockMovedBack = lockedUntil !== null && honored === null
	React.useEffect(() => {
		if (clockMovedBack) {
			unlock()
			bury()
		}
	}, [clockMovedBack, unlock, bury])

	// Held while an ending runs, so the timer ticking on beneath the cover starts no second one.
	let ending = React.useRef(false)
	let end = React.useCallback(() => {
		if (ending.current) {
			return
		}
		ending.current = true
		void endLockout(unlock, bury).finally(() => {
			ending.current = false
		})
	}, [unlock, bury])

	let ranOut = honored !== null && !isLockedOut(honored, clock)
	React.useEffect(() => {
		if (ranOut) {
			end()
		}
	}, [ranOut, end])

	if (honored === null) {
		return null
	}
	return <LockoutScreen onEscape={end} />
}

function LockoutScreen({onEscape}: {onEscape: () => void}): React.ReactNode {
	let [angered, setAngered] = React.useState(false)

	React.useEffect(() => {
		let subscription = addShakeEscapeListener(() => setAngered(true))
		startShakeWatch()
		return () => {
			subscription.remove()
			stopShakeWatch()
		}
	}, [])

	React.useEffect(() => {
		if (!angered) {
			return
		}
		let id = setTimeout(onEscape, ANGERED_MS)
		return () => clearTimeout(id)
	}, [angered, onEscape])

	return (
		<View accessibilityViewIsModal={true} style={styles.screen} testID={RESTING_TEST_ID}>
			<Text accessibilityRole="text" style={styles.words}>
				{angered ? ANGERED : RESTING}
			</Text>
		</View>
	)
}
