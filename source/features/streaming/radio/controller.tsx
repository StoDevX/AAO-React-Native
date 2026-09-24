import * as React from 'react'
import {useCallback, useEffect, useState} from 'react'
import {Image, ScrollView, StyleSheet, Text, View, useWindowDimensions} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import noop from 'lodash/noop'
import * as c from '@frogpond/colors'
import {callPhone} from '../../../components/call-phone'
import {Row} from '@frogpond/layout'
import {StreamPlayer} from './player'
import type {HtmlAudioError, PlayState} from './types'
import {theming, type RadioLogo} from './theme'
import {ActionButton, CallButton, ShowCalendarButton} from './buttons'
import {LogoButton} from './logo-button'
import {openUrl} from '@frogpond/open-url'
import {RecordLogo} from './record'
import {useNavigation, useRouter} from 'expo-router'

// If you want to fix the inline player, switch to `true`
const ALLOW_INLINE_PLAYER = false

type PlayButtonProps = {
	state: PlayState
	onPlay: () => unknown
	onPause: () => unknown
	onLink: () => unknown
	stationName: string
}

function PlayButton(props: PlayButtonProps): React.ReactNode {
	const {state, onPlay, onPause, onLink, stationName} = props

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
		case 'paused':
			return <ActionButton icon="play" onPress={onPlay} text="Listen" />

		case 'checking':
			return <ActionButton icon="ellipsis" onPress={onPause} text="Starting" />

		case 'playing':
			return <ActionButton icon="pause" onPress={onPause} text="Pause" />

		default:
			return <ActionButton icon="ladybug" onPress={noop} text="Error" />
	}
}

type Props = {
	/** The station's logos. With more than one, tapping the logo shows the next. */
	logos: [RadioLogo, ...RadioLogo[]]
	playerUrl: string
	stationNumber: string
	title: string
	scheduleHref: '/KSTOSchedule' | '/KRLXSchedule'
	stationName: string
	source: {
		useEmbeddedPlayer: boolean
		embeddedPlayerUrl: string
		streamSourceUrl: string
	}
}

export function RadioControllerView(props: Props): React.ReactNode {
	let {logos, ...screenProps} = props
	// Always the first logo on arrival; a tap's choice lasts only while the
	// screen is open.
	let [logoIndex, setLogoIndex] = useState(0)
	let logo = logos[logoIndex]
	let showNextLogo =
		logos.length > 1 ? () => setLogoIndex((index) => (index + 1) % logos.length) : undefined

	return (
		<theming.ThemeProvider theme={logo.theme}>
			<RadioScreen {...screenProps} logo={logo} onPressLogo={showNextLogo} />
		</theming.ThemeProvider>
	)
}

type RadioScreenProps = Omit<Props, 'logos'> & {
	logo: RadioLogo
	onPressLogo?: () => void
}

function RadioScreen(props: RadioScreenProps): React.ReactNode {
	const theme = theming.useTheme()
	const {source, title, stationName, logo, onPressLogo, scheduleHref, stationNumber, playerUrl} =
		props

	let router = useRouter()

	let [playState, setPlayState] = useState<PlayState>('paused')
	let [streamError, setStreamError] = useState<HtmlAudioError | null>(null)
	let [recordHeld, setRecordHeld] = useState(false)

	// iOS 26 and later go back on a swipe from anywhere on the screen, which a
	// scratch would trigger. The stack holding these tabs owns that gesture;
	// the left-edge swipe and the Back button still work.
	let navigation = useNavigation()
	useEffect(() => {
		navigation.getParent()?.setOptions({fullScreenGestureEnabled: !recordHeld})
	}, [navigation, recordHeld])

	let play = () => {
		setPlayState('checking')
	}

	let pause = () => {
		setPlayState('paused')
	}

	let handleStreamPlay = () => {
		setPlayState('playing')
	}

	let handleStreamPause = () => {
		setPlayState('paused')
	}

	let handleStreamEnd = () => {
		setPlayState('paused')
	}

	let handleStreamError = (e: {code: number; message: string}) => {
		setStreamError(e)
		setPlayState('paused')
	}

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
				onPause={pause}
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

	let playerBlock = ALLOW_INLINE_PLAYER ? (
		<StreamPlayer
			embeddedPlayerUrl={source.embeddedPlayerUrl}
			onEnded={handleStreamEnd}
			// onWaiting={this.handleStreamWait}
			onError={handleStreamError}
			// onStalled={this.handleStreamStall}
			onPause={handleStreamPause}
			onPlay={handleStreamPlay}
			playState={playState}
			streamSourceUrl={source.streamSourceUrl}
			style={styles.webview}
			useEmbeddedPlayer={source.useEmbeddedPlayer}
		/>
	) : null

	let {width, height} = useWindowDimensions()

	let sideways = width > height

	let logoSmallestDimension = Math.min(width / 1.5, height / 1.75)
	let logoSize = {
		width: logoSmallestDimension,
		height: logoSmallestDimension,
	}

	let root = [styles.root, sideways && landscape.root]
	let logoBorderColor = {borderColor: theme.imageBorderColor}
	let logoBg = {backgroundColor: theme.imageBackgroundColor}
	let logoStyle = [styles.logoBorder, logoSize, logoBorderColor, logoBg]
	let logoImage = <Image resizeMode="contain" source={logo.image} style={logoStyle} />
	let logoWrapper = [styles.logoWrapper, sideways && landscape.logoWrapper]

	return (
		<SafeAreaView edges={['left', 'right']} style={styles.screen}>
			<ScrollView
				contentContainerStyle={root}
				contentInsetAdjustmentBehavior="automatic"
				scrollEnabled={!recordHeld}
			>
				<View style={logoWrapper}>
					{logo.spins ? (
						<RecordLogo
							accessibilityLabel={`${stationName} logo, ${logo.name}`}
							image={logo.image}
							onHeldChange={setRecordHeld}
							onTap={onPressLogo}
							spinning={playState === 'playing'}
							style={logoStyle}
						/>
					) : onPressLogo ? (
						<LogoButton
							accessibilityLabel={`${stationName} logo, ${logo.name}`}
							onPress={onPressLogo}
						>
							{logoImage}
						</LogoButton>
					) : (
						logoImage
					)}
				</View>

				<View style={styles.container}>
					{titleBlock}
					{controlsBlock}
					{playerBlock}
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
	logoBorder: {
		borderRadius: 6,
		borderColor: c.systemBackground,
		borderWidth: 3,
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
	webview: {
		display: 'none',
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
