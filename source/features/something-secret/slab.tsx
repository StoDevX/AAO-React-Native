import * as React from 'react'
import {AccessibilityInfo} from 'react-native'
import {secretProgress} from '@frogpond/launch-arguments'
import {melt, roar, SlabView} from '@frogpond/something-secret'
import {now} from '@frogpond/timer'

import {announcementFor, BUTTON_LABEL, INSCRIPTION, SLAB_HINT, SLAB_LABEL} from './copy'
import {decay, OPEN_AT, shouldRoar, STAGE_ORDER, stageFor, tap} from './progress'
import {useSecretStore} from './store'

export const SLAB_TEST_ID = 'something-secret'
export const BUTTON_TEST_ID = 'something-secret-button'

/** How often a sinking slab redraws. */
const TICK_MS = 250

/** The progress at the last tap, and when it was; decay counts from here. */
type Anchor = {progress: number; at: number}

function anchorAt(progress: number): Anchor {
	return {progress, at: now().valueOf()}
}

type Props = {
	/** Leaving the home screen buries the slab again. */
	isFocused: boolean
}

/** The space under the home screen's notice, where the slab is raised by tapping. */
export function SecretSlab({isFocused}: Props): React.ReactNode {
	let [anchor, setAnchor] = React.useState<Anchor>(() => anchorAt(secretProgress))
	let [clock, setClock] = React.useState(() => now().valueOf())
	let [tapCount, setTapCount] = React.useState(0)
	// One press per opening: a second tap during the melt would lengthen the lockout. A slab tap
	// means a fresh climb, so it clears this.
	let pressed = React.useRef(false)
	let press = useSecretStore((state) => state.press)
	let buried = useSecretStore((state) => state.buried)

	let progress = decay(anchor.progress, (clock - anchor.at) / 1000)
	let {stage, fraction} = stageFor(progress)
	let isSettled = progress === 0 || progress >= OPEN_AT

	// Only a slab partway up can sink, so only then does the clock need reading.
	React.useEffect(() => {
		if (isSettled) {
			return
		}
		let id = setInterval(() => setClock(now().valueOf()), TICK_MS)
		return () => clearInterval(id)
	}, [isSettled])

	// Buried as the home screen loses focus; adjusted during render, as React advises for state
	// that follows a prop, rather than an effect that would draw the old slab once more first.
	let [wasFocused, setWasFocused] = React.useState(isFocused)
	if (isFocused !== wasFocused) {
		setWasFocused(isFocused)
		if (!isFocused) {
			setAnchor(anchorAt(0))
			setTapCount(0)
		}
	}

	// Announced only on the way up: "Something stirs" as it sinks would be wrong.
	let lastStage = React.useRef(stage)
	React.useEffect(() => {
		let rose = STAGE_ORDER.indexOf(stage) > STAGE_ORDER.indexOf(lastStage.current)
		lastStage.current = stage
		let words = announcementFor(stage)
		if (rose && words) {
			AccessibilityInfo.announceForAccessibility(words)
		}
	}, [stage])

	let onSlabTap = () => {
		let at = now().valueOf()
		let current = decay(anchor.progress, (at - anchor.at) / 1000)
		if (current >= OPEN_AT) {
			return
		}
		pressed.current = false
		let next = tap(current)
		setAnchor({progress: next, at})
		setClock(at)
		setTapCount((count) => count + 1)
		if (shouldRoar(next, Math.random())) {
			roar()
		}
	}

	let onButtonPress = () => {
		if (pressed.current) {
			return
		}
		pressed.current = true
		// Locked before the melt starts, so quitting mid-melt still lands in the lockout.
		press(now().valueOf())
		void melt()
	}

	if (buried) {
		return null
	}

	return (
		<SlabView
			buttonLabel={BUTTON_LABEL}
			buttonTestID={BUTTON_TEST_ID}
			fraction={fraction}
			hint={SLAB_HINT}
			inscription={INSCRIPTION}
			label={SLAB_LABEL}
			onButtonPress={onButtonPress}
			onSlabTap={onSlabTap}
			stage={stage}
			tapCount={tapCount}
			testID={SLAB_TEST_ID}
		/>
	)
}
