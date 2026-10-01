import * as React from 'react'
import {AppState, StyleSheet, Text, View} from 'react-native'
import {addShakeEscapeListener, startShakeWatch, stopShakeWatch} from '@frogpond/something-secret'
import {now} from '@frogpond/timer'

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

/** Lays the dead screen over the whole app while the red button's lockout lasts. */
export function LockoutGate(): React.ReactNode {
	let lockedUntil = useSecretStore((state) => state.lockedUntil)
	let unlock = useSecretStore((state) => state.unlock)
	let clock = useClock()

	// A lockout further off than any lockout lasts means the clock moved back; let them in.
	let honored = clampLockedUntil(lockedUntil, clock)
	React.useEffect(() => {
		if (lockedUntil !== null && honored === null) {
			unlock()
		}
	}, [lockedUntil, honored, unlock])

	if (!isLockedOut(honored, clock)) {
		return null
	}
	return <LockoutScreen onEscape={unlock} />
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
