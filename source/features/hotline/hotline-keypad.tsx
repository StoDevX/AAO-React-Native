import * as React from 'react'
import {Pressable, StyleSheet, Text, View} from 'react-native'
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

import {useCampusSection, useCampusStore} from '../campus/store'
import {useRadioStore} from '../streaming/radio'
import {
	answer,
	cannotComplete,
	extensionOf,
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
import {prepareVoice, silence, speak} from './voice'

/** One full ring: two seconds on and four off, before the hotline picks up. */
const RING_MS = 6_000

/**
 * The most the screen waits on the call-ended beeps, which take a second and a
 * half, so beeps that never report finishing cannot hold the call screen open.
 */
const CALL_ENDED_MS = 2_000

/** Longer than any number worth dialing; the display stops there. */
const MAX_DIGITS = 15

type Phase = 'dialing' | 'ringing' | 'connected' | 'ended'

/** `seconds` as a call timer reads it: `0:07`, `12:34`. */
function callDuration(seconds: number): string {
	return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

/**
 * Home's Phone layout: a keypad that dials 411 into the hotline, a spoken
 * phone tree of dining specials and building hours.
 */
export function HotlineKeypad(): React.ReactNode {
	let campus = useCampusStore((state) => state.campus)
	let {appName} = useCampusSection('branding')

	let [phase, setPhase] = React.useState<Phase>('dialing')
	// The keypad waits with the hotline's number dialed, ready to call.
	let [dialed, setDialed] = React.useState(HOTLINE_NUMBER)
	let [pressed, setPressed] = React.useState('')
	// Counted up from the moment the call connects, which the clock is reset to.
	let [callSeconds, setCallSeconds] = React.useState(0)
	React.useEffect(() => {
		if (phase !== 'connected') return
		let id = setInterval(() => setCallSeconds((seconds) => seconds + 1), 1000)
		return () => clearInterval(id)
	}, [phase])

	// Each call gets a number; anything a call left running checks it is still
	// the current one before it speaks, waits or hangs up.
	let callId = React.useRef(0)
	let callState = React.useRef<CallState | null>(null)
	let idleTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

	let clearIdle = React.useCallback(() => {
		if (idleTimer.current) clearTimeout(idleTimer.current)
		idleTimer.current = null
	}, [])

	/** Stops the call where it is: the voice, the tones, and anything it was waiting to do. */
	let stopCall = React.useCallback(() => {
		callId.current += 1
		callState.current = null
		clearIdle()
		silence()
		stopTones()
	}, [clearIdle])

	/** Ends the call: silences it, and goes back to the keypad, after the beeps when `withTone`. */
	let hangUp = React.useCallback(
		async (withTone: boolean) => {
			stopCall()
			if (withTone) {
				// The call is over the moment it is hung up: the timer stops while the beeps play.
				setPhase('ended')
				await Promise.race([
					playCallEnded(),
					new Promise((resolve) => setTimeout(resolve, CALL_ENDED_MS)),
				])
			}
			setPhase('dialing')
			setDialed(HOTLINE_NUMBER)
			setPressed('')
		},
		[stopCall],
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
		// Calling with nothing dialed calls the hotline, as its number is the default.
		let number = dialed || HOTLINE_NUMBER
		setDialed(number)
		callId.current += 1
		let id = callId.current
		useRadioStore.getState().pause()

		let extension = extensionOf(number)
		if (extension === null) {
			await prepareVoice()
			if (id !== callId.current) return
			setCallSeconds(0)
			setPhase('connected')
			void run(notInService(), id)
			return
		}

		setPhase('ringing')
		startRingback()
		let [directory] = await Promise.all([
			campus ? loadDirectory(campus, now().tz(timezone())) : null,
			prepareVoice(),
			new Promise((resolve) => setTimeout(resolve, RING_MS)),
		])
		if (id !== callId.current) return
		stopRingback()
		setCallSeconds(0)
		setPhase('connected')
		void run(directory ? answer(directory, appName, extension) : cannotComplete(), id)
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

	// The call carries on behind a sheet, another screen or another app, as a
	// phone call does, with the app's background audio. Only leaving the Phone
	// layout, which unmounts the keypad, ends it.
	React.useEffect(() => stopCall, [stopCall])

	let onCall = phase !== 'dialing'
	// The number, as the Phone app shows one with no contact: the app's name is
	// already above it, and the hotline says it on answering.
	let title = dialed

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
							{phase === 'ringing'
								? 'calling…'
								: phase === 'ended'
									? 'Call ended'
									: callDuration(callSeconds)}
						</Text>
						<Text numberOfLines={1} style={styles.pressed}>
							{pressed}
						</Text>
					</>
				) : (
					<Text
						adjustsFontSizeToFit={true}
						numberOfLines={1}
						style={styles.number}
						testID="hotline-dialed"
					>
						{dialed}
					</Text>
				)}
			</View>
			<Keypad onPress={onKey} />
			<View style={styles.actions}>
				<View style={styles.actionSlot} />
				<CallButton
					ending={onCall}
					onPress={
						phase === 'ended'
							? undefined
							: onCall
								? () => void hangUp(true)
								: () => void placeCall()
					}
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
