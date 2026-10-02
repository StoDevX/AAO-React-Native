import * as React from 'react'
import {useCallback, useEffect, useState} from 'react'
import {ScrollView, StyleSheet, Text, View, useWindowDimensions} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import * as c from '@frogpond/colors'
import {callPhone} from '../../../components/call-phone'
import {Row} from '@frogpond/layout'
import type {RadioPlayState} from './types'
import {theming, type RadioLogo} from './theme'
import type {Station} from './stations'
import {useRadioStore, useStationPlayback} from './store'
import {ActionButton, CallButton, ShowCalendarButton} from './buttons'
import {openUrl} from '@frogpond/open-url'
import {ScratchableLogo} from './scratchable-logo'
import {useSwipeBackHold} from './swipe-back-hold'
import {useNavigation, useRouter} from 'expo-router'

const ALLOW_INLINE_PLAYER = true

type PlayButtonProps = {
	state: RadioPlayState
	onPlay: () => unknown
	onStop: () => unknown
	onLink: () => unknown
	stationName: string
}

function PlayButton(props: PlayButtonProps): React.ReactNode {
	const {state, onPlay, onStop, onLink, stationName} = props

	if (!ALLOW_INLINE_PLAYER) {
		return (
			<ActionButton
				accessibilityLabel={`Open ${stationName} website`}
				accessibilityRole="link"
				icon="globe"
				onPress={onLink}
				text="Open"
			/>
		)
	}

	switch (state) {
		case 'starting':
			return <ActionButton icon="ellipsis" onPress={onStop} text="Starting" />

		case 'playing':
			return <ActionButton icon="stop" onPress={onStop} text="Stop" />

		default:
			return <ActionButton icon="play" onPress={onPlay} text="Listen" />
	}
}

type Props = {
	station: Station
}

/**
 * A station's screen. It controls the app-wide player in `RadioHost` rather
 * than holding one of its own, so the station plays on after the screen
 * closes.
 */
export function RadioControllerView({station}: Props): React.ReactNode {
	let {logos} = station
	// Always the first logo on arrival; a tap's choice lasts only while the
	// screen is open.
	let [logoIndex, setLogoIndex] = useState(0)
	let logo = logos[logoIndex]
	let showNextLogo =
		logos.length > 1 ? () => setLogoIndex((index) => (index + 1) % logos.length) : undefined

	return (
		<theming.ThemeProvider theme={logo.theme}>
			<RadioScreen logo={logo} onPressLogo={showNextLogo} station={station} />
		</theming.ThemeProvider>
	)
}

type RadioScreenProps = Props & {
	logo: RadioLogo
	onPressLogo?: () => void
}

function RadioScreen(props: RadioScreenProps): React.ReactNode {
	const theme = theming.useTheme()
	const {station, logo, onPressLogo} = props
	const {id, title, stationName, scheduleHref, stationNumber, playerUrl} = station

	let router = useRouter()

	let {playState, error: streamError} = useStationPlayback(id)
	let startStation = useRadioStore((state) => state.play)
	let stop = useRadioStore((state) => state.stop)
	let [logoHeld, setLogoHeld] = useState(false)

	// iOS 26 and later go back on a swipe from anywhere on the screen, which a
	// scratch would set off. The stack holding these tabs owns that gesture;
	// the left-edge swipe and the Back button still work.
	let navigation = useNavigation()
	let setSwipeBackEnabled = useCallback(
		(enabled: boolean) => navigation.getParent()?.setOptions({fullScreenGestureEnabled: enabled}),
		[navigation],
	)
	let swipeBack = useSwipeBackHold(setSwipeBackEnabled)
	let {hold: holdSwipeBack, settle: settleSwipeBack} = swipeBack

	// A new logo invites a scratch, so the swipe waits again.
	useEffect(() => {
		settleSwipeBack()
	}, [logo.name, settleSwipeBack])

	let handleLogoHeld = useCallback(
		(held: boolean) => {
			setLogoHeld(held)
			if (held) {
				holdSwipeBack()
			}
		},
		[holdSwipeBack],
	)

	let play = useCallback(() => {
		startStation(id)
	}, [startStation, id])

	let openSchedule = useCallback(() => {
		router.navigate(scheduleHref)
	}, [router, scheduleHref])

	let callStation = useCallback(() => {
		callPhone(stationNumber, {title: stationName})
	}, [stationName, stationNumber])

	let openStreamWebsite = useCallback(() => {
		openUrl(playerUrl)
	}, [playerUrl])

	let error = streamError ? (
		<Text style={styles.status}>
			Error Code {streamError.code}: {streamError.message}
		</Text>
	) : null

	let textColor = {color: theme.textColor}
	let titleBlock = (
		<View style={styles.titleWrapper}>
			<Text selectable={true} style={[styles.heading, textColor]}>
				{title}
			</Text>
			<Text selectable={true} style={[styles.subHeading, textColor]}>
				{stationName}
			</Text>

			{error}
		</View>
	)

	let controlsBlock = (
		<Row>
			<PlayButton
				onLink={openStreamWebsite}
				onStop={stop}
				onPlay={play}
				state={playState}
				stationName={stationName}
			/>
			<View style={styles.spacer} />
			<CallButton onPress={callStation} stationName={stationName} />
			<View style={styles.spacer} />
			<ShowCalendarButton onPress={openSchedule} stationName={stationName} />
		</Row>
	)

	let {width, height} = useWindowDimensions()

	let sideways = width > height

	let logoSmallestDimension = Math.min(width / 1.5, height / 1.75)

	let root = [styles.root, sideways && landscape.root]
	let logoWrapper = [styles.logoWrapper, sideways && landscape.logoWrapper]

	return (
		<SafeAreaView edges={['left', 'right']} style={styles.screen}>
			<ScrollView
				contentContainerStyle={root}
				contentInsetAdjustmentBehavior="automatic"
				scrollEnabled={!logoHeld}
			>
				<View style={logoWrapper}>
					<ScratchableLogo
						key={logo.name}
						accessibilityLabel={`${stationName} logo, ${logo.name}`}
						image={logo.image}
						onHeldChange={handleLogoHeld}
						onSettle={settleSwipeBack}
						onTap={onPressLogo}
						playing={playState === 'playing'}
						labelColor={logo.labelColor}
						labelScale={logo.labelScale ?? 0.8}
						size={logoSmallestDimension}
					/>
				</View>

				<View style={styles.container}>
					{titleBlock}
					{controlsBlock}
				</View>
			</ScrollView>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
	},
	root: {
		flexDirection: 'column',
		alignItems: 'stretch',
		justifyContent: 'space-between',
		padding: 20,
	},
	container: {
		alignItems: 'center',
		flex: 1,
		marginTop: 20,
		marginBottom: 20,
	},
	logoWrapper: {
		alignItems: 'center',
		justifyContent: 'center',
		flex: 1,
	},
	titleWrapper: {
		alignItems: 'center',
		marginBottom: 20,
	},
	heading: {
		color: c.label,
		fontWeight: '600',
		fontSize: 28,
		textAlign: 'center',
	},
	subHeading: {
		marginTop: 5,
		color: c.label,
		fontWeight: '300',
		fontSize: 28,
		textAlign: 'center',
	},
	status: {
		fontWeight: '400',
		fontSize: 18,
		textAlign: 'center',
		color: c.orange,
		marginTop: 15,
		marginBottom: 5,
	},
	spacer: {
		width: 8,
	},
})

const landscape = StyleSheet.create({
	root: {
		padding: 20,
		flexDirection: 'row',
		alignItems: 'center',
	},
	logoWrapper: {
		flex: 0,
	},
})
