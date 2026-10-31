import * as React from 'react'
import {AppState, Pressable, StyleSheet, Text, View} from 'react-native'
import * as c from '@frogpond/colors'
import {timezone} from '@frogpond/constants'
import {
	playCallEnded,
	playKeyTone,
	startRingback,
	stopRingback,
	stopTones,
} from '@frogpond/telephone-tones'
import {now} from '@frogpond/timer'
import {SymbolView} from 'expo-symbols'
import {useFocusEffect} from 'expo-router'

import {useCampusSection, useCampusStore} from '../campus/store'
import {useRadioStore} from '../streaming/radio'
import {
	answer,
	cannotComplete,
	HOTLINE_NUMBER,
	idle,
	IDLE_MS,
	notInService,
	press,
	type CallState,
	type Key,
	type Step,
} from './call'
import {CallButton, Keypad} from './keypad'
import {loadDirectory} from './load'
import {silence, speak} from './voice'

/** One full ring: two seconds on and four off, before the hotline picks up. */
const RING_MS = 6_000

/** Longer than any number worth dialing; the display stops there. */
const MAX_DIGITS = 15

type Phase = 'dialing' | 'ringing' | 'connected'

/** `ms` as a call timer reads it: `0:07`, `12:34`. */
function callDuration(ms: number): string {
	let seconds = Math.floor(ms / 1000)
	return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

/** Re-renders each second while `active`, for the call timer. */
function useTicking(active: boolean): number {
	let [tick, setTick] = React.useState(() => Date.now())
	React.useEffect(() => {
		if (!active) return
		let id = setInterval(() => setTick(Date.now()), 1000)
		return () => clearInterval(id)
	}, [active])
	return tick
}

/**
 * Home's Phone layout: a keypad that dials 411 into the hotline, a spoken
 * phone tree of dining specials and building hours.
 */
export function HotlineKeypad(): React.ReactNode {
	let campus = useCampusStore((state) => state.campus)
	let {appName} = useCampusSection('branding')

	let [phase, setPhase] = React.useState<Phase>('dialing')
	let [dialed, setDialed] = React.useState('')
	let [pressed, setPressed] = React.useState('')
	let [connectedAt, setConnectedAt] = React.useState(0)
	let tick = useTicking(phase === 'connected')

	// Each call gets a number; anything a call left running checks it is still
	// the current one before it speaks, waits or hangs up.
	let callId = React.useRef(0)
	let callState = React.useRef<CallState | null>(null)
	let idleTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

	let clearIdle = React.useCallback(() => {
		if (idleTimer.current) clearTimeout(idleTimer.current)
		idleTimer.current = null
	}, [])

	/** Ends the call: silences it, and goes back to the keypad, after the beeps when `withTone`. */
	let hangUp = React.useCallback(
		async (withTone: boolean) => {
			callId.current += 1
			callState.current = null
			clearIdle()
			silence()
			stopTones()
			if (withTone) {
				await playCallEnded()
			}
			setPhase('dialing')
			setDialed('')
			setPressed('')
		},
		[clearIdle],
	)

	/** Says what `step` says, then waits for a key or hangs up, as it asks. */
	let run = React.useCallback(
		async function runStep(step: Step, id: number): Promise<void> {
			callState.current = step.state
			clearIdle()
			let result = await speak(step.say)
			if (id !== callId.current || result === 'stopped') return
			if (step.next === 'hang-up') {
				await hangUp(true)
				return
			}
			idleTimer.current = setTimeout(() => {
				if (id === callId.current && callState.current) {
					void runStep(idle(callState.current), id)
				}
			}, IDLE_MS)
		},
		[clearIdle, hangUp],
	)

	let placeCall = React.useCallback(async () => {
		if (!dialed) return
		callId.current += 1
		let id = callId.current
		useRadioStore.getState().pause()

		if (dialed !== HOTLINE_NUMBER) {
			setConnectedAt(Date.now())
			setPhase('connected')
			void run(notInService(), id)
			return
		}

		setPhase('ringing')
		startRingback()
		let [directory] = await Promise.all([
			campus ? loadDirectory(campus, now().tz(timezone())) : null,
			new Promise((resolve) => setTimeout(resolve, RING_MS)),
		])
		if (id !== callId.current) return
		stopRingback()
		setConnectedAt(Date.now())
		setPhase('connected')
		void run(directory ? answer(directory, appName) : cannotComplete(), id)
	}, [appName, campus, dialed, run])

	let onKey = React.useCallback(
		(key: Key) => {
			playKeyTone(key)
			if (phase === 'dialing') {
				setDialed((number) => (number.length < MAX_DIGITS ? number + key : number))
				return
			}
			let state = callState.current
			if (phase !== 'connected' || !state || state.stack.length === 0) return
			setPressed((keys) => keys + key)
			silence()
			void run(press(state, key), callId.current)
		},
		[phase, run],
	)

	let onDelete = React.useCallback(() => setDialed((number) => number.slice(0, -1)), [])

	// Leaving home, or unmounting, ends the call quietly; so does leaving the app.
	useFocusEffect(
		React.useCallback(
			() => () => {
				void hangUp(false)
			},
			[hangUp],
		),
	)
	React.useEffect(() => {
		let subscription = AppState.addEventListener('change', (next) => {
			if (next !== 'active') void hangUp(false)
		})
		return () => subscription.remove()
	}, [hangUp])

	let onCall = phase !== 'dialing'
	let title = dialed === HOTLINE_NUMBER ? `${appName} Hotline` : dialed

	return (
		<View style={styles.screen} testID="hotline-keypad">
			<View style={styles.display}>
				{onCall ? (
					<>
						<Text
							accessibilityLabel={title}
							numberOfLines={2}
							style={styles.title}
							testID="hotline-call-title"
						>
							{title}
						</Text>
						<Text style={styles.status}>
							{phase === 'ringing' ? 'calling…' : callDuration(tick - connectedAt)}
						</Text>
						<Text numberOfLines={1} style={styles.pressed}>
							{pressed}
						</Text>
					</>
				) : (
					<Text adjustsFontSizeToFit={true} numberOfLines={1} style={styles.number}>
						{dialed}
					</Text>
				)}
			</View>
			<Keypad onPress={onKey} />
			<View style={styles.actions}>
				<View style={styles.actionSlot} />
				<CallButton
					ending={onCall}
					onPress={onCall ? () => void hangUp(true) : () => void placeCall()}
				/>
				<View style={styles.actionSlot}>
					{!onCall && dialed ? (
						<Pressable
							accessibilityLabel="Delete"
							accessibilityRole="button"
							hitSlop={12}
							onPress={onDelete}
						>
							<SymbolView name="delete.left.fill" size={28} tintColor={c.secondaryLabel} />
						</Pressable>
					) : null}
				</View>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 24,
		backgroundColor: c.systemBackground,
	},
	display: {
		height: 120,
		alignSelf: 'stretch',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 24,
		gap: 4,
	},
	number: {
		fontSize: 40,
		color: c.label,
	},
	title: {
		fontSize: 28,
		fontWeight: '600',
		textAlign: 'center',
		color: c.label,
	},
	status: {
		fontSize: 17,
		color: c.secondaryLabel,
		fontVariant: ['tabular-nums'],
	},
	pressed: {
		fontSize: 17,
		letterSpacing: 4,
		color: c.secondaryLabel,
	},
	actions: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 28,
	},
	actionSlot: {
		width: 78,
		alignItems: 'center',
	},
})
